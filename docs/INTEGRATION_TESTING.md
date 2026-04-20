# Integration Testing Flow — Multi-Line Dialer + Lead Management CRM

## Overview

This document describes an end-to-end testing scenario that demonstrates how the **Multi-Line Dialer** and **Lead Management CRM** applications integrate to form a complete sales workflow.

## Architecture Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SALES WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │  Lead Management │         │  Multi-Line      │                  │
│  │  CRM             │◄───────►│  Dialer          │                  │
│  │  (Port 8000)     │         │  (Port 3001)     │                  │
│  └──────────────────┘         └──────────────────┘                  │
│          │                              │                           │
│          │ 1. Pull leads with phone     │ 2. Create session         │
│          │    numbers                   │    with lead IDs          │
│          │                              │                           │
│          │ 4. Update call_status ◄──────┼ 3. Simulate calls         │
│          │    (via API call)            │    with outcomes          │
│          │                              │                           │
│          │ 5. Query CRM activities ────►│                           │
│          │    for reporting             │                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Integration Points

| Integration Point | Direction | Data Flow |
|-------------------|-----------|-----------|
| **Lead Sync** | CRM → Dialer | Leads with phone numbers exported to dialer |
| **Call Results** | Dialer → CRM | `call_status` field updated in CRM |
| **CRM Activities** | Dialer → CRM | Mock CRM receives activity records |
| **Reporting** | CRM ← Dialer | CRM queries dialer's CRM activities |

---

## Test Scenario: Complete Sales Call Campaign

### Prerequisites

1. **Both applications running:**
   ```bash
   # Terminal 1: Start CRM Backend
   cd lead-management-crm/backend
   uvicorn main:app --reload --port 8000
   
   # Terminal 2: Start Dialer Backend
   cd multi-line-dialer/backend
   npm run dev  # Port 3001
   
   # Terminal 3: Start CRM Frontend (optional for visual verification)
   cd lead-management-crm/frontend
   npm run dev  # Port 5173
   ```

2. **Verify both APIs are healthy:**
   ```bash
   curl http://localhost:8000/     # CRM: Welcome message
   curl http://localhost:3001/     # Dialer: Multi-Line Dialer API
   ```

---

## Phase 1: Setup — Add Leads to CRM

### Step 1.1: Create Test Leads in CRM

```bash
# Lead 1: High-priority prospect
curl -X POST http://localhost:8000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "job_title": "VP of Sales",
    "phone_number": "555-0101",
    "company": "TechCorp",
    "email": "alice@techcorp.com",
    "headcount": 250,
    "industry": "Technology"
  }'

# Lead 2: Medium-priority prospect
curl -X POST http://localhost:8000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "job_title": "CTO",
    "phone_number": "555-0102",
    "company": "HealthInc",
    "email": "bob@healthinc.com",
    "headcount": 150,
    "industry": "Healthcare"
  }'

# Lead 3: Low-priority prospect
curl -X POST http://localhost:8000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carol Williams",
    "job_title": "CEO",
    "phone_number": "555-0103",
    "company": "FinanceHub",
    "email": "carol@financehub.com",
    "headcount": 75,
    "industry": "Finance"
  }'

# Lead 4: International prospect
curl -X POST http://localhost:8000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "David Lee",
    "job_title": "Director of Engineering",
    "phone_number": "555-0104",
    "company": "StartupX",
    "email": "david@startupx.com",
    "headcount": 45,
    "industry": "Technology"
  }'

# Lead 5: Enterprise prospect
curl -X POST http://localhost:8000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Eve Martinez",
    "job_title": "CFO",
    "phone_number": "555-0105",
    "company": "LogisticsPro",
    "email": "eve@logisticspro.com",
    "headcount": 1200,
    "industry": "Logistics"
  }'
```

### Step 1.2: Verify Leads Created

```bash
curl http://localhost:8000/leads | jq '.'
```

**Expected Result:** 7 total leads (2 seed + 5 new)  
**What to Check:** All leads have `call_status: null`, `is_enriched: false`

---

## Phase 2: Lead Selection and Enrichment (CRM)

### Step 2.1: Filter Leads by Criteria

```bash
# Filter by industry: Technology
curl "http://localhost:8000/leads?industry=Technology" | jq '.'

# Filter by headcount range (51-200)
curl "http://localhost:8000/leads?min_headcount=51&max_headcount=200" | jq '.'
```

### Step 2.2: Bulk Enrich Selected Leads

