# Monorepo vs Separate Repos — Deployment Guide

## Quick Answer: Use a Monorepo ✅

For this Sales Automation Suite, **one GitHub repository is recommended**.

---

## Visual Comparison

### Monorepo (Recommended) 📦

```
GitHub: github.com/you/sales-automation-suite/
│
├── lead-management-crm/
│   ├── backend/          ┐
│   └── frontend/         ├ 4 Vercel Projects
│                         │ (same repo, different directories)
└── multi-line-dialer/
    ├── backend/          ┤
    └── frontend/         ┘

Vercel Dashboard:
├── crm-backend      → Root: lead-management-crm/backend
├── crm-frontend     → Root: lead-management-crm/frontend  
├── dialer-backend   → Root: multi-line-dialer/backend
└── dialer-frontend  → Root: multi-line-dialer/frontend
```

**Single `git push` can update all 4 deployments**

---

### Separate Repos ❌ (Not Recommended)

```
GitHub:
├── crm-backend-repo/      → Vercel: crm-backend
├── crm-frontend-repo/     → Vercel: crm-frontend  
├── dialer-backend-repo/   → Vercel: dialer-backend
└── dialer-frontend-repo/  → Vercel: dialer-frontend

4 separate repos → 4 separate git operations
```

**Requires managing 4 git contexts**

---

## Why Monorepo for This Project?

### 1. Apps Are Designed to Work Together
- CRM provides leads → Dialer calls them
- Cross-app integration testing is essential
- Shared domain model (Leads, Contacts, Activities)

### 2. Atomic Changes
```bash
# Single commit can update both apps
git commit -m "Add call_status field to Lead model

- CRM: Add field to models.py
- Dialer: Update to sync call_status via webhook"

# Both changes deploy together
```

### 3. Shared Documentation
```
docs/
├── DEPLOYMENT.md           (both apps)
├── INTEGRATION_TESTING.md  (both apps)
├── ARCHITECTURE_DIAGRAM.md (both apps)
└── MOCK_DATA.md            (CRM)
```

### 4. Easier CI/CD
```yaml
# .github/workflows/deploy.yml
- Deploy CRM Backend
- Deploy CRM Frontend  
- Deploy Dialer Backend
- Deploy Dialer Frontend
# All from the same workflow
```

### 5. Code Sharing (Future)
```typescript
// Could share types between apps
import type { Lead } from '../../lead-management-crm/frontend/src/services/api'
```

---

## When to Use Separate Repos

Consider separate repos if:

| Scenario | Recommendation |
|----------|---------------|
| Different teams own each app | Separate repos with clear contracts |
| Apps have different release cycles | Separate repos, versioned APIs |
| True microservices (independent) | Separate repos, independent scaling |
| Need separate issue tracking | Separate repos, but link via PRs |
| Compliance/isolation required | Separate repos, access controls |

**This project**: Apps are coupled by design (CRM → Dialer integration). Monorepo is better.

---

## How Vercel Monorepo Works

### Project Linking

Each directory gets linked to a Vercel project:

```bash
cd lead-management-crm/backend
vercel --prod
# Creates: .vercel/project.json
# Content: {"orgId":"...","projectId":"crm-backend"}
```

`.vercel/project.json` is automatically added to `.gitignore`.

### Smart Builds

Vercel only builds projects whose **Root Directory** changed:

```
Commit: "Fix CRM filter bug"
Changed: lead-management-crm/frontend/src/components/LeadTable.tsx
Builds:  Only crm-frontend
Skips:   crm-backend, dialer-backend, dialer-frontend
```

### Git Integration

1. Push to GitHub
2. Vercel webhook fires
3. Each project checks: "Did my root directory change?"
4. Changed projects rebuild
5. Unchanged projects skip

---

## Setting Up Monorepo Deployment

### Step 1: One-Time Setup (4 commands)

