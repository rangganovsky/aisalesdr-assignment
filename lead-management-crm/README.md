# Lead Management CRM

A lead management MVP built for an AI Sales Doctor take-home assignment. Manage leads, filter by industry and headcount, and enrich lead data.

## Live URLs

- **Frontend:** https://lead-management-crm.vercel.app
- **Backend:** https://lead-management-crm-api.vercel.app

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Deployment:** Vercel (frontend + serverless backend)

## Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
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

## Features

- Lead listing with filters (industry text search, headcount range dropdown)
- Add new lead with form validation
- Single lead enrichment
- Bulk lead enrichment with checkbox selection
- Real-time filtering
- Inline error states (no alerts)

## Documentation

- `docs/PLAN.md` - Implementation plan and scope
- `docs/engineering_thinking.md` - Architecture, scaling, and 90-day roadmap
- `docs/DEPLOYMENT.md` - Deployment instructions
- `docs/GAP_ANALYSIS.md` - Gap analysis vs plan

## License

MIT
