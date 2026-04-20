# NOTES

## Tradeoffs

- **In-memory storage**: All data resets on server restart. Production fix: PostgreSQL + Prisma.
- **setTimeout simulation**: No real telephony. Outcome probabilities: 30% CONNECTED,
  25% NO_ANSWER, 25% BUSY, 20% VOICEMAIL. Production fix: Twilio webhook callbacks.
- **HTTP polling (1.5s)**: UI lags up to 1.5s behind server state. Production fix: WebSocket/SSE.
- **Idempotency via in-process Set**: Works for single process. Production fix: Redis SET or
  DB-backed idempotency table.
- **No auth**: Fine for demo. Production: JWT + agent authentication.
- **concurrency fixed to 2**: Hardcoded per spec. Production: configurable per agent/team.
- **Session stop lag**: POST /sessions/:id/stop sets status immediately, but active calls are still in-flight for up to 6s. They will self-cancel via the CONNECTING guard. Expected behavior — document this in the UI ("stopping...").
- **Railway free tier sleep**: Railway restarts the dyno after inactivity. In-memory state is wiped on restart. For a live demo, keep the tab open or use a paid tier to prevent cold-start resets.
- **winnerCallId**: Updated on every CONNECTED outcome — points to the most recently connected call across the session lifetime. Multiple connections are possible.

## What I'd do next

1. Persistent DB (Neon/Supabase + Prisma) — same argument as Python CRM
2. WebSocket/SSE for real-time UI (eliminates polling delay)
3. Session list screen + call history
4. Real telephony integration (Twilio Programmable Voice + webhook handlers)
5. Integration tests for dialer engine state machine

## AI Usage

- Claude Code: scaffolded data models, dialer engine state machine, crmSync service
- Verified manually: idempotency behavior (tested duplicate callId sync), stop-mid-session
  behavior (confirmed CANCELED_BY_DIALER fires on pending timeouts), React Set mutation
  (immutable update pattern applied throughout)
- TypeScript types: written and reviewed by hand — types are the spec contract
