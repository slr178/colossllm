# Bitquery Four.meme Streaming Setup

This guide will help you set up the Four.meme token streaming feature with **instant backfill** and **live WebSocket streaming**.

## Quick Setup

### 1. Get Your Bitquery Token

1. Go to [Bitquery Applications](https://account.bitquery.io/user/api_v2/api_tokens)
2. Create a new OAuth access token (looks like `ory_at_...`)
3. Copy the token

### 2. Configure Environment

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_YOUR_TOKEN_HERE
```

**Important:**
- No quotes around the token
- No extra spaces or newlines
- Single line only
- Must start with `ory_`

### 3. Restart Dev Server

```bash
npm run dev
```

Environment variables are only loaded on server start!

### 4. Update Four.meme Contract Address

Open `lib/bitquery.ts` and update the contract address:

```ts
export const FOUR_MEME_CONTRACT = '0x...' // Your actual Four.meme contract
```

Find the contract from [Bitquery Four.meme docs](https://docs.bitquery.io/docs/blockchain/BSC/four-meme-api/)

### 5. Test the Stream

Visit [http://localhost:3000/stream](http://localhost:3000/stream)

You should see:
- 📦 Loading animation while backfilling last 24h
- ✅ Green "LIVE" indicator when WebSocket connected
- 🪙 Historical tokens loaded instantly
- 🪙 New tokens appearing in real-time as they're created

### Debugging

#### Check Token is Loaded

Open browser console and look for:
```
🔌 Connecting to Bitquery WebSocket...
Token: ory_at_qn-zAK...
✅ Connected to Bitquery WebSocket
```

#### Common Issues

1. **"Token not configured" error**
   - Make sure `.env.local` exists
   - Check the variable name is `NEXT_PUBLIC_BITQUERY_TOKEN`
   - Restart the dev server

2. **Token format error**
   - Token should start with `ory_at_` or `ory_`
   - No quotes in `.env.local`
   - Copy the full token from Bitquery

3. **Connection errors**
   - Check your internet connection
   - Verify token hasn't expired
   - Check Bitquery status

## Advanced: Private Token (Server-Side)

If you don't want to expose your token in the browser, use the server-side relay:

### 1. Update `.env.local`

```bash
# Remove NEXT_PUBLIC_ prefix to keep it server-side only
BITQUERY_TOKEN=ory_at_YOUR_TOKEN_HERE
```

### 2. Use the API Route

The relay is at `/api/stream-relay/route.ts`

### 3. Update Client to Use SSE

Instead of direct WebSocket, connect to the server relay:

```ts
const eventSource = new EventSource('/api/stream-relay');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New token:', data);
};
```

## What Gets Streamed

Each new Four.meme token includes:

- `name` - Token name
- `symbol` - Token symbol
- `creator` - Creator wallet address
- `tokenAddress` - Token contract address
- `totalSupply` - Initial supply
- `timestamp` - Creation time
- `txHash` - Transaction hash
- `blockNumber` - Block number

## Rate Limits

Bitquery free tier includes:
- 10 queries/minute
- WebSocket streaming included
- Check [Bitquery pricing](https://bitquery.io/pricing) for limits

## Links

- [Bitquery Docs](https://docs.bitquery.io/)
- [Four.meme API](https://docs.bitquery.io/docs/blockchain/BSC/four-meme-api/)
- [WebSocket Auth](https://docs.bitquery.io/docs/authorisation/websocket/)
- [Get API Token](https://account.bitquery.io/user/api_v2/api_tokens)

## Troubleshooting

Still having issues? Check:

1. Console logs for connection messages
2. Network tab for WebSocket connection
3. `.env.local` file format
4. Dev server was restarted after adding token
5. Token hasn't been rotated/expired on Bitquery

