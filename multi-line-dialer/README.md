# Multi-Line Dialer

A 2-line concurrent call dialer with mock CRM sync.

## Setup & Installation

### Clone the Repository
```bash
git clone https://github.com/rangganovsky/aisalesdr-assignment.git
cd aisalesdr-assignment/multi-line-dialer
```

### Backend Setup
```bash
cd backend
npm install
npm run dev  # Runs on :3001
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on :5174
```

**Access:**
- Frontend: http://localhost:5174
- Backend API: http://localhost:3001

## Live URLs
- Backend: https://...railway.app
- Frontend: https://...vercel.app

## How it works
Select 1-8 leads → Create Session → Start → watch 2 lines dial simultaneously.
When a call connects, the other line is canceled and CRM activity is written.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /leads | List all 8 seeded leads |
| POST | /sessions | Create session with leadQueue |
| POST | /sessions/:id/start | Begin dialing simulation |
| POST | /sessions/:id/stop | Stop session (cancels active calls) |
| GET | /sessions/:id | Poll: session state + calls + CRM status |
| GET | /mock-crm/contacts | Inspect mock CRM contacts |
| GET | /mock-crm/activities | Inspect mock CRM activities |
| GET | /leads/:id/crm-activities | Per-lead activity history |

## Error/Rescue Registry

| Endpoint/Path | Error Case | Response |
|---|---|---|
| POST /sessions | empty leadIds | 400 "leadIds must be non-empty" |
| POST /sessions/:id/start | not found | 404 |
| POST /sessions/:id/start | already RUNNING | 409 "Already running" |
| GET /sessions/:id | not found | 404 |
| GET /leads/:id/crm-activities | lead not found | 404 |
| simulateCall() setTimeout | any uncaught error | catch → NO_ANSWER outcome, fillLines continues |
| crmSync.sync() | duplicate callId | idempotency guard, no-op |
| crmSync.sync() | lead not in store | silent return |

## Failure Modes Registry

| Codepath | Failure | Rescued? | Test | User Sees | Logged? |
|---|---|---|---|---|---|
| simulateCall timeout cb | uncaught error | Y (try/catch) | — | call shows NO_ANSWER | Y (console.error) |
| crmSync.sync() | duplicate call | Y (Set guard) | — | transparent | Y (console.log) |
| fillLines after stop | session STOPPED | Y (status check) | — | call → CANCELED | Y |
| GET /sessions/:id | session missing | Y (404) | — | "Session not found" | N |

## Known Limitations

1. State resets on server restart (in-memory)
2. setTimeout simulation ≠ real telephony
3. Polling lag up to 1.5s
4. Single-process idempotency only

## NOT in scope

| Item | Reason |
|---|---|
| Real telephony (Twilio) | Over-engineering for demo |
| Persistent DB | In-memory specified, noted as tradeoff |
| WebSocket/SSE | Polling specified in requirements |
| Auth/JWT | Not in spec |
| Unit/integration tests | Not required by assessment |
| Session list screen | Not in spec (only 2 screens) |
| Reconnect to Python CRM | Runtime coupling adds setup friction; standalone is cleaner for evaluator |
