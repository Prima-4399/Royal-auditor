# RoyalGuard AI - Vercel Deployment Complete Log

**Project**: RoyalGuard AI (Cogniify)  
**Frontend**: React 19 + Vite 6.2.0 + TypeScript  
**Backend**: FastAPI (Python) on Render  
**Deployment**: Vercel (Frontend) + Render (Backend)  
**Date**: April 4, 2026  
**Status**: In Progress - Final Clean Slate Needed

---

## EXECUTIVE SUMMARY

We've been debugging a Vercel deployment for the RoyalGuard AI frontend. The root cause is a combination of:
1. Git case-sensitivity issues (Windows vs Linux)
2. `.vercelignore` incorrectly blocking source files
3. Conflicting manual Vercel configuration

**Current State**: Code builds perfectly locally (2381 modules ✓), but Vercel deployment keeps failing.

**Next Step**: Delete Vercel project and reconnect with auto-detection.

---

## CHRONOLOGICAL JOURNEY

### Phase 1: Initial Crisis (Commit: de4ffca → a1d0f3b)

**Problem**: Vercel showing "Could not load /vercel/path0/frontend/src/lib/api - ENOENT"

**Actions Taken**:
```bash
# Switched from royalguard1-ai repo to royalguard-ai (correct repo)
# Cleaned dependency cache
git rm -r --cached node_modules
git rm package-lock.json
npm cache clean --force
npm install --prefer-offline  # 432 packages

# Fixed case-sensitivity
git config core.ignorecase false
git add -f "frontend/src/lib/"
git commit -m "Fix: Force lowercase lib folder case..."
git push
```

**Commits in this phase**:
- `de4ffca`: chore: update gitignore to exclude .env local files
- `e0a0f67`: fix: remove invalid comment from vercel.json
- `b72c2b0`: fix: correct vercel.json env variable format
- `12d695c`: fix: suppress chunk size warnings in vite build
- `b3cce50`: fix: use npm --prefix instead of cd in build command
- `9200ad3`: fix: use rootDirectory for monorepo frontend
- `098c97d`: fix: use build.sh script for monorepo - final solution
- `6926645`: fix: use root package.json build script instead of bash file
- `a1d0f3b`: fix: correct vercel.json schema - remove invalid properties

**Result**: Build errors persisted due to `.vercelignore` blocking files

---

### Phase 2: Dependency and Extension Resolution (Commit: 438c18a)

**Problem**: Vercel couldn't resolve imports without `.ts` extensions

**Actions Taken**:
```bash
# Updated vite.config.ts to resolve extensions
# Added to resolve section:
resolve: {
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
}

# Updated imports in App.tsx and Sidebar.tsx
git add -f frontend/src
git commit -m "fix: add extension resolution to vite config..."
git push
```

**Commits**:
- `438c18a`: fix: add extension resolution to vite config so imports work without .ts

**Result**: Local build works perfectly (npm run build from frontend → 2381 modules), but Vercel still fails

---

### Phase 3: Git Index Corruption Fixes (Commits: 2110706 → ba11355)

**Problem**: Files existed locally but weren't properly indexed in Git for Vercel to clone

**Actions Taken**:
```bash
# Force re-added lib folder
git add -f frontend/src/lib
git commit -m "fix: force add lib folder with correct file references"
git push

# Rebuilt entire git index for frontend/src
git rm -r --cached frontend/src
git add frontend/src
git commit -m "fix: rebuild git index for frontend/src with correct tracking"
git push
```

**Commits**:
- `7bbe462`: fix: re-index lib files with correct case sensitivity
- `2110706`: fix: force add lib folder with correct file references
- `41dd3f2`: fix: rebuild git index for frontend/src with correct tracking

**Discovery**: `.vercelignore` had `data/` which was blocking `frontend/src/data/mockData.ts` ❌

**Fix Applied**:
```bash
# Changed .vercelignore from:
# data/
# To:
/data/    # Only excludes ROOT /data/, not frontend/src/data/

git add .vercelignore
git commit -m "fix: exclude only root /data/ folder, not frontend/src/data"
git push
```

**Commits**:
- `ba11355`: fix: exclude only root /data/ folder, not frontend/src/data

**Result**: Still failing - Vercel configuration conflicts unclear

---

### Phase 4: Configuration Debugging (Current)

**Tests Performed**:

1. **Local Build Test** ✅ SUCCESS
```bash
cd frontend
npm run build
# Result: ✓ 2381 modules transformed
#         ✓ built in 9.98s
```

2. **Vercel Settings Verified**:
- Git connection: ✓ yashpoojari8706/royalguard-ai
- Framework: Vite (auto-detected or manual)
- Root Directory: Tried multiple configurations
  - With `frontend` + Root package.json delegation → Failed
  - With blank + root npm install → Failed (vite not found)
  - With `frontend` only → Failed

