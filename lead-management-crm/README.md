# Lead Management CRM

A lead management MVP built for an AI Sales Doctor take-home assignment. Manage leads, filter by industry and headcount, and enrich lead data.

## Live URLs

- **Frontend:** https://lead-management-crm.vercel.app
- **Backend:** https://lead-management-crm-api.vercel.app

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Deployment:** Vercel (frontend + serverless backend)

## Setup & Installation

### Clone the Repository
```bash
git clone https://github.com/rangganovsky/aisalesdr-assignment.git
cd aisalesdr-assignment/lead-management-crm
```

### Backend Setup
```bash
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

## Running Both Apps Together

Since this is a monorepo with `multi-line-dialer`, here's the port allocation:

| App | Frontend Port | Backend Port |
|-----|--------------|--------------|
| **lead-management-crm** | 5173 | 8000 |
| **multi-line-dialer** | 5174 | 3001 |

### Start CRM (Terminal 1 & 2)
```bash
# Terminal 1 - Backend
cd lead-management-crm/backend
source venv/bin/activate  # If using virtual environment
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd lead-management-crm/frontend
npm run dev  # Runs on http://localhost:5173
```

## Known Limitations

**In-Memory Storage:** Leads are stored in a Python list in memory. On Vercel cold starts, user-added leads reset to seed data — this is a documented MVP tradeoff. 

**Production Fix:** Use Neon PostgreSQL (free tier: 0.5GB) with SQLAlchemy async sessions. See `docs/engineering_thinking.md` for detailed architecture recommendations.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leads` | List leads with filters (industry, min_headcount, max_headcount) |
| POST | `/leads` | Create a new lead |
| POST | `/leads/{id}/enrich` | Enrich a single lead |
| POST | `/leads/bulk-enrich` | Bulk enrich multiple leads |
| POST | `/leads/by-phone/call-status` | Update call status by phone number (from dialer) |

## Integration with Multi-Line Dialer

The CRM receives real-time call status updates from the dialer:

```
multi-line-dialer (port 3001) ──▶ POST /leads/by-phone/call-status ──▶ CRM (port 8000)
```

**Call statuses:** CONNECTED, NO_ANSWER, BUSY, VOICEMAIL, CANCELED_BY_DIALER

To see this in action:
1. Open CRM frontend at http://localhost:5173
2. Open Dialer frontend at http://localhost:5174
3. Start a dialing session in the dialer
4. Watch the `call_status` column update in the CRM as calls complete!

## Features

- Lead listing with filters (industry text search, headcount range dropdown)
- Add new lead with form validation
- Single lead enrichment
- Bulk lead enrichment with checkbox selection
- Real-time filtering
- Inline error states (no alerts)
- **`call_status` field** — shows call outcomes synced from multi-line-dialer

## Documentation

- `docs/PLAN.md` - Implementation plan and scope
- `docs/engineering_thinking.md` - Architecture, scaling, and 90-day roadmap
- `docs/GAP_ANALYSIS.md` - Gap analysis vs plan
- `docs/MOCK_DATA.md` - Mock data details
- `../docs/DEPLOYMENT.md` - Deployment instructions (root docs)
- `../docs/MONOREPO_GUIDE.md` - Monorepo guide (root docs)
- `../docs/INTEGRATION_TESTING.md` - Integration testing (root docs)

## License

MIT
