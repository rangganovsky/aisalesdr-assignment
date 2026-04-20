# 📦 Deployment Documentation Update Summary

## 🎯 Important: Monorepo Deployment

**You only need ONE GitHub repository** to deploy all 4 applications.

```
GitHub: your-name/sales-automation-suite/ (1 repo)
│
├── lead-management-crm/backend/   → Vercel: crm-backend.vercel.app
├── lead-management-crm/frontend/  → Vercel: crm-frontend.vercel.app
├── multi-line-dialer/backend/     → Vercel: dialer-backend.vercel.app
└── multi-line-dialer/frontend/    → Vercel: dialer-frontend.vercel.app

Total: 1 GitHub Repo → 4 Vercel Projects
```

See [`MONOREPO_GUIDE.md`](MONOREPO_GUIDE.md) for detailed explanation.

---

## What Changed

### Before (CRM-Only Docs)
```
lead-management-crm/docs/
├── DEPLOYMENT.md      ❌ (CRM only - removed)
└── DEPLOYMENT_CLI.md  ❌ (CRM only - removed)
```

### After (Both Apps + Monorepo)
```
docs/
├── DEPLOYMENT.md          ✅ (Both apps - created)
├── DEPLOYMENT_CLI.md      ✅ (Both apps - created)
└── MONOREPO_GUIDE.md      ✅ (Monorepo explanation - created)
```

---

## New Documentation Structure

### `docs/DEPLOYMENT.md` (Web Interface)

**4 Projects to Deploy:**
1. **CRM Backend** (`lead-management-crm/backend`) - FastAPI
2. **CRM Frontend** (`lead-management-crm/frontend`) - Vite/React
3. **Dialer Backend** (`multi-line-dialer/backend`) - Express/Node.js
4. **Dialer Frontend** (`multi-line-dialer/frontend`) - Vite/React

**Key Sections:**
- Step-by-step deployment instructions for all 4 projects
- Environment variables reference for each project
- Cross-application integration setup (CRM + Dialer)
- Troubleshooting for CORS, build failures, cold starts
- Cost monitoring (4 projects sharing free tier)
- Custom domains setup

### `docs/DEPLOYMENT_CLI.md` (Command Line)

**Features:**
- One-command deployment sequence
- `deploy-all.sh` automation script (included)
- CI/CD integration with GitHub Actions
- Common CLI commands reference
- Speed comparison: CLI vs Web Interface

---

## Quick Start

### Option 1: Web Interface (Beginner-Friendly)
```
1. Go to vercel.com/new
2. Import GitHub repo
3. Deploy 4 projects (see DEPLOYMENT.md)
4. Update CORS origins
5. Done!
```

### Option 2: CLI (Faster)
```bash
# Install CLI
npm install -g vercel && vercel login

# Run deployment script
cd /Users/rangga/Project/aisalesdr-assignment
./deploy-all.sh
```

### Option 3: Manual CLI Commands
```bash
cd lead-management-crm/backend && vercel --prod
cd lead-management-crm/frontend && vercel --prod -e VITE_API_URL=<url>
cd multi-line-dialer/backend && vercel --prod
cd multi-line-dialer/frontend && vercel --prod -e VITE_API_URL=<url>
```

---

## Environment Variables by Project

| Project | Variable | Value Example |
|---------|----------|---------------|
| CRM Frontend | `VITE_API_URL` | `https://crm-backend.vercel.app` |
| Dialer Frontend | `VITE_API_URL` | `https://dialer-backend.vercel.app` |
| Dialer Backend | `CRM_API_URL` | `https://crm-backend.vercel.app` (optional) |
| Dialer Backend | `FRONTEND_URL` | `https://dialer-frontend.vercel.app` (optional) |

---

## Important: CORS Configuration

After deployment, **must update** CORS origins in both backends:

### CRM Backend
File: `lead-management-crm/backend/main.py`
```python
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://crm-frontend-xxx.vercel.app",  # Add this
]
```

### Dialer Backend  
File: `multi-line-dialer/backend/src/server.ts`
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://dialer-frontend-xxx.vercel.app',  // Add this
  ].filter(Boolean),
}))
```

---

## Deployment Checklist

- [ ] Push code to GitHub
- [ ] Deploy CRM Backend → Note URL
- [ ] Deploy CRM Frontend with `VITE_API_URL` → Note URL
- [ ] Deploy Dialer Backend → Note URL
- [ ] Deploy Dialer Frontend with `VITE_API_URL` → Note URL
- [ ] Update CORS origins in both backends
- [ ] Push CORS updates (auto-redeploy)
- [ ] Test all 4 URLs are accessible
- [ ] Test cross-origin requests work
- [ ] (Optional) Set up custom domains
- [ ] (Optional) Configure GitHub Actions CI/CD

---

## Cost Considerations

**4 Projects × Vercel Free Tier = Shared Quota:**
- 100 GB/month bandwidth (all projects combined)
- 100 GB-hours serverless execution
- 100 builds/day

**Monitoring:** [vercel.com/dashboard/usage](https://vercel.com/dashboard/usage)

---

## Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| CORS error | Add frontend URL to backend CORS origins |
| 404 on API | Check `VITE_API_URL` has no trailing slash |
| Build fails | Verify `vercel.json` exists in project root |
| Data lost | Normal for in-memory DB — keep tab active |
| Env vars not working | Redeploy after setting variables |

---

## Files Updated

| File | Action | Description |
|------|--------|-------------|
| `docs/DEPLOYMENT.md` | ✅ Created | Web UI deployment for both apps |
| `docs/DEPLOYMENT_CLI.md` | ✅ Created | CLI deployment for both apps |
| `lead-management-crm/docs/DEPLOYMENT.md` | ❌ Removed | Replaced by root docs |
| `lead-management-crm/docs/DEPLOYMENT_CLI.md` | ❌ Removed | Replaced by root docs |

---

## Related Documentation

- `README.md` (root) — Project overview and quick start
- `lead-management-crm/README.md` — CRM-specific setup
- `multi-line-dialer/README.md` — Dialer-specific setup
- `docs/INTEGRATION_TESTING.md` — Testing both apps together
- `docs/ARCHITECTURE_DIAGRAM.md` — Visual architecture

---

Happy deploying both applications! 🚀