3. **Error Pattern**: Always gets past npm install, fails during `vite build`
```
[vite:load-fallback] Could not load /vercel/path0/frontend/src/data/mockData.ts
```

---

## KEY LEARNINGS

### 1. Windows vs Linux Case-Sensitivity Hell
- Windows Git: Case-insensitive (lib/ = Lib/)
- Linux Vercel: Case-sensitive (lib/ ≠ Lib/)
- **Solution**: `git config core.ignorecase false` + force re-add

### 2. .vercelignore Pattern Matching
- ❌ `data/` matches ANY `data/` folder at ANY level
- ✅ `/data/` only matches root `/data/` folder
- **This was the blocking issue** but didn't fully resolve it

### 3. Monorepo Configuration Conflicts
When Root Directory = `frontend`:
- Vercel installs dependencies in `frontend/`
- Vite is available in `frontend/node_modules/` ✓
- But configuration conflicts with `.vercelignore`

When Root Directory = blank:
- Vercel installs dependencies in root
- Vite is in `frontend/node_modules/` but not accessible ✗

---

## GIT COMMIT HISTORY (Complete)

```
ba11355 fix: exclude only root /data/ folder, not frontend/src/data
41dd3f2 fix: rebuild git index for frontend/src with correct tracking
438c18a fix: add extension resolution to vite config so imports work without .ts
2110706 fix: force add lib folder with correct file references
7bbe462 fix: re-index lib files with correct case sensitivity
6926645 fix: use root package.json build script instead of bash file
098c97d fix: use build.sh script for monorepo - final solution
9200ad3 fix: use rootDirectory for monorepo frontend
b3cce50 fix: use npm --prefix instead of cd in build command
12d695c fix: suppress chunk size warnings in vite build
b72c2b0 fix: correct vercel.json env variable format
e0a0f67 fix: remove invalid comment from vercel.json
de4ffca chore: update gitignore to exclude .env local files
(earlier commits for UI changes and initial setup)
```

---

## FILES MODIFIED FOR VERCEL

### Root Level Changes
- **package.json**: Created with build script
  ```json
  {
    "name": "royalguard-ai",
    "scripts": {
      "build": "npm --prefix frontend run build"
    }
  }
  ```

- **vercel.json**: Deployment configuration (currently problematic)
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": "frontend/dist"
  }
  ```

- **.vercelignore**: Fixed to not exclude frontend source
  ```
  /data/          # ✓ Only root data
  backend/        # ✓ Exclude backend
  node_modules/   # ✓ Standard exclusion
  ```

### Frontend Changes
- **frontend/vite.config.ts**: Added extension resolution
  ```typescript
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  }
  ```

- **frontend/src/App.tsx**: Updated imports with extensions
- **frontend/src/components/layout/Sidebar.tsx**: Updated imports

---

## ERROR MESSAGES ENCOUNTERED

### Error 1: Case-Sensitivity
```
Could not load /vercel/path0/frontend/src/lib/api - ENOENT
```
**Cause**: Git tracked `Lib/` on Windows, Linux expects `lib/`  
**Fix**: `git config core.ignorecase false` + force re-add

### Error 2: Schema Validation
```
vercel.json schema validation failed with the following message: 'env.VITE_API_URL' should be string
```
**Cause**: `env` object had nested structure instead of string value  
**Fix**: Changed to `"VITE_API_URL": "https://..."`

### Error 3: Path Duplication
```
npm error path /vercel/path0/frontend/frontend/package.json
```
**Cause**: `outputDirectory: "frontend/dist"` + `npm --prefix frontend` double-pathed  
**Fix**: Simplified to use root script delegation

### Error 4: File Not Found
```
[vite:load-fallback] Could not load /vercel/path0/frontend/src/data/mockData.ts
```
**Cause**: `.vercelignore` had `data/` blocking `frontend/src/data/`  
**Fix**: Changed to `/data/` (root only)  
**Status**: Still occurring - unknown why despite fix

### Error 5: Vite Not Found
```
sh: line 1: vite: command not found
```
**Cause**: Root Directory = blank, vite in `frontend/node_modules/` not accessible  
**Fix**: Set Root Directory back to `frontend`

---

## CURRENT VERCEL CONFIGURATION

**What Should Be Set**:
- Git Repository: `yashpoojari8706/royalguard-ai` ✓
- Branch: `main` ✓
- Root Directory: `frontend` (or unclear - needs cleaning)
- Build Command: `npm run build` or auto-detected
- Output Directory: `dist` or `frontend/dist`
- Environment Variables: None set (should be fine)

**Issue**: Configuration is unclear and conflicting. Hence the need for clean slate.

---

## LOCAL BUILD VERIFICATION ✅

```bash
cd d:\SCIENCE\DJS AIML\Cogniify\royalguard-ai\frontend
npm run build

