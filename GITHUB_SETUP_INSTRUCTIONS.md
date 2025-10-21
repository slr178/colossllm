# GitHub Setup Instructions

## Step 1: Create GitHub Repository

1. Open your browser and go to: https://github.com/new
2. Enter repository name: `bnbarena`
3. Choose Public or Private
4. **IMPORTANT**: Do NOT check any initialization options (no README, no .gitignore, no license)
5. Click "Create repository"

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

```bash
# If your username is 'sebas' and repo is 'bnbarena', run:
git remote add origin https://github.com/sebas/bnbarena.git
git branch -M main
git push -u origin main
```

Replace 'sebas' with your actual GitHub username!

## Step 3: Deploy to Netlify

1. Go to https://app.netlify.com/start
2. Click "Import from Git"
3. Choose "GitHub"
4. Authorize Netlify to access your GitHub
5. Select the `bnbarena` repository
6. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
7. Click "Deploy site"
8. Add environment variables in Site settings → Environment variables:
   - `NEXT_PUBLIC_USE_MOCK_DATA=false`

## Step 4: Deploy to Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select the `bnbarena` repository
5. Railway will auto-detect Next.js
6. Add ALL environment variables from your .env file in the Variables tab
7. Deploy!

## Step 5: Update Netlify Configuration

After Railway deployment:
1. Get your Railway app URL (e.g., https://bnbarena-production.up.railway.app)
2. Update `netlify.toml` line 10 with your Railway URL:
   ```toml
   to = "https://your-app-name.up.railway.app/api/:splat"
   ```
3. Commit and push the change
4. Netlify will auto-redeploy

## Environment Variables Checklist

### For Railway (Backend):
- [ ] ANTHROPIC_API_KEY
- [ ] OPENAI_API_KEY
- [ ] GOOGLE_API_KEY
- [ ] QWEN_API_KEY
- [ ] XAI_API_KEY
- [ ] DEEPSEEK_API_KEY
- [ ] BSC_RPC_URL
- [ ] BSC_PRIVATE_KEY
- [ ] BSC_PUBLIC_ADDRESS
- [ ] ASTERDEX_RPC_URL
- [ ] ASTERDEX_API_KEY
- [ ] BITQUERY_API_KEY_1
- [ ] BITQUERY_API_KEY_2
- [ ] BITQUERY_API_KEY_3
- [ ] WALLET_ADDRESSES
- [ ] INITIAL_CAPITAL
- [ ] LEVERAGE
- [ ] SLIPPAGE_TOLERANCE
- [ ] MAX_POSITION_SIZE

### For Netlify (Frontend):
- [ ] NEXT_PUBLIC_USE_MOCK_DATA=false
- [ ] NEXT_PUBLIC_API_URL (your Railway URL)

## Troubleshooting

- **Build fails**: Check Node version (should be 18+)
- **API not working**: Verify all environment variables are set
- **CORS errors**: Check netlify.toml redirects configuration
- **WebSocket issues**: Railway supports WebSockets by default

## Quick Commands Reference

```bash
# Check git remote
git remote -v

# If you need to change remote URL
git remote set-url origin https://github.com/YOUR_USERNAME/bnbarena.git

# Push changes
git add .
git commit -m "Update deployment configuration"
git push
```
