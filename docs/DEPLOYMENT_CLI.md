# Vercel CLI Deployment Guide — Sales Automation Suite

Fast command-line deployment for both **Lead Management CRM** and **Multi-Line Dialer** applications.

## 🎯 Monorepo Deployment

**Single GitHub repository → 4 Vercel projects**

This guide assumes all code is in one repository (recommended):

```
my-sales-suite/ (GitHub repo)
├── lead-management-crm/
│   ├── backend/     → Deploys to: crm-backend.vercel.app
│   └── frontend/    → Deploys to: crm-frontend.vercel.app
└── multi-line-dialer/
    ├── backend/     → Deploys to: dialer-backend.vercel.app
    └── frontend/    → Deploys to: dialer-frontend.vercel.app
```

Each `vercel --prod` command creates/link a project within the same repo.

## Prerequisites

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

---

## Deploy Lead Management CRM

### Step 1: Deploy CRM Backend (FastAPI)

```bash
cd lead-management-crm/backend

# Deploy to production
vercel --prod

# Follow prompts:
# ? Set up and deploy? [Y/n] Y
# ? Which scope? [your-account]
# ? Link to existing project? [n]
# ? Project name? [crm-backend]
# ? Directory? [./]
# ? Override settings? [n]

# Copy the deployment URL from output
# Example: https://crm-backend-xxx.vercel.app
```

### Step 2: Deploy CRM Frontend (React+Vite)

```bash
cd lead-management-crm/frontend

# Deploy with environment variable
vercel --prod -e VITE_API_URL=https://crm-backend-xxx.vercel.app

# Follow prompts (similar to backend)
# Project name: crm-frontend

# Copy the deployment URL
# Example: https://crm-frontend-xxx.vercel.app
```

### Step 3: Update CORS in CRM Backend

Edit `lead-management-crm/backend/main.py`:

```python
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://crm-frontend-xxx.vercel.app",  # Add your URL
]
```

Redeploy:
```bash
cd lead-management-crm/backend
vercel --prod
```

---

## Deploy Multi-Line Dialer

### Step 4: Deploy Dialer Backend (Node.js+Express)

```bash
cd multi-line-dialer/backend

# Install dependencies first
npm install

# Deploy to production
vercel --prod

# Follow prompts:
# ? Set up and deploy? [Y/n] Y
# ? Project name? [dialer-backend]

# Copy the deployment URL
# Example: https://dialer-backend-xxx.vercel.app
```

### Step 5: Deploy Dialer Frontend (React+Vite)

```bash
cd multi-line-dialer/frontend

# Install dependencies
npm install

# Deploy with environment variable
vercel --prod -e VITE_API_URL=https://dialer-backend-xxx.vercel.app

# Follow prompts:
# ? Project name? [dialer-frontend]

# Copy the deployment URL
# Example: https://dialer-frontend-xxx.vercel.app
```

### Step 6: Update CORS in Dialer Backend

Edit `multi-line-dialer/backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://dialer-frontend-xxx.vercel.app',  // Add your URL
  ].filter(Boolean),
}));
```

Redeploy:
```bash
cd multi-line-dialer/backend
vercel --prod
```

---

## Optional: Cross-App Integration

To enable dialer → CRM updates:

### Add CRM URL to Dialer Environment

```bash
cd multi-line-dialer/backend

# Add environment variable
vercel env add CRM_API_URL production
# Enter value: https://crm-backend-xxx.vercel.app

# Redeploy to apply
vercel --prod
```

---

## One-Command Deploy Script

Save as `deploy-all.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Sales Automation Suite"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Deploy CRM Backend
echo -e "${BLUE}Deploying CRM Backend...${NC}"
cd lead-management-crm/backend
CRM_BACKEND_URL=$(vercel --prod --yes | grep -o 'https://[^ ]*' | tail -1)
echo -e "${GREEN}✓ CRM Backend: $CRM_BACKEND_URL${NC}"

# Deploy CRM Frontend
echo -e "${BLUE}Deploying CRM Frontend...${NC}"
cd ../frontend
CRM_FRONTEND_URL=$(vercel --prod --yes -e VITE_API_URL=$CRM_BACKEND_URL | grep -o 'https://[^ ]*' | tail -1)
echo -e "${GREEN}✓ CRM Frontend: $CRM_FRONTEND_URL${NC}"

# Deploy Dialer Backend
echo -e "${BLUE}Deploying Dialer Backend...${NC}"
cd ../../multi-line-dialer/backend
DIALER_BACKEND_URL=$(vercel --prod --yes | grep -o 'https://[^ ]*' | tail -1)
echo -e "${GREEN}✓ Dialer Backend: $DIALER_BACKEND_URL${NC}"

# Deploy Dialer Frontend
echo -e "${BLUE}Deploying Dialer Frontend...${NC}"
cd ../frontend
DIALER_FRONTEND_URL=$(vercel --prod --yes -e VITE_API_URL=$DIALER_BACKEND_URL | grep -o 'https://[^ ]*' | tail -1)
echo -e "${GREEN}✓ Dialer Frontend: $DIALER_FRONTEND_URL${NC}"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🎉 Deployment Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "CRM Backend:   $CRM_BACKEND_URL"
echo "CRM Frontend:  $CRM_FRONTEND_URL"
echo "Dialer Backend: $DIALER_BACKEND_URL"
echo "Dialer Frontend: $DIALER_FRONTEND_URL"
echo ""
echo "⚠️  Remember to update CORS origins in both backends!"
echo ""
```

Make executable and run:
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

---