# OUTPUT:
# > my-app@0.0.0 build
# > vite build
# vite v6.4.1 building for production...
# transforming...
# ✓ 2381 modules transformed.
# dist/index.html                              0.69 kB │ gzip:   0.39 kB
# dist/assets/index-D9-ZB_fx.css             123.53 kB │ gzip:  20.86 kB
# dist/assets/index.es-BZ1dFuYl.js           159.60 kB │ gzip:  53.51 kB
# dist/assets/html2canvas.esm-QH1iLAAe.js    202.38 kB │ gzip:  48.04 kB
# dist/assets/index-0gvOll89.js            1,059.90 kB │ gzip: 336.05 kB
# ✓ built in 9.98s
```

**Conclusion**: Code is production-ready. Vercel configuration is the problem.

---

## NEXT STEPS - FINAL SOLUTION

### Step 1: Delete Vercel Project (Backend stays)
1. Go to Vercel Dashboard
2. Settings → Danger Zone → Delete Project
3. Confirm deletion
4. ⚠️ Note: Render backend (https://royalguard-api.onrender.com) is unaffected

### Step 2: Fresh Deployment with Auto-Detection
1. Go to GitHub: https://github.com/yashpoojari8706/royalguard-ai
2. Click "Deploy to Vercel" or authorize Vercel to GitHub
3. Select `royalguard-ai` repository
4. **DO NOT** manually configure anything
5. Let Vercel auto-detect:
   - Framework: Vite (from `package.json` in frontend/)
   - Build Command: Should be `npm run build` or `npm --prefix frontend run build`
   - Output Directory: Should be `frontend/dist` or `dist`
6. Click **Deploy**

### Step 3: Verify
- Wait for build to complete (should succeed in 2-3 minutes)
- Check deployment URL for working frontend
- Test connection to backend at https://royalguard-api.onrender.com

### Step 4: If Still Failing
- Share the Vercel build logs
- We'll debug the specific error with fresh eyes

---

## WHAT STAYS IN GIT (Nothing Lost)

✅ All source code  
✅ All commits  
✅ `.vercelignore` (with the fix)  
✅ `vercel.json` (won't be used, but stays)  
✅ Root `package.json` (won't be used, but stays)  
✅ All vite.config.ts changes  
✅ All import fixes  

---

## COMMANDS TO EXECUTE (In Order)

```bash
# Step 1: Verify current state
cd d:\SCIENCE\DJS AIML\Cogniify\royalguard-ai
git status                    # Should be clean
git log --oneline -3          # Show recent commits

# Step 2: Verify frontend builds
cd frontend
npm run build                 # Should show ✓ built in X.XXs

# Step 3: Push any final changes (if needed)
cd d:\SCIENCE\DJS AIML\Cogniify\royalguard-ai
git push origin main          # Ensure latest code on GitHub

# Step 4: Manual steps in Vercel Dashboard
# - Delete current project
# - Reconnect with auto-detection
# - Deploy
```

---

## WHO DEPLOYED WHAT

- **Backend (Render)**: Already live at https://royalguard-api.onrender.com
  - Python FastAPI
  - SQLite database
  - 6-agent audit pipeline
  - Status: ✅ Working

- **Frontend (Vercel)**: In progress
  - React 19 + Vite
  - TypeScript
  - Tailwind CSS + Framer Motion
  - Status: ⏳ Deployment stuck in configuration loop

---

## TECHNICAL DEBT & LESSONS LEARNED

1. **Case-Sensitivity**: Always set `git config core.ignorecase false` for Windows → Linux deployments
2. **.vercelignore Patterns**: `/data/` matches only root, `data/` matches all levels
3. **Monorepo on Vercel**: Either use Root Directory with delegation, OR use blank root with dependencies installed there
4. **Configuration Over Code**: We spent hours on configuration when the code was always fine
5. **Auto-Detection > Manual Config**: Vercel's auto-detection works. Manual config introduces conflicts.

---

## FOR NEXT DEVELOPER

When continuing this project:

1. **Frontend is at**: `d:\SCIENCE\DJS AIML\Cogniify\royalguard-ai\frontend\`
2. **Backend is at**: `d:\SCIENCE\DJS AIML\Cogniify\royalguard-ai\backend\` (already deployed)
3. **Local dev**: `cd frontend && npm run dev` (Vite dev server)
4. **Build test**: `cd frontend && npm run build`
5. **All changes committed to**: https://github.com/yashpoojari8706/royalguard-ai
6. **Next action**: Deploy with fresh Vercel project using auto-detection

---

**Last Updated**: April 4, 2026, 11:00 AM  
**Status**: Ready for clean-slate deployment  
**Estimated Time to Resolution**: 5 minutes (with fresh Vercel project)
