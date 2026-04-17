# Vercel Deployment Error Resolution - Complete Journey

**Date:** April 13, 2026  
**Project:** royalguard-ai (Frontend + Backend Stack)  
**Status:** ✅ **RESOLVED**  
**Final Commit:** `7df2fe1`

---

## 📋 Executive Summary

Vercel deployment was failing with multiple layers of configuration errors. Through systematic debugging, we identified and fixed:

1. ❌ **maxDuration** timeout configuration (600s → 60s)
2. ❌ **Conflicting backend routing** (removed backend routes)
3. ❌ **Build command path errors** (relative path issues)

**Result:** Deployment now successful ✅

---

## 🔴 Initial Problem

### GitHub Status
```
All checks have failed
1 failing check

Vercel - Deployment failed — invalid maxDuration for plan
```

### Symptoms
- ❌ GitHub shows red X (deployment failed)
- ❌ Latest commit `6ee78b3` visible on Render
- ❌ Vercel still showing "Deployment failed"
- ❌ Render backend working fine, but Vercel frontend stuck

---

## 🔍 Layer 1: maxDuration Configuration Error

### Problem Identified
**File:** `vercel.json`  
**Issue:** `"maxDuration": 600` (10 minutes)

```json
"functions": {
  "backend/main.py": {
    "runtime": "python@3.12",
    "memory": 3008,
    "maxDuration": 600  ❌ TOO HIGH
  }
}
```

### Root Cause
Vercel Free tier (Hobby plan) has serverless function timeout limits:
- **Hobby:** 60 seconds max
- **Pro:** 300 seconds max
- **Enterprise:** 900+ seconds

**Your config:** 600 seconds → **Exceeds Hobby limit** 💥

### Fix Applied
**Commit:** `5c67ac3`

```json
"maxDuration": 60  ✅ COMPATIBLE
```

### Result
✅ Fixed the maxDuration error, but deployment **still failed** with new issues.

---

## 🔍 Layer 2: Backend Routing Conflict (CRITICAL)

### Problem Discovered
After investigating manually and via audit, found **contradictory Vercel configuration:**

**File:** `vercel.json` (original)
```json
{
  "functions": {
    "backend/main.py": {
      "runtime": "python@3.12",
      "memory": 3008,
      "maxDuration": 600
    }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/main.py" },
    { "src": "/auth(.*)", "dest": "backend/main.py" },
    { "src": "/contracts(.*)", "dest": "backend/main.py" },
    { "src": "/payments(.*)", "dest": "backend/main.py" },
    { "src": "/audit(.*)", "dest": "backend/main.py" },
    { "src": "/violations(.*)", "dest": "backend/main.py" },
    { "src": "/ingest(.*)", "dest": "backend/main.py" },
    { "src": "/data(.*)", "dest": "backend/main.py" },
    { "src": "/blockchain(.*)", "dest": "backend/main.py" },
    { "src": "/(.*)", "dest": "frontend/dist/index.html" }
  ]
}
```

### The Conflict

| Component | Instruction | Result |
|-----------|-------------|--------|
| `.vercelignore` | "Exclude backend/" | ❌ Don't deploy backend |
| `vercel.json` `functions` | "Deploy Python code" | ❌ Try to deploy backend |
| `vercel.json` `routes` | "Route to backend/main.py" | ❌ Expect backend to exist |

**Outcome:** Vercel can't satisfy all constraints → **Deployment fails** 💥

### Architecture Reality Check

Your actual setup:
```
Backend:  Running on Render   ✅ (https://royalguard-ai.onrender.com)
Frontend: Deploying to Vercel  ✅ (needs configuration)
```

**Solution:** Use **frontend-only deployment** on Vercel (backend already on Render)

### Fix Applied
**Commit:** `8c4a1bd` - "fix: remove conflicting backend routes - frontend only deployment to Vercel"

**Removed from vercel.json:**
```json
❌ "functions": { "backend/main.py": { ... } }
❌ { "src": "/api/(.*)", "dest": "backend/main.py" }
❌ { "src": "/auth(.*)", "dest": "backend/main.py" }
❌ { "src": "/contracts(.*)", "dest": "backend/main.py" }
❌ { "src": "/payments(.*)", "dest": "backend/main.py" }
❌ { "src": "/audit(.*)", "dest": "backend/main.py" }
❌ { "src": "/violations(.*)", "dest": "backend/main.py" }
❌ { "src": "/ingest(.*)", "dest": "backend/main.py" }
❌ { "src": "/data(.*)", "dest": "backend/main.py" }
❌ { "src": "/blockchain(.*)", "dest": "backend/main.py" }
```

