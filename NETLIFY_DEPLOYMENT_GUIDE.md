# Netlify Deployment from Terminal

## Prerequisites
- Netlify CLI installed (already done)
- Netlify account
- Built Next.js app

## Step 1: Build Your Project
```bash
npm run build
```

## Step 2: Login to Netlify
```bash
netlify login
```
This will open a browser window for authentication.

## Step 3: Deploy to Netlify

### Option A: Deploy to New Site
```bash
netlify deploy --prod --dir=.next
```

### Option B: Link to Existing Site
```bash
# First, link to your site
netlify link

# Then deploy
netlify deploy --prod --dir=.next
```

### Option C: Create New Site and Deploy
```bash
# Initialize new site
netlify init

# Follow prompts to:
# - Create & configure a new site
# - Link to your GitHub repo
# - Set build command: npm run build
# - Set publish directory: .next

# Deploy
netlify deploy --prod
```

## Step 4: Set Environment Variables
```bash
# Set individual variables
netlify env:set NEXT_PUBLIC_USE_MOCK_DATA false

# Or import from .env file
netlify env:import .env.production
```

## Step 5: Configure Custom Domain (Optional)
```bash
netlify domains:add yourdomain.com
```

## Continuous Deployment

After initial setup, Netlify will auto-deploy on every push to GitHub.

To deploy manually from terminal:
```bash
npm run build && netlify deploy --prod
```

## Useful Commands
```bash
# Check deployment status
netlify status

# Open site in browser
netlify open

# View deployment logs
netlify deploy --debug

# List environment variables
netlify env:list

# Update build settings
netlify sites:update --build-command "npm run build" --dir ".next"
```

## Quick Deploy Script

Create a `deploy.sh` or `deploy.ps1` file:

```powershell
# deploy.ps1
Write-Host "Building project..." -ForegroundColor Green
npm run build

Write-Host "Deploying to Netlify..." -ForegroundColor Green
netlify deploy --prod --dir=.next

Write-Host "Deployment complete!" -ForegroundColor Green
netlify open
```

Run with: `./deploy.ps1`