## Monorepo FAQ

### Do I need separate repos for each project?

**No.** The script above works with a single repository. Each `vercel --prod` command either:
1. Creates a new Vercel project linked to the current directory, OR
2. Redeploys an existing linked project

All projects share the same GitHub repo but deploy independently.

### How does Vercel know which project to deploy?

When you run `vercel --prod` in a directory:
1. **First time**: Vercel asks "Link to existing project?" → Say "No" to create new
2. **Subsequent times**: Vercel remembers the link and redeploys the same project

The link is stored in `.vercel/project.json` (added to `.gitignore` automatically).

### What gets deployed on git push?

With Git integration enabled:
- Push to `main` → All 4 projects redeploy (production)
- Push to `feature/x` → All 4 projects create preview deployments
- Only changed directories trigger builds (smart detection)

### Can I deploy from different branches?

Yes:
```bash
# Deploy feature branch to preview
git checkout feature/new-ui
cd lead-management-crm/frontend && vercel

# Preview URL: crm-frontend-git-feature-new-ui.vercel.app
```

### Should I use separate repos instead?

**Monorepo (recommended for this project):**
- ✅ Atomic changes across CRM + Dialer
- ✅ Single source of truth
- ✅ Easier integration testing
- ✅ Shared docs and configs

**Separate repos (consider if):**
- Different teams own each app
- Apps deployed at different cadences
- Need separate issue tracking
- True microservices (independent lifecycles)

---

## Common CLI Commands

### Redeploy a Project
```bash
cd lead-management-crm/backend  # or any project directory
vercel --prod
```

### View All Deployments
```bash
vercel ls
```

### View Logs
```bash
# Live logs
vercel logs [project-name] --all

# Specific deployment
vercel logs https://crm-backend-xxx.vercel.app
```

### Environment Variables

```bash
# Add variable
cd project-directory
vercel env add VARIABLE_NAME production
# (interactive prompt for value)

# List variables
vercel env ls

# Remove variable
vercel env rm VARIABLE_NAME production
```

### Link/Unlink Projects

```bash
# Link local directory to existing Vercel project
vercel link

# Unlink
vercel unlink
```

### Preview Deployment (Non-Production)

```bash
# Deploy to preview (every push creates preview)
vercel

# Deploy specific branch
vercel --target=preview
```

### Open Project in Browser

```bash
vercel open
```

### Project Information

```bash
vercel inspect
```

---

## Troubleshooting CLI

### Issue: Command not found
```bash
npm install -g vercel
# Or use npx
npx vercel --prod
```

### Issue: Authentication expired
```bash
vercel logout
vercel login
```

### Issue: Wrong project linked
```bash
vercel unlink
vercel link
# Select correct project
```

### Issue: Build fails locally but works on Vercel
```bash
# Check vercel.json configuration
cat vercel.json

# Verify build command works locally
cd lead-management-crm/backend
vercel build
```

### Issue: Environment variables not applied
```bash
# Must redeploy after setting env vars
vercel --prod
```

---

## CI/CD Integration

### GitHub Actions

Add `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy CRM Backend
        run: |
          cd lead-management-crm/backend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy CRM Frontend
        run: |
          cd lead-management-crm/frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }} \
            -e VITE_API_URL=${{ secrets.CRM_BACKEND_URL }}
      
      - name: Deploy Dialer Backend
        run: |
          cd multi-line-dialer/backend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Dialer Frontend
        run: |
          cd multi-line-dialer/frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }} \
            -e VITE_API_URL=${{ secrets.DIALER_BACKEND_URL }}
```

Add `VERCEL_TOKEN` to GitHub Secrets:
```bash
vercel tokens create
# Copy token and add to GitHub: Settings → Secrets → New repository secret
```

---

## Speed Comparison: CLI vs Web

| Task | Web Interface | CLI |
|------|--------------|-----|
| Initial deploy | 5 min | 3 min |
| Redeploy | 3 min | 1 min |
| Set env vars | 2 min | 30 sec |
| View logs | 1 min | 10 sec |
| Batch deploy (4 projects) | 20 min | 5 min |

**CLI is ~4x faster** for managing multiple projects.

---

## Next Steps

1. ✅ Install Vercel CLI
2. ✅ Run deployment commands for all 4 projects
3. ✅ Note all deployment URLs
4. ✅ Update CORS origins in both backends
5. ✅ Test cross-origin requests
6. 🎯 Set up GitHub Actions for automatic deployments
7. 🎯 Configure custom domains

---

## Quick Reference Card

```bash
# 🎯 MONOREPO: All 4 projects deploy from ONE GitHub repository

# Install & login
npm i -g vercel && vercel login

# Deploy all 4 projects (run from repo root)
cd lead-management-crm/backend && vercel --prod
cd lead-management-crm/frontend && vercel --prod -e VITE_API_URL=<crm-backend-url>
cd multi-line-dialer/backend && vercel --prod
cd multi-line-dialer/frontend && vercel --prod -e VITE_API_URL=<dialer-backend-url>

# OR use automation script
cd /path/to/sales-automation-suite
./deploy-all.sh

# Daily commands (from any project directory)
vercel --prod                    # Redeploy current linked project
git push                         # Auto-redeploys changed projects
vercel ls                        # List all deployments
vercel logs                      # View logs
vercel env add KEY value         # Add env var

# Monorepo-specific
vercel link                      # Link directory to Vercel project
vercel unlink                    # Remove link
```

**Remember:** One repo → Four Vercel projects. Each project links to a different directory.

Happy deploying! 🚀