```bash
# Enrich leads 3, 4, 5 (the newly created ones with IDs likely 3,4,5)
curl -X POST http://localhost:8000/leads/bulk-enrich \
  -H "Content-Type: application/json" \
  -d '{"lead_ids": [3, 4, 5]}' | jq '.'
```

**Expected Result:**
```json
{
  "enriched": [...],  // 3 leads with is_enriched: true, job_title title-cased
  "not_found": []     // Empty if all IDs exist
}
```

### Step 2.3: Verify Enrichment in CRM

```bash
curl http://localhost:8000/leads | jq '.[] | {id, name, is_enriched, job_title}'
```

**What to Check:**
- Enriched leads have `is_enriched: true`
- Job titles are title-cased (e.g., "Vp Of Sales" → "Vp Of Sales")

---

## Phase 3: Sync Leads to Dialer

### Step 3.1: Query CRM for Dialer-Ready Leads

```bash
# Get all enriched leads with phone numbers
curl "http://localhost:8000/leads" | jq '.[] | select(.is_enriched == true) | {id, name, phone_number, company, email}'
```

### Step 3.2: Create Dialer Session with Lead IDs

In a real integration, the dialer would fetch leads directly from CRM. For this test, we manually map CRM lead IDs to dialer leads.

```bash
# Create a dialer session with lead IDs 1, 3, 4, 5
# (Mix of seed and newly created leads)
curl -X POST http://localhost:3001/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "leadIds": ["1", "3", "4", "5"],
    "agentId": "agent-001"
  }' | jq '.'
```

**Expected Result:**
```json
{
  "id": "session-uuid-here",
  "agentId": "agent-001",
  "leadQueue": ["1", "3", "4", "5"],
  "concurrency": 2,
  "activeCallIds": [],
  "status": "STOPPED",
  "metrics": { "attempted": 0, "connected": 0, "failed": 0, "canceled": 0 }
}
```

**Record the session ID** for subsequent calls.

---

## Phase 4: Execute Dialing Session

### Step 4.1: Start the Dialing Session

```bash
# Start the session (replace with actual session ID from Step 3.2)
curl -X POST http://localhost:3001/sessions/{session-id}/start | jq '.'
```

**Expected Result:**
```json
{
  "status": "RUNNING",
  "leadQueue": ["3", "4"],  // 2 leads remaining (2 are being called)
  "activeCallIds": ["call-1", "call-2"],
  ...
}
```

### Step 4.2: Monitor Active Calls

```bash
# Poll every 1-2 seconds to watch calls progress
curl http://localhost:3001/sessions/{session-id} | jq '.'
```

**What to Watch:**
- `activeCallIds` array (max 2 concurrent calls)
- `calls` array showing each call's status progression:
  - `CONNECTING` → `CONNECTED`/`NO_ANSWER`/`BUSY`/`VOICEMAIL`
- `winnerCallId` set when a call connects
- `metrics` updating (attempted, connected, failed, canceled)

### Step 4.3: Observe Winner-Call Cancellation

When one call connects (winner), the other active call should be canceled:

```bash
# Watch for CANCELED_BY_DIALER status on the losing call
curl http://localhost:3001/sessions/{session-id} | jq '.calls[] | {id, status, leadId}'
```

**Expected Behavior:**
```
Time 0s:  2 calls in CONNECTING
Time 3s:  1 call CONNECTED (winner), 1 call CANCELED_BY_DIALER
Time 6s:  2 new calls in CONNECTING (queue refilled)
```

---

## Phase 5: Verify CRM Sync

### Step 5.1: Check CRM Activities Created

The dialer's `crmSync.sync()` creates activities in the mock CRM:

```bash
# Query dialer's mock CRM activities
curl http://localhost:3001/mock-crm/activities | jq '.'
```

**Expected Result:**
```json
[
  {
    "id": "activity-uuid",
    "leadId": "1",
    "crmExternalId": "contact-uuid",
    "type": "CALL",
    "callId": "call-uuid",
    "disposition": "CONNECTED",
    "notes": "Call connected at 2026-04-20T...",
    "createdAt": "2026-04-20T..."
  },
  ...
]
```

**What to Check:**
- One activity per completed call (including canceled calls)
- `disposition` matches call outcome (CONNECTED, NO_ANSWER, BUSY, VOICEMAIL, CANCELED_BY_DIALER)
- `crmExternalId` populated (contact created if lead had no external ID)

### Step 5.2: Verify Mock CRM Contacts Created

```bash
curl http://localhost:3001/mock-crm/contacts | jq '.'
```

