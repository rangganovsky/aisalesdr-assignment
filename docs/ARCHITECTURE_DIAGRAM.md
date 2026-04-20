# Integration Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SALES AUTOMATION SUITE                                  │
│                        (Lead Management + Multi-Line Dialer)                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌──────────────────────────────────┐          ┌─────────────────────────────────┐  │
│   │     LEAD MANAGEMENT CRM          │          │      MULTI-LINE DIALER         │  │
│   │        (Port 8000)               │          │         (Port 3001)            │  │
│   │                                  │          │                                │  │
│   │  ┌────────────────────────┐    │          │  ┌─────────────────────────┐    │  │
│   │  │  Lead Database         │    │          │  │  Dialer Engine          │    │  │
│   │  │  - 8+ seed leads       │    │          │  │  - 2-line concurrent    │    │  │
│   │  │  - Phone numbers       │◄───┼──(1)────►│  │  - Call simulation      │    │  │
│   │  │  - call_status field   │    │  Sync IDs  │  │  - 3-6s duration        │    │  │
│   │  │  - is_enriched flag    │    │          │  │  - Weighted outcomes    │    │  │
│   │  └────────────────────────┘    │          │  └─────────────────────────┘    │  │
│   │           │                      │          │           │                     │  │
│   │           │ (2) Bulk Enrich      │          │           │ (4) Execute         │  │
│   │           ▼                      │          │           ▼                     │  │
│   │  ┌────────────────────────┐    │          │  ┌─────────────────────────┐    │  │
│   │  │  Enrichment Logic      │    │          │  │  Session Manager        │    │  │
│   │  │  - title() job_title   │    │          │  │  - Queue: 4 leads       │    │  │
│   │  │  - is_enriched=true    │    │          │  │  - Active: 2 calls      │    │  │
│   │  │  - Dict O(1) lookup    │    │          │  │  - Metrics tracking     │    │  │
│   │  └────────────────────────┘    │          │  └─────────────────────────┘    │  │
│   │                                  │          │                                │  │
│   │  ┌────────────────────────┐    │          │  ┌─────────────────────────┐    │  │
│   │  │  Filter API            │    │          │  │  crmSync Service        │    │  │
│   │  │  - industry (partial)  │    │          │  │  - Idempotency guard    │    │  │
│   │  │  - headcount range     │    │          │  │  - Upsert contacts      │    │  │
│   │  │  - min/max params      │    │          │  │  - Create activities    │──┼──┼──►(5) Mock CRM
│   │  └────────────────────────┘    │          │  └─────────────────────────┘    │  │     Activities
│   │                                  │          │                                │  │
│   │  ┌────────────────────────┐    │          │  ┌─────────────────────────┐    │  │
│   │  │  Error UX              │    │          │  │  Winner Cancellation    │    │  │
│   │  │  - Inline banners      │    │          │  │  - When CONNECTED       │    │  │
│   │  │  - No alerts()         │    │          │  │  - Cancel other line    │    │  │
│   │  │  - Form validation     │    │          │  │  - CANCELED_BY_DIALER   │    │  │
│   │  └────────────────────────┘    │          │  └─────────────────────────┘    │  │
│   │                                  │          │                                │  │
│   └──────────────────────────────────┘          └─────────────────────────────────┘  │
│                  │                                              │                    │
│                  │ (3) Lead IDs + Phone Numbers                │ (6) Activity Data  │
│                  │                                              │                    │
│                  ▼                                              ▼                    │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                         INTEGRATION LAYER                                    │   │
│   │                                                                              │   │
│   │  ┌──────────────────────┐         ┌──────────────────────┐                │   │
│   │  │  Data Consistency    │         │  Reporting           │                │   │
│   │  │  - Lead ID mapping   │         │  - Call dispositions │                │   │
│   │  │  - Phone validation  │         │  - CRM activities    │                │   │
│   │  │  - Sync status       │         │  - Agent metrics     │                │   │
│   │  └──────────────────────┘         └──────────────────────┘                │   │
│   │                                                                              │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                      PRODUCTION INTEGRATION (Future)                       │   │
│   │                                                                              │   │
│   │  Webhook: Dialer ──POST /webhooks/call-complete──► CRM call_status update  │   │
│   │  Database: Shared PostgreSQL (leads table shared between apps)            │   │
│   │  Auth: JWT tokens shared across both APIs                                   │   │
│   │  Real-time: WebSocket for live call status updates                          │   │
│   │  Telephony: Twilio replaces setTimeout simulation                           │   │
│   │                                                                              │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

