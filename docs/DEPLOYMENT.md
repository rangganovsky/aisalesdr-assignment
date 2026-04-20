# Vercel Deployment Guide — Sales Automation Suite

Complete deployment guide for both **Lead Management CRM** and **Multi-Line Dialer** applications to Vercel.

## 📦 What You're Deploying

```
Sales Automation Suite/
├── lead-management-crm/
│   ├── backend/ (FastAPI)     → Deploys to Vercel Serverless
│   └── frontend/ (React+Vite) → Deploys to Vercel Static
│
└── multi-line-dialer/
    ├── backend/ (Node.js+Express) → Deploys to Vercel Serverless
    └── frontend/ (React+Vite)     → Deploys to Vercel Static
```

**Total: 4 Vercel Projects**

### 🎯 Monorepo Strategy

**Good news: You only need ONE GitHub repository!** Vercel supports deploying multiple projects from a single monorepo. Each project just points to a different root directory.

```
Your GitHub Repo (monorepo)
│
├── lead-management-crm/
│   ├── backend/          → Vercel Project: crm-backend
│   └── frontend/         → Vercel Project: crm-frontend
│
└── multi-line-dialer/
    ├── backend/          → Vercel Project: dialer-backend
    └── frontend/         → Vercel Project: dialer-frontend
```

Each Vercel project is linked to the **same repo** but uses a different **Root Directory**.

---

## Prerequisites