**Expected Result:** New contacts created for leads that didn't have `crmExternalId`

### Step 5.3: Query Per-Lead Activities

```bash
# Get activities for a specific lead
curl http://localhost:3001/leads/1/crm-activities | jq '.'
```

---

## Phase 6: Update CRM Call Status (Simulated Integration)

In a real integration, the dialer would callback to CRM to update `call_status`. Let's simulate this:

### Step 6.1: Get Final Call Results from Dialer

```bash
curl http://localhost:3001/sessions/{session-id} | jq '.calls[] | {leadId, status, crmActivityCreated}'
```

### Step 6.2: Update CRM Lead call_status (Simulated Webhook)

```bash
# In a real scenario, this would be a webhook from dialer to CRM
# For testing, we manually verify the field exists

curl http://localhost:8000/leads | jq '.[] | {id, name, call_status}'
```

**Note:** In the current MVP, the `call_status` field exists but is not auto-updated by the dialer. A production integration would add a webhook endpoint to CRM:

```python
# Future CRM endpoint:
@app.post("/leads/{lead_id}/call-status")
def update_call_status(lead_id: int, status: str):
    lead = get_lead(lead_id)
    lead.call_status = status
    update_lead(lead_id, lead)
```

---

## Phase 7: Reporting and Verification

### Step 7.1: CRM Dashboard Verification

```bash
# Get all leads with enrichment and call status
curl http://localhost:8000/leads | jq '.[] | {
  id, 
  name, 
  company,
  is_enriched, 
  call_status,
  headcount,
  industry
}'
```

### Step 7.2: Dialer Session Metrics

```bash
# Final session state
curl http://localhost:3001/sessions/{session-id} | jq '{ 
  status, 
  metrics, 
  winnerCallId,
  completed_calls: (.calls | length)
}'
```

**Expected Final Metrics:**
```json
{
  "status": "STOPPED",
  "metrics": {
    "attempted": 4,
    "connected": 1,     // ~30% probability
    "failed": 2,        // ~70% probability (NO_ANSWER, BUSY, VOICEMAIL)
    "canceled": 1       // The losing concurrent call
  },
  "completed_calls": 4
}
```

### Step 7.3: Cross-System Data Consistency

| CRM Lead ID | Dialer Lead ID | Call Outcome | CRM Activity | call_status |
|-------------|----------------|--------------|--------------|-------------|
| 1 | 1 | CONNECTED | ✓ Created | Should be "CONNECTED" |
| 3 | 3 | NO_ANSWER | ✓ Created | Should be "NO_ANSWER" |
| 4 | 4 | CANCELED | ✓ Created | Should be "CANCELED_BY_DIALER" |
| 5 | 5 | BUSY/VOICEMAIL | ✓ Created | Should match outcome |

---

## Automated Test Script

Save this as `integration_test.sh`:

```bash
#!/bin/bash
set -e

echo "=== Integration Test: CRM + Dialer ==="

BASE_CRM="http://localhost:8000"
BASE_DIALER="http://localhost:3001"

# Phase 1: Create leads in CRM
echo "Creating test leads..."
LEAD1=$(curl -s -X POST $BASE_CRM/leads -H "Content-Type: application/json" -d '{
  "name": "Test Lead 1", "job_title": "CEO", "phone_number": "555-0001",
  "company": "TestCorp", "email": "test1@test.com", "headcount": 100, "industry": "Tech"
}' | jq -r '.id')

LEAD2=$(curl -s -X POST $BASE_CRM/leads -H "Content-Type: application/json" -d '{
  "name": "Test Lead 2", "job_title": "CTO", "phone_number": "555-0002",
  "company": "TestInc", "email": "test2@test.com", "headcount": 50, "industry": "Tech"
}' | jq -r '.id')

echo "Created leads: $LEAD1, $LEAD2"

# Phase 2: Enrich leads
echo "Enriching leads..."
curl -s -X POST $BASE_CRM/leads/bulk-enrich -H "Content-Type: application/json" \
  -d "{\"lead_ids\": [$LEAD1, $LEAD2]}" | jq -r '.enriched | length'

# Phase 3: Create dialer session
echo "Creating dialer session..."
SESSION=$(curl -s -X POST $BASE_DIALER/sessions -H "Content-Type: application/json" \
  -d "{\"leadIds\": [\"$LEAD1\", \"$LEAD2\"], \"agentId\": \"test-agent\"}" | jq -r '.id')
echo "Session: $SESSION"

# Phase 4: Start dialing
echo "Starting dialer session..."
curl -s -X POST $BASE_DIALER/sessions/$SESSION/start | jq -r '.status'

# Phase 5: Wait and monitor
echo "Monitoring calls (30 seconds)..."
for i in {1..6}; do
  sleep 5
  STATUS=$(curl -s $BASE_DIALER/sessions/$SESSION | jq -r '.status')
  METRICS=$(curl -s $BASE_DIALER/sessions/$SESSION | jq -r '.metrics | to_entries | map("\(.key):\(.value)") | join(", ")')
  echo "  [$i/6] Status: $STATUS | Metrics: $METRICS"
  if [ "$STATUS" = "STOPPED" ]; then
    break
  fi
done

# Phase 6: Verify results
echo ""
echo "=== Verification ==="

# Check CRM activities
ACTIVITIES=$(curl -s $BASE_DIALER/mock-crm/activities | jq 'length')
echo "CRM Activities created: $ACTIVITIES"

# Check session completion
FINAL_STATUS=$(curl -s $BASE_DIALER/sessions/$SESSION | jq -r '.status')
FINAL_METRICS=$(curl -s $BASE_DIALER/sessions/$SESSION | jq '.metrics')
echo "Final session status: $FINAL_STATUS"
echo "Final metrics: $FINAL_METRICS"

# Check CRM leads still exist
CRM_COUNT=$(curl -s $BASE_CRM/leads | jq 'length')
echo "CRM leads count: $CRM_COUNT"

echo ""
echo "=== Test Complete ==="
```