DATA FLOW SEQUENCE:
═══════════════════

(1) LEAD SYNC
    CRM exports: {id, name, phone, company, email, industry, headcount}
    Dialer imports: Lead IDs for session creation
    
(2) BULK ENRICH
    Request:  POST /leads/bulk-enrich {lead_ids: [1, 2, 3]}
    Process:  Dict lookup → _enrich_lead() → title() → Update DB
    Response: {enriched: [...], not_found: []}
    
(3) SESSION CREATION
    Request:  POST /sessions {leadIds: ["1", "2", "3", "4"], agentId: "agent-1"}
    Creates:  Session with leadQueue, concurrency=2, status=STOPPED
    
(4) DIALING EXECUTION
    Start:    POST /sessions/:id/start → status=RUNNING
    Process:  fillLines() → simulateCall() → weightedRandom()
    Max:      2 concurrent calls (activeCallIds.length ≤ 2)
    Outcomes: CONNECTED (30%), NO_ANSWER (25%), BUSY (25%), VOICEMAIL (20%)
    
(5) CRM SYNC (on every call completion)
    crmSync.sync(call):
      - Check idempotency (syncedCallIds Set)
      - Upsert mock CRM contact (if no crmExternalId)
      - Create CRM activity (type: 'CALL', disposition, notes)
      - Push to crmActivitiesStore AND mockCRMActivitiesStore
    
(6) REPORTING
    Query:    GET /mock-crm/activities
    Data:     [{leadId, disposition, createdAt, notes}, ...]
    Query:    GET /sessions/:id
    Data:     {metrics: {attempted, connected, failed, canceled}, calls: [...]}

CALL LIFECYCLE:
═══════════════

Lead ID ──► Session Queue ──► fillLines() ──► simulateCall()
                                        │
                                        ▼
                                    ┌─────────────┐
                                    │ CONNECTING  │◄── 3-6 seconds
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
              ┌─────────┐           ┌──────────┐           ┌───────────┐
              │CONNECTED│           │ NO_ANSWER│           │   BUSY    │
              │  (30%)  │           │  (25%)   │           │   (25%)   │
              └────┬────┘           └──────────┘           └───────────┘
                   │                                              │
                   │ Cancel other line                             │
                   ▼                                              ▼
         ┌──────────────────┐                           ┌──────────────┐
         │CANCELED_BY_DIALER│                           │  VOICEMAIL   │
         │   (1 call)       │                           │    (20%)     │
         └──────────────────┘                           └──────────────┘
                   │
                   │ crmSync.sync()
                   ▼
         ┌──────────────────┐
         │  CRM Activity    │
         │  type: 'CALL'    │
         │  disposition     │
         │  notes           │
         └──────────────────┘

METRICS CALCULATION:
════════════════════

attempted = Every call that completed (any outcome)
connected = Calls with status === 'CONNECTED'
failed    = NO_ANSWER + BUSY + VOICEMAIL
canceled  = CANCELED_BY_DIALER (winner cancelled these)

Invariant: attempted = connected + failed + canceled

Example (4 leads, 2 concurrent):
├─ Call 1: CONNECTED (winner) ──► connected++, cancels Call 2
├─ Call 2: CANCELED_BY_DIALER ──► canceled++
├─ Call 3: NO_ANSWER ──► failed++
└─ Call 4: BUSY ──► failed++

