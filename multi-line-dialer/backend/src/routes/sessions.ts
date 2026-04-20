import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sessionsStore, callsStore, crmActivitiesStore } from '../db';
import { startSession, stopSession } from '../dialerEngine';
import { DialerSession } from '../types';

const router = Router();

// POST /sessions — create a new dialer session
router.post('/', (req, res) => {
  const { leadIds, agentId } = req.body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: 'leadIds must be a non-empty array' });
  }

  const session: DialerSession = {
    id: uuid(),
    agentId: agentId || 'agent-1',
    leadQueue: [...leadIds],
    concurrency: 2,
    activeCallIds: [],
    winnerCallId: undefined,
    status: 'STOPPED',
    metrics: { attempted: 0, connected: 0, failed: 0, canceled: 0 },
  };

  sessionsStore.push(session);
  res.status(201).json(session);
});

// POST /sessions/:id/start
router.post('/:id/start', (req, res) => {
  const session = sessionsStore.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status === 'RUNNING') return res.status(409).json({ error: 'Already running' });

  startSession(session.id);
  res.json(session);
});

// POST /sessions/:id/stop
router.post('/:id/stop', (req, res) => {
  const session = sessionsStore.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  stopSession(session.id);
  res.json(session);
});

// GET /sessions/:id — enriched response for frontend polling
// Includes all calls for this session + per-call CRM activity status
router.get('/:id', (req, res) => {
  const session = sessionsStore.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const sessionCalls = callsStore.filter((c) => c.sessionId === session.id);
  const callsWithCRM = sessionCalls.map((call) => ({
    ...call,
    crmActivityCreated: crmActivitiesStore.some((a) => a.callId === call.id),
  }));

  res.json({ ...session, calls: callsWithCRM });
});

export default router;