**After Layer 2 Fix:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "routes": [
    { "src": "/(.*)", "dest": "frontend/dist/index.html" }
  ]
}
```

### Result
✅ Backend routing conflict resolved, but **build still failed** with new error:
```
sh: line 1: cd: frontend: No such file or directory
Error: Command "cd frontend && npm run build" exited with 1
```

---

## 🔍 Layer 3: Build Command Path Error (CRITICAL)

### Problem Discovered
Build logs revealed:
```
13:52:08.748 sh: line 1: cd: frontend: No such file or directory
13:52:08.752 Error: Command "cd frontend && npm run build" exited with 1
```

### Root Cause Analysis

**Vercel Configuration Chain:**
1. **Vercel Settings UI** → Root Directory = `frontend`
2. **vercel.json** → `buildCommand`: `"cd frontend && npm run build"`
3. **When Vercel Builds:**
   - Sets working directory to `frontend/` (from settings)
   - Executes: `cd frontend && npm run build`
   - Tries to: `cd frontend` **from inside `frontend/` folder**
   - Result: **Directory not found** 💥

### The Mistake
Path should be **relative to the Current Working Directory** (which is already `frontend/`):

```
❌ WRONG: cd frontend && npm run build
✅ RIGHT: npm run build
```

### Verified Configuration

**Vercel Settings (UI):**
```
Root Directory: frontend        ← CWD is already set to frontend/
Build Command: cd frontend ...  ← Tries to cd into frontend again
Output Directory: frontend/dist ← Should be "dist" (relative to frontend/)
```

### Fix Applied
**Commit:** `7df2fe1` - "fix: correct build command paths for frontend root directory"

**Updated vercel.json:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    { "src": "/(.*)", "dest": "index.html" }
  ]
}
```

**Why This Works:**
- ✅ `buildCommand`: `"npm run build"` → Runs in frontend/ context
- ✅ `outputDirectory`: `"dist"` → Relative to frontend/ (frontend/dist/)
- ✅ `routes` → SPA routing to index.html

---

## 📊 Complete Fix Timeline

| Step | Commit | Issue | Fix |
|------|--------|-------|-----|
| 1 | `5c67ac3` | maxDuration exceeded | Reduced 600 → 60 seconds |
| 2 | `8c4a1bd` | Backend routes conflict | Removed Python deployment config |
| 3 | `7df2fe1` | Build path error | Fixed relative paths for frontend root |

---

## ✅ Final Configuration (vercel.json)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    { "src": "/(.*)", "dest": "index.html" }
  ]
}
```

**.vercelignore (Already Correct):**
```
# Dependencies
node_modules/
npm-debug.log
yarn-error.log
pnpm-error.log

# Backend files (not needed for frontend)
backend/          ✅ Correctly excluded
/data/            ✅ Correctly excluded
generate_data.py  ✅ Correctly excluded
pyrightconfig.json ✅ Correctly excluded

# Git
.git/
.gitignore

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Environment
.env.local
.env.*.local

# Build outputs
dist/
```

---

## 🏗️ Final Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  USER BROWSER                            │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
    ┌─────────────┐          ┌──────────────────┐
    │   Vercel    │          │    Render        │
    │  (Frontend) │          │   (Backend API)  │
    │  vercel.app │◄────────►│  onrender.com    │
    └─────────────┘          └──────────────────┘
    
    Serves:                   Serves:
    ✅ React UI               ✅ FastAPI routes
    ✅ Static assets          ✅ Database queries
    ✅ SPA routing            ✅ Business logic
```

**API Communication:**
- Frontend calls: `https://royalguard-ai.onrender.com/api/...`
- Configured in: `frontend/.env.production`
- Value: `VITE_API_URL=https://royalguard-ai.onrender.com`

---

## 🧪 Verification Checklist

### Build Process
- ✅ Root Directory set to `frontend` in Vercel UI
- ✅ Build Command: `npm run build` (no cd needed)
- ✅ Output Directory: `dist` (relative to frontend/)
- ✅ Dependencies install correctly
- ✅ Vite builds dist/ folder

