import { v4 as uuid } from 'uuid';
import { sessionsStore, callsStore } from './db';
import { CallRecord, DialerSession, CallStatusEnum } from './types';
import { crmSync } from './crmSync';

const OUTCOMES: { status: CallStatusEnum; weight: number }[] = [
  { status: 'CONNECTED',   weight: 30 },
  { status: 'NO_ANSWER',   weight: 25 },
  { status: 'BUSY',        weight: 25 },
  { status: 'VOICEMAIL',   weight: 20 },
];

function weightedRandom(): CallStatusEnum {
  const total = OUTCOMES.reduce((sum, o) => sum + o.weight, 0);
  let r = Math.random() * total;
  for (const o of OUTCOMES) {
    r -= o.weight;
    if (r <= 0) return o.status;
  }
  return 'NO_ANSWER';
}

function simulateCall(call: CallRecord, session: DialerSession): void {
  const duration = 3000 + Math.random() * 3000; // 3–6 seconds

  setTimeout(() => {
    try {
      // Guard: call may have been resolved (CANCELED_BY_DIALER) by another line's CONNECTED event
      if (call.status !== 'CONNECTING') return;

      // Session may have been stopped while this call was in-flight
      if (session.status === 'STOPPED') {
        if (call.status === 'CONNECTING') {
          call.status = 'CANCELED_BY_DIALER';
          call.endedAt = new Date();
          session.activeCallIds = session.activeCallIds.filter((id) => id !== call.id);
          session.metrics.canceled++;
          crmSync.sync(call);
        }
        return;
      }

      const outcome = weightedRandom();
      call.status = outcome;
      call.endedAt = new Date();
      session.metrics.attempted++;

      if (outcome === 'CONNECTED') {
        session.metrics.connected++;
        session.winnerCallId = call.id;
        // Cancel the other concurrent call (if still CONNECTING)
        const otherIds = session.activeCallIds.filter((id) => id !== call.id);
        otherIds.forEach((otherId) => {
          const other = callsStore.find((c) => c.id === otherId);
          if (other && other.status === 'CONNECTING') {
            other.status = 'CANCELED_BY_DIALER';
            other.endedAt = new Date();
            session.activeCallIds = session.activeCallIds.filter((id) => id !== otherId);
            session.metrics.canceled++;
            crmSync.sync(other);
          }
        });
      } else {
        session.metrics.failed++;
      }

      session.activeCallIds = session.activeCallIds.filter((id) => id !== call.id);
      crmSync.sync(call);

      console.log(`[call:${call.id}] ${call.status} for lead:${call.leadId}`);
      fillLines(session);
    } catch (err) {
      // Guard against any unexpected error in the callback — don't let the slot hang
      console.error(`[dialerEngine] unexpected error in call simulation:`, err);
      call.status = 'NO_ANSWER';
      call.endedAt = new Date();
      session.activeCallIds = session.activeCallIds.filter((id) => id !== call.id);
      session.metrics.failed++;
      crmSync.sync(call);
      fillLines(session);
    }
  }, duration);
}

export function fillLines(session: DialerSession): void {
  while (
    session.status === 'RUNNING' &&
    session.activeCallIds.length < session.concurrency &&
    session.leadQueue.length > 0
  ) {
    const leadId = session.leadQueue.shift()!;
    const call: CallRecord = {
      id: uuid(),
      leadId,
      sessionId: session.id,
      status: 'CONNECTING',
      startedAt: new Date(),
      providerCallId: `mock-${uuid().slice(0, 8)}`,
    };
    callsStore.push(call);
    session.activeCallIds.push(call.id);
    simulateCall(call, session);
  }

  // Auto-stop when queue and active slots are both empty
  if (session.activeCallIds.length === 0 && session.leadQueue.length === 0) {
    session.status = 'STOPPED';
    console.log(`[session:${session.id}] stopped. metrics:`, session.metrics);
  }
}

export function startSession(sessionId: string): void {
  const session = sessionsStore.find((s) => s.id === sessionId);
  if (!session || session.status === 'RUNNING') return;
  session.status = 'RUNNING';
  console.log(`[session:${session.id}] started, queue: ${session.leadQueue.length} leads`);
  fillLines(session);
}

export function stopSession(sessionId: string): void {
  const session = sessionsStore.find((s) => s.id === sessionId);
  if (!session || session.status === 'STOPPED') return;
  session.status = 'STOPPED';
  // In-flight setTimeout callbacks will check status === 'STOPPED' and cancel gracefully
  console.log(`[session:${session.id}] manually stopped`);
}
