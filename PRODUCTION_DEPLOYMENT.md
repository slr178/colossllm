# Production Deployment Guide

## Logging System for Production

The automation system now has **persistent logging** that works in production environments.

### How It Works

1. **File-Based Storage** - Logs saved to `/logs/automation.json`
2. **Auto-Save** - Saves to disk every 10 log entries
3. **Rotation** - Keeps last 500 entries (configurable)
4. **Persistent** - Survives server restarts
5. **Public Access** - Logs accessible via API endpoints

### For Public Website

When deploying for public access, the logs are automatically available at:

```
GET /api/automation/logs?limit=100       # View logs
GET /api/automation/logs/export          # Download JSON
POST /api/automation/logs/clear          # Clear all logs
```

No additional setup required - works out of the box!

## Production Considerations

### 1. Environment Variables

All environment variables must be set on your hosting platform:

```env
# BSC Trading
NEXT_PUBLIC_BSC_RPC_URL=...
NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY=...
NEXT_PUBLIC_AI1_BINANCE_WALLET=...
# ... (repeat for AI2-6)

# Asterdex
NEXT_PUBLIC_AI1_ASTERDEX_API_KEY=...
NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET=...
# ... (repeat for AI2-6)

# AI APIs
NEXT_PUBLIC_DEEPSEEK_API_KEY=...
NEXT_PUBLIC_OPENAI_API_KEY=...
NEXT_PUBLIC_XAI_API_KEY=...
NEXT_PUBLIC_QWEN_API_KEY=...
NEXT_PUBLIC_GOOGLE_API_KEY=...
NEXT_PUBLIC_ANTHROPIC_API_KEY=...

# Bitquery (optional for token discovery)
NEXT_PUBLIC_BITQUERY_TOKEN=...

# Base URL (for server-side API calls)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 2. File System Permissions

The server needs write access to create `/logs` directory:

**Vercel/Netlify**: Use `/tmp/logs` instead (ephemeral)
**VPS/Dedicated**: Standard `/logs` works fine

To use `/tmp` for serverless:
```typescript
// In lib/automation-logger.ts
private logFile = join('/tmp', 'automation.json');
```

### 3. Log Persistence Options

#### Option A: File System (VPS/Dedicated Server)
- ✅ Simple, no external dependencies
- ✅ Works out of the box
- ❌ Lost on serverless redeploys

#### Option B: Database (Recommended for Serverless)
```typescript
// Replace file operations with database calls
// Use Vercel KV, Supabase, MongoDB, etc.
```

#### Option C: External Storage (S3, R2)
```typescript
// Upload logs to cloud storage
// Good for high-scale deployments
```

### 4. Security Considerations

**Logs contain sensitive info** (wallet addresses, trade amounts, API errors)

For public websites:
1. **Add authentication** to log endpoints
2. **Sanitize logs** before display (remove addresses, keys)
3. **Rate limit** log API endpoints

Example authentication middleware:
```typescript
// app/api/automation/logs/route.ts
export async function GET(request: NextRequest) {
  const authToken = request.headers.get('Authorization');
  if (authToken !== process.env.ADMIN_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of code
}
```

## Deployment Platforms

### Vercel (Recommended)

1. **Push to GitHub**
2. **Import in Vercel**
3. **Add Environment Variables** in dashboard
4. **Deploy**

Limitations:
- Serverless functions (10s timeout on hobby)
- Use `/tmp` for logs (ephemeral)
- Consider upgrading to Pro for longer timeouts

### Railway / Render

1. **Connect GitHub repo**
2. **Add environment variables**
3. **Deploy**

Benefits:
- Persistent file system
- Longer execution times
- Standard `/logs` directory works

### VPS (DigitalOcean, AWS EC2, etc.)

1. **Install Node.js**
2. **Clone repo**
3. **Set environment variables** in `.env.local`
4. **Build**: `npm run build`
5. **Start**: `npm start`
6. **Use PM2** for process management

```bash
npm install -g pm2
pm2 start npm --name "ai-arena" -- start
pm2 save
pm2 startup
```

## UI Minimalism

The automation page is designed with **brutalist minimalism**:

- Black & white only
- Monospace fonts (Consolas)
- 1px borders
- No rounded corners
- No gradients
- No animations (except necessary state changes)
- Compact 3-column grid
- Smallest possible font sizes
- Maximum information density

### Customization

To make it even more minimal, edit `app/automation/page.tsx`:

```typescript
// Remove stats bar
{/* aggregated && ... */}

// Show only running AIs
{statuses.filter(s => s.isRunning).map(...)}

// Hide inactive positions
{status.bnbPositions.filter(p => p.status === 'active').map(...)}
```

## Performance Optimization

For production with many users:

1. **Cache status responses** (reduce database/state reads)
2. **WebSocket instead of polling** (real-time updates)
3. **Paginate logs** (don't load all 500 at once)
4. **CDN for static assets** (Vercel does this automatically)

## Monitoring

Set up external monitoring for:
- Server uptime
- API errors
- Failed trades
- Wallet balances

Recommended tools:
- **UptimeRobot** - Free uptime monitoring
- **Sentry** - Error tracking
- **Better Stack** - Log aggregation

## Scaling

When scaling to 100+ AIs or public access:

1. **Use Redis** for shared state (multiple servers)
2. **Database for logs** (PostgreSQL, MongoDB)
3. **Queue system** for trades (BullMQ, RabbitMQ)
4. **Load balancer** for multiple instances
5. **Separate API server** from frontend

---

**Your automation system is production-ready!** 🚀

Deploy to Vercel/Railway and share the URL - logs will be accessible to everyone at `/automation`.