### Deployment
- ✅ No backend routing conflicts
- ✅ Static files deploy to Vercel CDN
- ✅ SPA routing works (all routes → index.html)
- ✅ Frontend successfully calls Render backend API

### API Integration
- ✅ `.env.production` points to Render URL
- ✅ `getApiBase.ts` has fallback logic
- ✅ Frontend and backend communicate correctly
- ✅ CORS headers configured on Render

---

## 📝 Key Learnings

### 1. Configuration Conflicts
**Lesson:** When multiple config files exist (`.vercelignore`, `vercel.json`, Vercel UI settings), ensure they work **together**, not against each other.

**Applied:** Removed Python deployment config that conflicted with `.vercelignore`

### 2. Relative Paths Matter
**Lesson:** When Root Directory is set in Vercel UI, all paths in `vercel.json` become relative to that directory.

**Applied:** Changed `cd frontend && npm run build` → `npm run build`

### 3. Timeout Limits by Plan
**Lesson:** Free tier has constraints. Plan limits before deploying Python/long-running tasks.

**Applied:** Reduced maxDuration for compatibility (though not needed for frontend-only)

---

## 🎯 Commits & Changes

### All Commits Applied
```
5c67ac3 - fix: reduce maxDuration to 60 seconds for vercel free tier compatibility
8c4a1bd - fix: remove conflicting backend routes - frontend only deployment to Vercel
7df2fe1 - fix: correct build command paths for frontend root directory
```

### Files Modified
```
✅ vercel.json (3 versions)
✅ frontend/.env.production (verified correct)
✅ frontend/src/lib/getApiBase.ts (verified correct)
```

### Files NOT Modified (Already Correct)
```
✅ .vercelignore
✅ frontend/package.json
✅ frontend/vite.config.ts
✅ backend/main.py (Render deployment)
✅ backend/requirements.txt
```

---

## 🚀 Deployment Status

### Current State
- ✅ Vercel: Frontend deployed successfully
- ✅ Render: Backend running (no changes needed)
- ✅ GitHub: Status checks passing (after syncing)
- ✅ Live URL: https://royalguard-ai.vercel.app

### Production URLs
- **Frontend:** https://royalguard-ai.vercel.app
- **Backend API:** https://royalguard-ai.onrender.com
- **GitHub Repo:** https://github.com/yashpoojari8706/royalguard-ai

---

## 📚 Related Files & Documentation

- [VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](VERCEL_DEPLOYMENT_TROUBLESHOOTING.md) - Original troubleshooting notes
- [vercel.json](vercel.json) - Final Vercel configuration
- [.vercelignore](.vercelignore) - Deployment exclusions
- [frontend/.env.production](frontend/.env.production) - Production environment variables

---

## ❓ FAQ

**Q: Why was backend on Render instead of Vercel?**  
A: Better for Python deployment. Vercel's serverless is optimized for Node.js. Render handles Python workloads better.

**Q: Could we deploy both to Vercel?**  
A: Yes, but would require restructuring Python code to `api/` directory and different configuration.

**Q: Why does frontend need to call backend API?**  
A: React frontend needs data. Backend provides API endpoints. They must communicate across services.

**Q: What if maxDuration issue returns?**  
A: It won't for frontend-only deployment. Frontend is static files (no execution timeout).

**Q: How does Vercel know to route to Render?**  
A: Through `VITE_API_URL` environment variable in `frontend/.env.production`. Frontend JavaScript sends requests to that URL.

---

## 🎉 Resolution Summary

### Problem
Vercel deployment completely failing with configuration errors

### Root Causes
1. **maxDuration:** Set too high for Hobby plan
2. **Backend routing:** Conflicting with `.vercelignore`
3. **Build paths:** Relative to wrong directory

### Solution
1. **Configure frontend-only deployment** on Vercel
2. **Remove Python backend config** from vercel.json
3. **Fix build command paths** for frontend root directory

### Result
✅ **Deployment successful**  
✅ **Frontend live on Vercel**  
✅ **Backend running on Render**  
✅ **Full stack operational**

---

**Resolved:** April 13, 2026  
**Total Resolution Time:** ~2 hours of systematic debugging  
**Final Status:** 🟢 **PRODUCTION READY**
