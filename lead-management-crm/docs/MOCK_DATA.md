# Mock Data Summary — Lead Management CRM

## 📊 Overview

**Total Mock Leads:** 12  
**Original Seed:** 2 leads  
**Added:** 10 leads  

---

## Lead Distribution

### By Industry
| Industry | Count | Lead IDs |
|----------|-------|----------|
| Technology | 3 | 1, 3, 9 |
| Healthcare | 1 | 2 |
| Marketing | 1 | 4 |
| Enterprise Software | 1 | 5 |
| SaaS | 1 | 6 |
| Finance | 1 | 7 |
| Logistics | 1 | 8 |
| Cloud Computing | 1 | 9 |
| Human Resources | 1 | 10 |
| Startups | 1 | 11 |
| Customer Service | 1 | 12 |

### By Headcount Range
| Range | Count | Leads |
|-------|-------|-------|
| 1–50 | 2 | StartupX (25), ProductFirst (45) |
| 51–200 | 5 | Tech Corp (100), GrowthLabs (75), CloudNative (180), PeopleFirst HR (60), CustomerDelight (150) |
| 201–1000 | 3 | DataFlow (250), FinanceHub (350), Logistics Plus (800) |
| 1000+ | 2 | Health Inc (500), Enterprise Solutions (1200) |

### By Enrichment Status
| Status | Count | Lead IDs |
|--------|-------|----------|
| Enriched (is_enriched=true) | 6 | 2, 4, 6, 8, 10, 12 |
| Raw (is_enriched=false) | 6 | 1, 3, 5, 7, 9, 11 |

### By Call Status
| Status | Count | Lead IDs |
|--------|-------|----------|
| CONNECTED | 2 | 2, 12 |
| NO_ANSWER | 1 | 4 |
| BUSY | 1 | 6 |
| VOICEMAIL | 1 | 8 |
| CANCELED_BY_DIALER | 1 | 10 |
| null (not called) | 6 | 1, 3, 5, 7, 9, 11 |

---

## Complete Lead Details

### Lead 1 — John Doe (Seed)
- **Company:** Tech Corp
- **Title:** CEO
- **Industry:** Technology
- **Headcount:** 100
- **Phone:** 555-0101
- **Email:** john@techcorp.com
- **Enriched:** No
- **Call Status:** —

### Lead 2 — Jane Smith (Seed)
- **Company:** Health Inc
- **Title:** CTO
- **Industry:** Healthcare
- **Headcount:** 500
- **Phone:** 555-0102
- **Email:** jane@healthinc.com
- **Enriched:** Yes
- **Call Status:** CONNECTED

### Lead 3 — Michael Chen (NEW)
- **Company:** DataFlow Systems
- **Title:** VP of Engineering
- **Industry:** Technology
- **Headcount:** 250
- **Phone:** 555-0103
- **Email:** michael@dataflow.io
- **Enriched:** No
- **Call Status:** —

### Lead 4 — Sarah Williams (NEW)
- **Company:** GrowthLabs
- **Title:** Chief Marketing Officer
- **Industry:** Marketing
- **Headcount:** 75
- **Phone:** 555-0104
- **Email:** sarah@growthlabs.com
- **Enriched:** Yes
- **Call Status:** NO_ANSWER

### Lead 5 — Robert Johnson (NEW)
- **Company:** Enterprise Solutions
- **Title:** Director of Sales
- **Industry:** Enterprise Software
- **Headcount:** 1200
- **Phone:** 555-0105
- **Email:** robert@enterprise.com
- **Enriched:** No
- **Call Status:** —

### Lead 6 — Emily Brown (NEW)
- **Company:** ProductFirst
- **Title:** Head of Product
- **Industry:** SaaS
- **Headcount:** 45
- **Phone:** 555-0106
- **Email:** emily@productfirst.co
- **Enriched:** Yes
- **Call Status:** BUSY

### Lead 7 — David Martinez (NEW)
- **Company:** FinanceHub Pro
- **Title:** CEO
- **Industry:** Finance
- **Headcount:** 350
- **Phone:** 555-0107
- **Email:** david@financehub.com
- **Enriched:** No
- **Call Status:** —

### Lead 8 — Lisa Anderson (NEW)
- **Company:** Logistics Plus
- **Title:** VP of Operations
- **Industry:** Logistics
- **Headcount:** 800
- **Phone:** 555-0108
- **Email:** lisa@logisticsplus.net
- **Enriched:** Yes
- **Call Status:** VOICEMAIL

### Lead 9 — James Wilson (NEW)
- **Company:** CloudNative Inc
- **Title:** Chief Technology Officer
- **Industry:** Cloud Computing
- **Headcount:** 180
- **Phone:** 555-0109
- **Email:** james@cloudnative.io
- **Enriched:** No
- **Call Status:** —

### Lead 10 — Amanda Taylor (NEW)
- **Company:** PeopleFirst HR
- **Title:** Director of HR
- **Industry:** Human Resources
- **Headcount:** 60
- **Phone:** 555-0110
- **Email:** amanda@peoplefirst.com
- **Enriched:** Yes
- **Call Status:** CANCELED_BY_DIALER

### Lead 11 — Christopher Lee (NEW)
- **Company:** StartupX
- **Title:** Founder & CEO
- **Industry:** Startups
- **Headcount:** 25
- **Phone:** 555-0111
- **Email:** chris@startupx.io
- **Enriched:** No
- **Call Status:** —

### Lead 12 — Jennifer Garcia (NEW)
- **Company:** CustomerDelight
- **Title:** VP of Customer Success
- **Industry:** Customer Service
- **Headcount:** 150
- **Phone:** 555-0112
- **Email:** jennifer@customerdelight.co
- **Enriched:** Yes
- **Call Status:** CONNECTED

---

## Demo Use Cases

### Use Case 1: Filter by Industry
```bash
curl "http://localhost:8000/leads?industry=Technology"
# Returns: John Doe, Michael Chen, James Wilson
```

### Use Case 2: Filter by Headcount Range
```bash
curl "http://localhost:8000/leads?min_headcount=51&max_headcount=200"
# Returns: 5 leads (100, 75, 45, 180, 60, 150 headcount)
```

### Use Case 3: Bulk Enrich Unenriched Leads
```bash
curl -X POST http://localhost:8000/leads/bulk-enrich \
  -H "Content-Type: application/json" \
  -d '{"lead_ids": [1, 3, 5, 7, 9, 11]}'
# Enriches all 6 unenriched leads
```

### Use Case 4: Dialer Integration
```bash
# Create session with Technology leads
curl -X POST http://localhost:3001/sessions \
  -H "Content-Type: application/json" \
  -d '{"leadIds": ["1", "3", "9"], "agentId": "tech-specialist"}'
```

---

## Data Reset

Since this is an in-memory database, restarting the CRM backend will reset to this seed data:

```bash
# Stop the server
Ctrl+C

# Restart
uvicorn main:app --reload --port 8000

# Data is back to original 12 leads
```

---

## Next Steps

1. **Create more leads via API** — Use POST /leads to add more
2. **Test bulk enrich** — Try enriching subsets of leads
3. **Test filtering** — Verify industry and headcount filters work correctly
4. **Integration test** — Use these leads with the Multi-Line Dialer
