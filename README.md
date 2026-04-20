# Sales Automation Suite

A complete sales automation platform with lead management and multi-line dialing capabilities.

## 🎯 What's Included

```
sales-automation-suite/  ← ONE GitHub repository (monorepo)
│
├── 📁 lead-management-crm/
│   ├── 📁 backend/      (FastAPI + Python)
│   └── 📁 frontend/     (React + TypeScript + Vite)
│
└── 📁 multi-line-dialer/
    ├── 📁 backend/      (Express + TypeScript + Node.js)
    └── 📁 frontend/     (React + TypeScript + Vite)
```

**4 Applications** in a single repository, designed to work together.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ and pip
- Git

### Run Locally

```bash
# 1. Clone (one repo for both apps!)
git clone https://github.com/rangganovsky/aisalesdr-assignment.git
cd aisalesdr-assignment

# 2. Start CRM Backend (Terminal 1)
cd lead-management-crm/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Start CRM Frontend (Terminal 2)
cd lead-management-crm/frontend
npm install
npm run dev

# 4. Start Dialer Backend (Terminal 3)
cd multi-line-dialer/backend
npm install
npm run dev

# 5. Start Dialer Frontend (Terminal 4)
cd multi-line-dialer/frontend
npm install
npm run dev
```

**Access:**
- CRM Frontend: http://localhost:5173
- CRM Backend API: http://localhost:8000
- Dialer Frontend: http://localhost:5174
- Dialer Backend API: http://localhost:3001

---

## 📦 Monorepo Structure

This is a **monorepo** — one GitHub repository containing multiple applications.

### Why Monorepo?

| Advantage | Explanation |
|-----------|-------------|
| **Unified Deployment** | All apps deploy together from one repo |
| **Cross-App Changes** | Single commit can update CRM + Dialer |
| **Shared Docs** | One place for architecture, testing, deployment guides |
| **Integration Testing** | Test both apps working together easily |
| **Code Sharing** | Share types, utilities between apps |

### How It Works with Vercel

**4 Vercel Projects** → **1 GitHub Repository**

```
GitHub Repo: sales-automation-suite/
│
├── lead-management-crm/backend/  →  Vercel: crm-backend
├── lead-management-crm/frontend/ →  Vercel: crm-frontend
├── multi-line-dialer/backend/    →  Vercel: dialer-backend
└── multi-line-dialer/frontend/   →  Vercel: dialer-frontend
```

Each Vercel project points to a different **Root Directory** in the same repo.

---

## 📚 Documentation

### Getting Started
- [`docs/MONOREPO_GUIDE.md`](docs/MONOREPO_GUIDE.md) — Why and how we use monorepo
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Deployment instructions

### Deployment
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Web UI deployment guide
- [`docs/DEPLOYMENT_CLI.md`](docs/DEPLOYMENT_CLI.md) — CLI deployment guide

### Testing & Integration
- [`docs/INTEGRATION_TESTING.md`](docs/INTEGRATION_TESTING.md) — Test both apps together
- [`docs/ARCHITECTURE_DIAGRAM.md`](docs/ARCHITECTURE_DIAGRAM.md) — Visual architecture

### Project-Specific Docs
- `lead-management-crm/NOTES.md` — CRM tradeoffs and roadmap
- `lead-management-crm/docs/PLAN.md` — CRM implementation plan
- `multi-line-dialer/NOTES.md` — Dialer tradeoffs and roadmap

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CRM Frontend                         │
│              (React + Vite + Tailwind)                  │
│                      Port 5173                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    CRM Backend                          │
│              (FastAPI + Python)                         │
│                      Port 8000                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Leads, Enrichment, Filters, CRM Activities    │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Lead IDs + Phone Numbers
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Dialer Backend                        │
│            (Express + Node.js + TypeScript)            │
│                      Port 3001                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  2-Line Dialer, Call Simulation, CRM Sync       │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Dialer Frontend                       │
│              (React + Vite + Tailwind)                │
│                      Port 5174                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Run Integration Tests
```bash
# Test both apps working together
./test_integration.sh
```

### Manual Testing
```bash
# Verify CRM
curl http://localhost:8000/leads

# Verify Dialer
curl http://localhost:3001/leads
```

---

## 🚢 Deployment

### Option 1: Vercel Web UI
See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

### Option 2: Vercel CLI
```bash
# Install
npm install -g vercel && vercel login

# Deploy all 4 projects
./deploy-all.sh
```

See [`docs/DEPLOYMENT_CLI.md`](docs/DEPLOYMENT_CLI.md)

### Deployed URLs
- **CRM Frontend**: `https://crm-frontend-xxx.vercel.app`
- **CRM Backend**: `https://crm-backend-xxx.vercel.app`
- **Dialer Frontend**: `https://dialer-frontend-xxx.vercel.app`
- **Dialer Backend**: `https://dialer-backend-xxx.vercel.app`

---

## 📊 Features

### Lead Management CRM
- ✅ Lead listing with 12+ mock leads
- ✅ Industry filtering (partial match)
- ✅ Headcount range filtering (1–50, 51–200, 201–1000, 1000+)
- ✅ Create new leads with validation
- ✅ Single lead enrichment
- ✅ Bulk lead enrichment with checkbox selection
- ✅ Inline error states (no alerts)
- ✅ `call_status` field for dialer integration

### Multi-Line Dialer
- ✅ 2-line concurrent call simulation
- ✅ 12 mock leads with phone numbers
- ✅ Weighted call outcomes (CONNECTED, NO_ANSWER, BUSY, VOICEMAIL)
- ✅ Winner-call cancellation
- ✅ CRM activity sync (mock)
- ✅ Session metrics tracking
- ✅ Real-time polling (1.5s)
- ✅ Auto-stop when complete

### Integration
- ✅ CRM provides leads with phone numbers
- ✅ Dialer creates activities in mock CRM
- ✅ Cross-app testing scenarios documented

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| CRM Backend | FastAPI, Python 3.11+, Pydantic |
| CRM Frontend | React 18, TypeScript, Vite, Tailwind CSS, Axios |
| Dialer Backend | Express, Node.js, TypeScript, UUID |
| Dialer Frontend | React 18, TypeScript, Vite, Tailwind CSS, Axios |
| Deployment | Vercel (Serverless + Static) |

---

## 🤝 Contributing

This is a take-home assignment project. For production use:

1. Migrate from in-memory to PostgreSQL
2. Add authentication (Auth0/Clerk)
3. Implement webhook integration between apps
4. Add real telephony (Twilio)
5. Set up CI/CD with GitHub Actions

See each app's `NOTES.md` for detailed roadmap.

---

## 📝 License

MIT

---

## 💡 Questions?

- **Monorepo?** See [`docs/MONOREPO_GUIDE.md`](docs/MONOREPO_GUIDE.md)
- **Deployment issues?** See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- **Testing both apps?** See [`docs/INTEGRATION_TESTING.md`](docs/INTEGRATION_TESTING.md)
