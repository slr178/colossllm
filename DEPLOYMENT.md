# Deployment Guide

This guide explains how to deploy the AI Trading Arena to Netlify (frontend) and Railway (backend).

## Prerequisites

- GitHub account
- Netlify account
- Railway account
- All necessary API keys (see ENV_SETUP_GUIDE.md)

## GitHub Setup

1. Create a new repository on GitHub
2. Add the remote origin (already done in deployment script)
3. Push your code (already done in deployment script)

## Netlify Deployment (Frontend)

1. Log in to [Netlify](https://www.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub account and select this repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_USE_MOCK_DATA=false`
   - Any other frontend-specific variables
6. Click "Deploy site"

## Railway Deployment (Full Stack)

1. Log in to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Railway will auto-detect Next.js and configure settings
5. Add environment variables in Railway dashboard:
   - All API keys from .env file
   - Database connections if needed
6. Railway will automatically deploy

## Environment Variables

### Required for Backend (Railway):
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `QWEN_API_KEY`
- `XAI_API_KEY`
- `DEEPSEEK_API_KEY`
- `BSC_RPC_URL`
- `BSC_PRIVATE_KEY`
- `BSC_PUBLIC_ADDRESS`
- `ASTERDEX_RPC_URL`
- `ASTERDEX_API_KEY`
- `BITQUERY_API_KEY_1`
- `BITQUERY_API_KEY_2`
- `BITQUERY_API_KEY_3`
- `WALLET_ADDRESSES`
- Trading configuration variables

### Required for Frontend (Netlify):
- `NEXT_PUBLIC_USE_MOCK_DATA`
- `NEXT_PUBLIC_API_URL` (Railway backend URL)

## Post-Deployment

1. Update `netlify.toml` with your Railway backend URL
2. Configure custom domains if needed
3. Set up monitoring and alerts
4. Test all API endpoints
5. Verify WebSocket connections for real-time features

## Troubleshooting

- If build fails on Netlify, check Node.js version compatibility
- If Railway deployment fails, check logs for missing environment variables
- For CORS issues, ensure proper headers are configured
- For WebSocket issues, ensure Railway supports WebSocket connections

## Alternative: Single Deployment

You can also deploy the entire Next.js app to either platform:
- **Railway Only**: Deploy full stack app with API routes
- **Vercel**: Alternative to Netlify, with better Next.js integration