Result: attempted=4, connected=1, failed=2, canceled=1 ✓

VERIFICATION ENDPOINTS:
═══════════════════════

CRM (Port 8000):
  GET  /                    Health check
  GET  /leads               List all leads
  GET  /leads?industry=X    Filter by industry (partial match)
  GET  /leads?min_headcount=50&max_headcount=200  Range filter
  POST /leads               Create new lead
  POST /leads/bulk-enrich   Enrich multiple leads
  POST /leads/{id}/enrich   Enrich single lead

Dialer (Port 3001):
  GET  /                    Health check
  GET  /leads               List dialer leads
  POST /sessions            Create session
  POST /sessions/{id}/start Begin dialing
  POST /sessions/{id}/stop  Stop session
  GET  /sessions/{id}       Get session state + calls
  GET  /mock-crm/contacts   View CRM contacts created
  GET  /mock-crm/activities View CRM activities created
  GET  /leads/{id}/crm-activities  Per-lead activities

TEST COMMANDS:
══════════════

# Full automated test
./test_integration.sh

# Manual test - create lead
curl -X POST http://localhost:8000/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","job_title":"CEO","phone_number":"555-9999","company":"TestCo","email":"t@test.com","headcount":100,"industry":"Tech"}'

# Manual test - bulk enrich
curl -X POST http://localhost:8000/leads/bulk-enrich \
  -H "Content-Type: application/json" \
  -d '{"lead_ids":[3,4,5]}'

# Manual test - create dialer session
SESSION=$(curl -s -X POST http://localhost:3001/sessions \
  -H "Content-Type: application/json" \
  -d '{"leadIds":["3","4","5"],"agentId":"test"}' | jq -r '.id')
echo "Session: $SESSION"

# Manual test - start dialing
curl -X POST "http://localhost:3001/sessions/$SESSION/start"

# Manual test - monitor
curl "http://localhost:3001/sessions/$SESSION" | jq '{status, metrics}'

# Manual test - check activities
curl http://localhost:3001/mock-crm/activities | jq '.[] | {leadId, disposition}'
```

## Integration Test Results Format

```
════════════════════════════════════════════════════════════════
           INTEGRATION TEST: CRM + Multi-Line Dialer
════════════════════════════════════════════════════════════════

Phase 1: Create Leads [PASS]
  Created lead: 3 (Alice Johnson)
  Created lead: 4 (Bob Smith)
  CRM lead count: 6 total

Phase 2: Bulk Enrich [PASS]
  Enriched: 2 leads
  Not found: 0 leads
  is_enriched: true ✓

Phase 3: Filter Leads [PASS]
  Technology leads: 3
  Headcount 51-200: 2

Phase 4: Create Session [PASS]
  Session: a1b2c3d4
  Lead queue: 4 leads
  Concurrency: 2

Phase 5: Execute Dialing [PASS]
  [1/10] Status: RUNNING | Active: 2 | Metrics: 0/0/0/0
  [2/10] Status: RUNNING | Active: 2 | Metrics: 2/1/0/1
  [3/10] Status: RUNNING | Active: 2 | Metrics: 4/1/2/1
  [4/10] Status: STOPPED | Active: 0 | Metrics: 4/1/2/1
  Session completed!

Phase 6: Verify CRM Sync [PASS]
  CRM Activities: 4
  Mock Contacts: 4
  All calls logged ✓

Phase 7: Call Outcomes [PASS]
  Lead 3: CONNECTED (CRM: true)
  Lead 4: CANCELED_BY_DIALER (CRM: true)
  Lead 5: NO_ANSWER (CRM: true)
  Lead 6: BUSY (CRM: true)
  Disposition summary: 1 connected, 1 canceled, 2 other ✓

════════════════════════════════════════════════════════════════
                    ALL TESTS PASSED!
            Tests Passed: 7  |  Tests Failed: 0
════════════════════════════════════════════════════════════════
```
