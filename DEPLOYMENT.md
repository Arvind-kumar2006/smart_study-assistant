# Deployment Guide

## Backend Deployment ✅ (Already Deployed)
- URL: https://smart-study-backend-git-main-arvind-kumar214s-projects.vercel.app
- Status: Live

## Frontend Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

1. **Push frontend to GitHub** (if not already done)
   ```bash
   cd frontend
   git init  # if not already a git repo
   git add .
   git commit -m "Frontend ready for deployment"
   git remote add origin <your-frontend-repo-url>
   git push -u origin main
   ```

2. **Create Vercel Project**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your frontend repository
   - Set **Root Directory** to `frontend`

3. **Configure Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add: `VITE_API_BASE_URL` = `https://smart-study-backend-git-main-arvind-kumar214s-projects.vercel.app`
   - Save

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your frontend will be live at a URL like: `https://your-project.vercel.app`

### Option 2: Deploy to Netlify

1. **Build locally first** (optional, Netlify can do this)
   ```bash
   cd frontend
   npm run build
   ```

2. **Create Netlify Project**
   - Go to https://netlify.com
   - Drag and drop the `frontend/dist` folder, OR
   - Connect your GitHub repo and set:
     - Build command: `npm run build`
     - Publish directory: `dist`
     - Base directory: `frontend`

3. **Add Environment Variable**
   - Site settings → Environment variables
   - Add: `VITE_API_BASE_URL` = `https://smart-study-backend-git-main-arvind-kumar214s-projects.vercel.app`

4. **Deploy**
   - Netlify will build and deploy automatically

## Testing After Deployment

1. Visit your frontend URL
2. Enter a topic (e.g., "Photosynthesis")
3. Click "Get Study Pack"
4. Verify it loads summary, quiz, and study tip from the backend

## Troubleshooting

- **CORS errors**: Make sure backend CORS is configured (already done in `backend/src/index.js`)
- **404 on /study**: Check that `VITE_API_BASE_URL` is set correctly in Vercel/Netlify
- **Empty responses**: Verify backend is running and accessible at the deployed URL
