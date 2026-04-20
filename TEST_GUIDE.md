# Quick Integration Test Guide

## 🚀 30-Second Smoke Test

### 1. Start Both Services
```bash
# Terminal 1 - CRM Backend
cd lead-management-crm/backend && uvicorn main:app --reload --port 8000

# Terminal 2 - Dialer Backend  
cd multi-line-dialer/backend && npm run dev
```

### 2. Run Automated Test
```bash
./test_integration.sh
```

Expected output: All tests passing with green [PASS] markers.

---

## 🧪 Manual Step-by-Step Test

If you prefer to run each step manually:

### Step 1: Create a Lead in CRM
```bash
curl -X POST http://localhost:8000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Prospect",
    "job_title": "CEO",
    "phone_number": "555-9999",
    "company": "TestCo",
    "email": "test@testco.com",
    "headcount": 100,
    "industry": "Technology"
  }'
```

### Step 2: Enrich the Lead
```bash
curl -X POST http://localhost:8000/leads/bulk-enrich \
  -H "Content-Type: application/json" \
  -d '{"lead_ids": [3]}'
```

### Step 3: Verify in CRM Dashboard
```bash
curl http://localhost:8000/leads | jq '.[] | {id, name, is_enriched, call_status}'
```

### Step 4: Create Dialer Session
```bash
curl -X POST http://localhost:3001/sessions \
  -H "Content-Type: application/json" \
  -d '{"leadIds": ["3"], "agentId": "agent-1"}'
```

### Step 5: Start Dialing
```bash
# Replace {session-id} with the ID from Step 4
curl -X POST http://localhost:3001/sessions/{session-id}/start
```

### Step 6: Watch It Work
```bash
# Poll every 2 seconds
watch -n 2 'curl -s http://localhost:3001/sessions/{session-id} | jq "{status, metrics, active_calls: .activeCallIds | length}"'
```

### Step 7: Check CRM Activities Created
```bash
curl http://localhost:3001/mock-crm/activities | jq '.'
```

---

## 📊 What to Verify

### In CRM (Port 8000)
- ✅ Lead created with all fields
- ✅ `is_enriched: true` after bulk enrich
- ✅ `call_status: null` initially (would be updated by dialer webhook in production)

### In Dialer (Port 3001)
- ✅ Session created with correct lead IDs
- ✅ Status changes: STOPPED → RUNNING → STOPPED
- ✅ 2 concurrent calls maximum
- ✅ Winner-call cancellation (one call cancels when other connects)
- ✅ All calls complete with CRM activity created

### Cross-System
- ✅ CRM lead phone numbers appear in dialer calls
- ✅ Call dispositions logged in mock CRM
- ✅ Session metrics sum correctly (attempted = connected + failed + canceled)

---

## 🐛 Troubleshooting

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| Connection refused | Services not running | Start both backends |
| CORS errors | Misconfigured CORS | Verify `allow_credentials` removed |
| 404 on dialer | Wrong lead IDs | Use IDs from CRM response |
| No activities created | crmSync not called | Check dialerEngine.ts simulation |
| Session stuck RUNNING | Logic error | Verify `fillLines()` auto-stop |

---

## 📈 Load Test (Optional)

Create 10 leads and dial them all:

```bash
# Create 10 leads
for i in {1..10}; do
  curl -s -X POST http://localhost:8000/leads \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Lead $i\", \"job_title\": \"Manager\", \"phone_number\": \"555-$i$i$i$i\", \"company\": \"Company$i\", \"email\": \"lead$i@company.com\", \"headcount\": $((i*10)), \"industry\": \"Tech\"}"
done

# Create session with leads 3-12
SESSION=$(curl -s -X POST http://localhost:3001/sessions \
  -H "Content-Type: application/json" \
  -d '{"leadIds": ["3","4","5","6","7","8","9","10","11","12"], "agentId": "bulk-test"}' | jq -r '.id')

# Start and monitor
curl -X POST http://localhost:3001/sessions/$SESSION/start
watch -n 1 "curl -s http://localhost:3001/sessions/$SESSION | jq '{status, metrics, queue: .leadQueue | length, active: .activeCallIds | length}'"
```

This will take ~30-45 seconds to complete all 10 calls with 2-line concurrency.

---

## 🎯 Success Criteria

✅ **PASS** if:
- All API calls return 200/201
- Session completes with status STOPPED
- At least 2 CRM activities created
- No JavaScript console errors
- Frontend tables display data correctly

❌ **FAIL** if:
- Any API returns 4xx/5xx
- Session status stuck RUNNING
- No activities created
- Console shows CORS or fetch errors
- Data doesn't sync between apps

---

## 📝 Next Steps

1. **Add webhook integration** so dialer auto-updates CRM `call_status`
2. **Add persistent database** so leads survive server restarts
3. **Add real-time WebSocket** for live call status updates
4. **Add TanStack Query** for better frontend state management
5. **Add authentication** to secure both APIs

Run `./test_integration.sh` now to verify everything works! 🎉
