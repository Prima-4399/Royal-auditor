# Vercel Errors - IMMEDIATE FIX

## You Need To Do 2 Things On Vercel Dashboard

### STEP 1: Add Environment Variable (2 minutes)
```
Go to: https://vercel.com/dashboard
Click: Your Project Name
Click: Settings (top menu)
Click: Environment Variables (left sidebar)

Click "Add" and fill:
  Name:  VITE_API_URL
  Value: https://royalguard-api.onrender.com
  Select: Production, Preview, Development (all checked)

Click: Save
```

### STEP 2: Trigger Redeploy (1 minute)
```
Go to: Deployments tab
Click: "New" button (or push code to main branch)

Vercel will start building with the new environment variable.
Watch the logs - should complete in 2-3 minutes.

When you see: "✅ Build successful" - you're done!
```

---

## What This Fixes

✅ **"Module not found" errors** - Vercel now knows where the backend is  
✅ **API calls returning 404** - Frontend connects to your Render backend  
✅ **"CORS blocked" errors** - Backend now accepts requests from Vercel domain  
✅ **Blank page on load** - Frontend now renders with real data  

---

## If You Still Get Build Errors After This

**Check 1: Vercel Build Logs**
- Go to Deployments tab
- Click the failed deployment
- Scroll down to "Build Output"
- Look for red error text
- Copy the error and Google it

**Check 2: Backend Status**
- Open: https://royalguard-api.onrender.com/docs
- Should see API documentation (Swagger UI)
- If you GET a 404 or connection error, backend is down
- Check Render dashboard logs

**Check 3: Frontend Locally**
- Run: `cd frontend && npm install && npm run build`
- If this fails locally, Vercel will fail too
- Fix the local error first

---

## If Backend Is Down on Render

**The Problem:**
Your Render backend might have restarted but failed to initialize.

**The Fix:**
1. Go to Render Dashboard
2. Find your Backend Service
3. Click "Manual Deploy" (or restart button)
4. Wait 2 minutes for it to spin up
5. Visit https://royalguard-api.onrender.com/docs
6. If you see Swagger UI, it's working ✅

**If Still Not Working:**
Check Render logs for errors like:
- `ModuleNotFoundError: No module named 'pdfplumber'`
  → Add to requirements.txt
  
- `ModuleNotFoundError: No module named 'stripe'`
  → Add to requirements.txt
  
- `GROQ_API_KEY not found`
  → Add to Render environment variables

---

## Verify Everything Works

### Test #1: Frontend Loads
```
Open: https://your-project.vercel.app
You should see the RoyalGuard AI dashboard
Not a blank page
✅ = Working
❌ = Check env variables
```

### Test #2: Backend Responds
```
Open: https://royalguard-api.onrender.com/docs
You should see Swagger API documentation
✅ = Working
❌ = Check Render logs
```

### Test #3: Frontend Fetches Data
```
Open: https://your-project.vercel.app
Go to Contracts tab
Should show list of contracts
Not empty/loading forever
✅ = Working
❌ = Open DevTools (F12), check Network/Console tabs
```

---

## Done!

Once all 3 tests pass, Vercel errors are fixed. The site is live and working.

If you need more details, read: `VERCEL_DEPLOYMENT_GUIDE.md`