1. **One GitHub Repository** — Both apps in a single repo (monorepo)
2. **Vercel Account** — Sign up at [vercel.com](https://vercel.com) (free tier works)
3. **Git** — Everything committed and pushed

---

## Step 1: Push Code to GitHub

```bash
# From project root
git init
git add .
git commit -m "Initial commit - Sales Automation Suite"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## Step 2: Deploy Lead Management CRM

### 2.1 Deploy CRM Backend (FastAPI)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Project"**
3. Select your GitHub repository
4. Configure:
   - **Project Name**: `crm-backend`
   - **Framework Preset**: Other
   - **Root Directory**: `lead-management-crm/backend`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
5. Click **Deploy**

**Note the URL**: `https://crm-backend-xxx.vercel.app`

### 2.2 Deploy CRM Frontend (React)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import same repository
3. Configure:
   - **Project Name**: `crm-frontend`
   - **Framework Preset**: Vite
   - **Root Directory**: `lead-management-crm/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://crm-backend-xxx.vercel.app` (from 2.1)
5. Click **Deploy**

**Note the URL**: `https://crm-frontend-xxx.vercel.app`

### 2.3 Update CRM Backend CORS

Edit `lead-management-crm/backend/main.py`:

```python
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://crm-frontend-xxx.vercel.app",  # Your CRM frontend
]
```

Commit and push — Vercel auto-redeploys.

---

## Step 3: Deploy Multi-Line Dialer

### 3.1 Deploy Dialer Backend (Node.js)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import same repository
3. Configure:
   - **Project Name**: `dialer-backend`
   - **Framework Preset**: Other
   - **Root Directory**: `multi-line-dialer/backend`
   - **Build Command**: `npm run build` (compiles TypeScript)
   - **Output Directory**: `dist`
4. Click **Deploy**

**Note the URL**: `https://dialer-backend-xxx.vercel.app`

### 3.2 Deploy Dialer Frontend (React)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import same repository
3. Configure:
   - **Project Name**: `dialer-frontend`
   - **Framework Preset**: Vite
   - **Root Directory**: `multi-line-dialer/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://dialer-backend-xxx.vercel.app` (from 3.1)
5. Click **Deploy**

**Note the URL**: `https://dialer-frontend-xxx.vercel.app`

### 3.3 Update Dialer Backend CORS

Edit `multi-line-dialer/backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://dialer-frontend-xxx.vercel.app',  // Your dialer frontend
  ].filter(Boolean),
}));
```

Commit and push — Vercel auto-redeploys.

---

## Step 4: Cross-Application Integration (Optional)

To enable the dialer to update CRM leads automatically, add CRM backend URL to dialer:

### 4.1 Add CRM URL to Dialer Backend

Edit `multi-line-dialer/backend/src/server.ts`:

```typescript
// Add environment variable for CRM integration
const CRM_API_URL = process.env.CRM_API_URL || 'http://localhost:8000';

// Future: webhook endpoint to update CRM call_status
app.post('/webhooks/crm-sync', async (req, res) => {
  // This would call CRM to update lead.call_status
  // Implementation depends on CRM webhook support
});
```

### 4.2 Add Environment Variable in Vercel

1. Go to dialer-backend project → **Settings** → **Environment Variables**
2. Add:
   - **Name**: `CRM_API_URL`
   - **Value**: `https://crm-backend-xxx.vercel.app`
3. Redeploy

---

## Deployment Summary

| Project | Root Directory | Framework | URL Pattern |
|---------|---------------|-----------|-------------|
| CRM Backend | `lead-management-crm/backend` | FastAPI | `crm-backend-xxx.vercel.app` |
| CRM Frontend | `lead-management-crm/frontend` | Vite | `crm-frontend-xxx.vercel.app` |
| Dialer Backend | `multi-line-dialer/backend` | Express | `dialer-backend-xxx.vercel.app` |
| Dialer Frontend | `multi-line-dialer/frontend` | Vite | `dialer-frontend-xxx.vercel.app` |

---

## Environment Variables Reference

### CRM Frontend
| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://crm-backend-xxx.vercel.app` | CRM backend API URL |

### Dialer Frontend
| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://dialer-backend-xxx.vercel.app` | Dialer backend API URL |

### Dialer Backend (Optional)
| Variable | Value | Description |
|----------|-------|-------------|
| `CRM_API_URL` | `https://crm-backend-xxx.vercel.app` | For CRM integration webhooks |
| `FRONTEND_URL` | `https://dialer-frontend-xxx.vercel.app` | CORS origin |

---

## Testing Your Deployments

### Test CRM
```bash
# Backend health
curl https://crm-backend-xxx.vercel.app/

# List leads
curl https://crm-backend-xxx.vercel.app/leads

# Frontend
curl https://crm-frontend-xxx.vercel.app
```

### Test Dialer
```bash
# Backend health
curl https://dialer-backend-xxx.vercel.app/

# List leads
curl https://dialer-backend-xxx.vercel.app/leads

# Frontend
curl https://dialer-frontend-xxx.vercel.app
```

---

## Troubleshooting

### Issue: CORS Errors

**Symptom**: Browser console shows CORS errors

**Fix**: 
1. Verify frontend URLs are in backend CORS origins
2. Redeploy backends after CORS updates
3. Check for trailing slashes in URLs

### Issue: Environment Variables Not Working

**Symptom**: Frontend can't connect to backend

**Fix**:
1. Check `VITE_API_URL` is set (not `REACT_APP_API_URL` — Vite uses `VITE_` prefix)
2. Redeploy after setting environment variables
3. Verify URL is accessible: `curl $VITE_API_URL`

### Issue: Build Failures

**Symptom**: Deployment shows build error

**Fix**:
- **Backend**: Check `requirements.txt` (CRM) or `package.json` (Dialer) has all dependencies
- **Frontend**: Verify `vite.config.ts` exists and `dist` is output directory
- Check build logs in Vercel dashboard

### Issue: Cold Start Data Loss

**Symptom**: Leads disappear after idle period

**Cause**: In-memory storage on Vercel free tier

**Fix**:
- Keep tabs active during demos
- Use paid tier (no cold starts)
- Migrate to persistent database (see NOTES.md)

---

## Cost Monitoring

### Free Tier Limits
- **Bandwidth**: 100 GB/month across all projects
- **Serverless**: 100 GB-hours/month
- **Builds**: 100/day

### Check Usage
Go to: [vercel.com/dashboard/usage](https://vercel.com/dashboard/usage)

**4 projects** sharing the same quota — monitor usage if traffic increases.

---

## Custom Domains (Production)

To use custom domains:

1. **CRM Backend**: `api.crm.yourdomain.com`
2. **CRM Frontend**: `crm.yourdomain.com`
3. **Dialer Backend**: `api.dialer.yourdomain.com`
4. **Dialer Frontend**: `dialer.yourdomain.com`

Configure in each project: **Settings** → **Domains**

---

## FAQ

### Do I need separate GitHub repositories?

**No!** Use a single repository (monorepo). Each Vercel project just points to a different directory:

```
GitHub Repo: my-sales-suite/
├── lead-management-crm/
└── multi-line-dialer/

Vercel Projects:
- crm-backend → Root: lead-management-crm/backend
- crm-frontend → Root: lead-management-crm/frontend
- dialer-backend → Root: multi-line-dialer/backend
- dialer-frontend → Root: multi-line-dialer/frontend
```

**Advantages of monorepo:**
- ✅ Single codebase to maintain
- ✅ Atomic commits across both apps
- ✅ Shared documentation
- ✅ Easier CI/CD setup
- ✅ Code sharing between apps (if needed)

**When to use separate repos:**
- Different teams own each app
- Different deployment cycles
- Need separate issue tracking
- Apps are truly independent products

### Can I deploy from the same branch?

Yes! All 4 Vercel projects can track the same branch (e.g., `main`). When you push:

1. Vercel detects the commit
2. Each project checks if its **Root Directory** changed
3. Only changed projects redeploy

Example:
```bash
# Edit only CRM backend
git commit -m "Fix CRM auth"
# Only crm-backend redeploys automatically

# Edit both frontends
git commit -m "Update UI theme"
# Both frontends redeploy, backends unchanged
```

### What if I already have separate repos?

You can either:
1. **Keep them separate** — Deploy each repo independently
2. **Merge to monorepo** — `git subtree` or manual merge

For this project, monorepo is recommended because the apps are designed to work together.

### How do environment variables work with monorepo?

Each Vercel project has **independent environment variables**:

- `crm-frontend` project → `VITE_API_URL=https://crm-backend.vercel.app`
- `dialer-frontend` project → `VITE_API_URL=https://dialer-backend.vercel.app`

Even though the code is in one repo, each deployment is isolated.

### Can I preview deployments for all projects?

Yes! When you push to a non-main branch:
- Each project creates a **preview deployment**
- Preview URLs are independent (e.g., `crm-frontend-git-feature.vercel.app`)
- Test changes before merging to production

---

## Next Steps

1. ✅ Push code to ONE GitHub repository (monorepo)
2. ✅ Deploy all 4 projects from the same repo
3. ✅ Configure environment variables per project
4. ✅ Update CORS origins
5. ✅ Test cross-origin requests
6. 🎯 Add custom domains (optional)
7. 🎯 Set up GitHub Actions for CI/CD (optional)
8. 🎯 Migrate to persistent database (see NOTES.md)

---

## Quick Reference

```bash
# Deploy all projects (if using CLI — see DEPLOYMENT_CLI.md)
cd lead-management-crm/backend && vercel --prod
cd lead-management-crm/frontend && vercel --prod -e VITE_API_URL=https://crm-backend.vercel.app
cd multi-line-dialer/backend && vercel --prod
cd multi-line-dialer/frontend && vercel --prod -e VITE_API_URL=https://dialer-backend.vercel.app
```

---

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **FastAPI on Vercel**: [vercel.com/docs/frameworks/fastapi](https://vercel.com/docs/frameworks/fastapi)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

Happy deploying! 🚀
