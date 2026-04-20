# Lead Management CRM — Gap Analysis Report
**Generated:** 2026-04-20  
**Comparing:** Current Implementation vs PLAN.md Requirements

---

## Executive Summary

**Status:** 6 of 10 planned items are NOT implemented  
**Critical Gaps:** Bulk enrich (backend + frontend), headcount range filter, inline error UX, call_status field  
**Quick Fixes:** CORS config, Vercel paths, root README

---

## Detailed Gap Analysis

### ❌ GAP 1: Bulk Enrich — Backend (HIGH PRIORITY)

**Status:** NOT IMPLEMENTED  
**Files Affected:** `backend/models.py`, `backend/main.py`

**Missing:**
```python
# models.py - Missing classes:
class BulkEnrichRequest(BaseModel):
    lead_ids: list[int] = Field(..., min_length=1)

class BulkEnrichResponse(BaseModel):
    enriched: list[Lead]
    not_found: list[int]

# main.py - Missing:
def _enrich_lead(lead: Lead) -> Lead:  # Helper function
    lead.is_enriched = True
    lead.job_title = lead.job_title.title()
    return lead

@app.post("/leads/bulk-enrich", response_model=BulkEnrichResponse)  # Endpoint
```

**Current State:** Only single lead enrichment exists (`POST /leads/{id}/enrich`)  
**Required:** Best-effort bulk enrichment endpoint

---

### ❌ GAP 2: Bulk Enrich — API Service (HIGH PRIORITY)

**Status:** NOT IMPLEMENTED  
**File Affected:** `frontend/src/services/api.ts`

**Missing:**
```typescript
export interface BulkEnrichResponse {
  enriched: Lead[];
  not_found: number[];
}

export const bulkEnrichLeads = async (leadIds: number[]): Promise<BulkEnrichResponse> => {
  const response = await api.post<BulkEnrichResponse>('/leads/bulk-enrich', { lead_ids: leadIds });
  return response.data;
};
```

---

### ❌ GAP 3: Bulk Enrich — Frontend (HIGH PRIORITY)

**Status:** NOT IMPLEMENTED  
**File Affected:** `frontend/src/components/LeadTable.tsx`

**Missing Features:**
- [ ] Checkbox column (leftmost, before ID)
- [ ] `useState<Set<number>>(new Set())` for selection
- [ ] "Select all" checkbox in header (toggles visible rows only)
- [ ] "Enrich Selected (N)" button in filter bar
- [ ] Clear selection when filters change
- [ ] Loading spinner on bulk enrich button
- [ ] Inline message: "Enriched N leads (M not found)"
- [ ] Re-fetch table before showing message

**React State Management Pattern Required:**
```typescript
// Immutable Set updates — never mutate directly
setSelected(prev => new Set([...prev, id]))           // Add
setSelected(prev => new Set([...prev].filter(x => x !== id)))  // Remove
setSelected(allVisible ? new Set(visibleIds) : new Set())  // Toggle all
```

---

### ❌ GAP 4: Headcount Range Filter — Backend (MEDIUM PRIORITY)

**Status:** NOT IMPLEMENTED  
**File Affected:** `backend/main.py`

**Current Code:**
```python
@app.get("/leads")
def get_leads(
    industry: Optional[str] = Query(None),
    headcount: Optional[int] = Query(None)  # ← EXACT MATCH (WRONG)
):
    if headcount:
        filtered_leads = [l for l in filtered_leads if l.headcount == headcount]
```

**Required:**
```python
@app.get("/leads")
def get_leads(
    industry: Optional[str] = Query(None),
    min_headcount: Optional[int] = Query(None),  # ← NEW
    max_headcount: Optional[int] = Query(None),  # ← NEW
):
    if min_headcount:
        filtered_leads = [l for l in filtered_leads if l.headcount >= min_headcount]
    if max_headcount:
        filtered_leads = [l for l in filtered_leads if l.headcount <= max_headcount]
```

---

### ❌ GAP 5: Headcount Range Filter — Frontend (MEDIUM PRIORITY)

**Status:** NOT IMPLEMENTED  
**File Affected:** `frontend/src/components/LeadTable.tsx`

**Current Code:**
```typescript
<Input
    label="Headcount"
    placeholder="exact number..."
    type="number"
    value={filters.headcount}
    onChange={(e) => setFilters(prev => ({ ...prev, headcount: e.target.value }))}
/>
```

**Required:** Dropdown select with options:
| Label   | min_headcount | max_headcount |
|---------|---------------|---------------|
| All     | (none)        | (none)        |
| 1–50    | 1             | 50            |
| 51–200  | 51            | 200           |
| 201–1000| 201           | 1000          |
| 1000+   | 1000          | (none)        |

**API Service Update Required:**
```typescript
export const getLeads = async (
    industry?: string,
    min_headcount?: number,  // ← NEW
    max_headcount?: number   // ← NEW
) => { ... }
```

---

### ❌ GAP 6: Inline Error UX (MEDIUM PRIORITY)

**Status:** NOT IMPLEMENTED  
**Files Affected:** `frontend/src/components/AddLeadForm.tsx`, `frontend/src/components/LeadTable.tsx`

**Current Code (AddLeadForm.tsx line 33):**
```typescript
} catch (err) {
    console.error(err);
    alert('Failed to create lead');  // ← USING ALERT (WRONG)
}
```

**Required:**
```typescript
const [error, setError] = useState<string | null>(null);

// On catch:
setError('Failed to create lead. Please try again.');

// Render:
{error && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error}
    </div>
)}
```