---

## Expected Test Results

### Success Criteria

1. ✅ All 5 test leads created in CRM
2. ✅ Bulk enrichment updated `is_enriched: true`
3. ✅ Dialer session created with 4 leads
4. ✅ Session ran to completion (status: STOPPED)
5. ✅ 2 concurrent calls executed (max concurrency = 2)
6. ✅ Winner-call cancellation occurred (1 call canceled when other connected)
7. ✅ All 4 calls have CRM activities created
8. ✅ CRM contacts created in mock CRM
9. ✅ Session metrics show attempted=4, connected≥0, failed≥0, canceled≥0
10. ✅ No errors in console logs

### Common Failure Scenarios

| Scenario | Symptom | Fix |
|----------|---------|-----|
| CORS error | Browser blocks requests | Verify `allow_credentials` removed from CRM CORS |
| Lead not found | Dialer shows 404 | Verify lead IDs match between systems |
| Activities not created | CRM activities empty | Check `crmSync.sync()` called in dialerEngine |
| Session stuck RUNNING | Queue empty but status RUNNING | Check `fillLines()` auto-stop logic |

---

## Data Flow Verification Matrix

| Step | CRM Data | Dialer Data | Mock CRM Data | Verification Method |
|------|----------|-------------|---------------|---------------------|
| 1. Create Leads | 7 leads | - | - | `GET /leads` (CRM) |
| 2. Bulk Enrich | 3 enriched | - | - | `POST /leads/bulk-enrich` |
| 3. Create Session | - | Session + 4 leads | - | `POST /sessions` |
| 4. Start Dialing | - | 2 active calls | - | `GET /sessions/:id` |
| 5. Call Complete | - | 4 completed | 4 activities | `GET /mock-crm/activities` |
| 6. Stop Session | - | status=STOPPED | - | `GET /sessions/:id` |

---

## Performance Benchmarks

| Metric | Expected | Notes |
|--------|----------|-------|
| Lead creation | < 100ms | In-memory operation |
| Bulk enrich (3 leads) | < 100ms | In-memory with dict lookup |
| Session creation | < 50ms | UUID generation |
| Call simulation | 3-6s | Configured in dialerEngine |
| Concurrent calls | Exactly 2 | Max concurrency enforced |
| CRM activity sync | < 10ms | In-memory append |
| Full campaign (4 leads) | ~30s | 4 calls × 3-6s + overlap |

---

## Next Steps for Production Integration

1. **Add Webhook Support**
   - CRM exposes `POST /webhooks/call-complete`
   - Dialer calls webhook when call completes
   - CRM updates `call_status` field automatically

2. **Persistent Database**
   - Replace in-memory stores with PostgreSQL
   - Both apps share lead data via database

3. **Real Telephony**
   - Replace `setTimeout` with Twilio integration
   - Webhook callbacks from Twilio to dialer

4. **Authentication**
   - JWT tokens shared between apps
   - Agent identity passed through requests

5. **Real-time Updates**
   - WebSocket/SSE for live call status
   - Replace polling with push notifications