```bash
# 1. CRM Backend
cd lead-management-crm/backend
vercel --prod
# → Creates project "crm-backend"

# 2. CRM Frontend  
cd lead-management-crm/frontend
vercel --prod -e VITE_API_URL=https://crm-backend.vercel.app
# → Creates project "crm-frontend"

# 3. Dialer Backend
cd multi-line-dialer/backend
vercel --prod
# → Creates project "dialer-backend"

# 4. Dialer Frontend
cd multi-line-dialer/frontend
vercel --prod -e VITE_API_URL=https://dialer-backend.vercel.app
# → Creates project "dialer-frontend"
```

### Step 2: Daily Workflow

```bash
# Make changes to any apps
git add .
git commit -m "Update both apps"
git push

# Vercel auto-deploys changed projects
```

### Step 3: Redeploy Single Project

```bash
cd lead-management-crm/backend  # or any directory
vercel --prod
# → Redeploys only this project
```

---

## GitHub Repository Structure

```
sales-automation-suite/  ← One repo
│
├── README.md              # Root overview
│
├── docs/                  # Shared documentation
│   ├── DEPLOYMENT.md
│   ├── DEPLOYMENT_CLI.md
│   ├── INTEGRATION_TESTING.md
│   └── ARCHITECTURE_DIAGRAM.md
│
├── lead-management-crm/
│   ├── backend/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── vercel.json    # Deploy: crm-backend
│   ├── frontend/
│   │   ├── src/
│   │   ├── package.json
│   │   └── vercel.json    # Deploy: crm-frontend
│   └── NOTES.md
│
├── multi-line-dialer/
│   ├── backend/
│   │   ├── src/
│   │   ├── package.json
│   │   └── vercel.json    # Deploy: dialer-backend
│   ├── frontend/
│   │   ├── src/
│   │   ├── package.json
│   │   └── vercel.json    # Deploy: dialer-frontend
│   └── NOTES.md
│
├── test_integration.sh    # Cross-app testing
└── .github/
    └── workflows/
        └── deploy.yml     # CI/CD for all 4 projects
```

---

## Common Questions

### Q: Will all projects rebuild on every commit?

**A:** No. Vercel only rebuilds projects whose files changed. Edit dialer frontend → Only dialer-frontend rebuilds.

### Q: Can I have different branches for different projects?

**A:** Yes, but complex. Each project can track a different branch, but monorepo works best with all tracking `main`.

### Q: What about environment variables?

**A:** Each Vercel project has its own env vars:
- Set in Vercel Dashboard, OR
- Set via CLI: `vercel env add KEY value`

### Q: Can I preview a branch before merging?

**A:** Yes:
```bash
git checkout feature/x
git push
cd lead-management-crm/frontend && vercel
# Creates preview deployment
```

### Q: How do I remove a project?

**A:**
```bash
cd lead-management-crm/backend
vercel rm crm-backend
```

### Q: Can I use npm workspaces or Turborepo?

**A:** Yes, but not required for this setup. Standard monorepo works fine.

---

## Migration: Separate Repos → Monorepo

If you already have separate repos:

```bash
# 1. Create new monorepo
mkdir sales-automation-suite
cd sales-automation-suite
git init

# 2. Add CRM as subtree
git subtree add --prefix=lead-management-crm \
  https://github.com/you/crm-repo.git main

# 3. Add Dialer as subtree  
git subtree add --prefix=multi-line-dialer \
  https://github.com/you/dialer-repo.git main

# 4. Push to new repo
git remote add origin https://github.com/you/sales-suite.git
git push -u origin main

# 5. Relink Vercel projects (one-time)
cd lead-management-crm/backend && vercel link
cd lead-management-crm/frontend && vercel link
cd multi-line-dialer/backend && vercel link
cd multi-line-dialer/frontend && vercel link
```

Or simply copy files manually if repos are small.

---

## Summary

| Approach | Repos | Vercel Projects | Recommended? |
|----------|-------|-----------------|--------------|
| **Monorepo** | 1 | 4 | ✅ Yes |
| Separate repos | 4 | 4 | ❌ Not for this project |

**Bottom line:** One GitHub repository, four Vercel projects, simple deployment workflow.