**Also Required:** Inline error banners for LeadTable fetch errors and enrich errors

---

### ⚠️ GAP 7: Part C Rewrite — engineering_thinking.md (LOW PRIORITY)

**Status:** PARTIALLY IMPLEMENTED — NEEDS VERIFICATION  
**File:** `docs/engineering_thinking.md`

**Requirements from PLAN.md:**
1. ✅ WHY PostgreSQL (JSONB, full-text search, RLS) — ALREADY COVERED
2. ✅ WHY Celery (retries, Flower, horizontal scaling) — ALREADY COVERED  
3. ⚠️ Tradeoffs section — EXISTS BUT NEEDS VERIFICATION it mentions:
   - In-memory = data loss on cold start
   - Seed data reloads but user leads don't persist
   - Neon free tier as fix (0.5GB, 30-min setup)
4. ⚠️ 90-day sequencing — EXISTS BUT NEEDS VERIFICATION it has:
   - Integration tests FIRST
   - THEN CI/CD
   - THEN hire Senior Fullstack (not Junior)
5. ❓ WHY Temporal over Celery Beat — CHECK IF INCLUDED

**Recommendation:** Verify coverage, expand if needed

---

### ❌ GAP 8: Root README.md (QUICK FIX)

**Status:** NOT IMPLEMENTED  
**Missing File:** `README.md` at project root

**Required Content:**
- What it is (1 paragraph)
- Live URL (frontend + backend)
- How to run locally (2 commands)
- Tech stack (FastAPI, React, Vite, Tailwind, Vercel)
- Known limitation about in-memory storage

---

### ❌ GAP 9: CORS Fix (QUICK FIX)

**Status:** NOT FIXED  
**File:** `backend/main.py` (line 19)

**Current Code:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # ← REMOVE THIS LINE
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Required:** Remove `allow_credentials=True` — API has no auth/cookies

---

### ❌ GAP 10: Vercel Config Fix (QUICK FIX)

**Status:** NOT FIXED  
**File:** `backend/vercel.json`

**Current Code:**
```json
{
  "builds": [{ "src": "backend/main.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "backend/main.py" }]
}
```

**Required:**
```json
{
  "builds": [{ "src": "main.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "main.py" }]
}
```

**Reason:** Vercel root directory is set to `backend/`, so paths should be relative to that

---

### ❌ GAP 11: call_status Field (MEDIUM PRIORITY)

**Status:** NOT IMPLEMENTED  
**Files Affected:** `backend/models.py`, `backend/db.py`, `frontend/src/services/api.ts`, `frontend/src/components/LeadTable.tsx`

**Required Changes:**

1. **backend/models.py:**
```python
class Lead(LeadBase):
    id: int
    is_enriched: bool = False
    call_status: Optional[str] = None  # ← ADD
```

2. **backend/db.py:** Add `call_status=None` to seed data

3. **frontend/src/services/api.ts:**
```typescript
export interface Lead {
    ...
    call_status?: string | null;  // ← ADD
}
```

4. **frontend/src/components/LeadTable.tsx:**
- Add "Call Status" column
- Display `—` when null

---

## Summary Table

| # | Item | Priority | Status | Effort |
|---|------|----------|--------|--------|
| 1 | Bulk Enrich Backend | HIGH | ❌ Not Implemented | ~30 min |
| 2 | Bulk Enrich API Service | HIGH | ❌ Not Implemented | ~10 min |
| 3 | Bulk Enrich Frontend | HIGH | ❌ Not Implemented | ~45 min |
| 4 | Headcount Range Backend | MEDIUM | ❌ Not Implemented | ~15 min |
| 5 | Headcount Range Frontend | MEDIUM | ❌ Not Implemented | ~20 min |
| 6 | Inline Error UX | MEDIUM | ❌ Not Implemented | ~20 min |
| 7 | Part C Rewrite | LOW | ⚠️ Needs Verification | ~10 min |
| 8 | Root README | QUICK | ❌ Not Implemented | ~10 min |
| 9 | CORS Fix | QUICK | ❌ Not Fixed | ~2 min |
| 10 | Vercel Config | QUICK | ❌ Not Fixed | ~2 min |
| 11 | call_status Field | MEDIUM | ❌ Not Implemented | ~15 min |

**Total Estimated Effort:** ~3 hours

---

## Recommended Implementation Order

### Phase 1: Quick Fixes (15 min)
1. Fix CORS (remove `allow_credentials=True`)
2. Fix Vercel config paths
3. Create root README.md

### Phase 2: Backend Core (30 min)
4. Add call_status field to models
5. Add headcount range filter (min/max)
6. Implement bulk enrich endpoint + _enrich_lead helper
7. Update seed data with call_status=None

### Phase 3: Frontend Core (60 min)
8. Add call_status to Lead interface
9. Add call_status column to LeadTable
10. Replace headcount input with dropdown
11. Implement checkbox selection + bulk enrich button
12. Add inline error states

### Phase 4: Polish (15 min)
13. Verify engineering_thinking.md coverage
14. Test all endpoints
15. Build and verify

---

## Verification Commands

```bash
# Test bulk enrich endpoint
curl -X POST http://localhost:8000/leads/bulk-enrich \
  -H "Content-Type: application/json" \
  -d '{"lead_ids": [1, 2, 999]}'

# Test headcount range filter
curl "http://localhost:8000/leads?min_headcount=1&max_headcount=50"

# Check call_status in response
curl http://localhost:8000/leads | grep -o '"call_status":"[^"]*"'
```
