# Quick Start - Four.meme Streaming

## ⚡ Get Up and Running in 60 Seconds

### 1. Your Token is Already Configured

The `.env.local` file already has your Bitquery token:
```bash
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_qn-zAKqaGHOGIFpTFCar3nuLyC5rEqNlI9oNO40NWOg...
```

### 2. Restart Dev Server

```bash
npm run dev
```

Environment variables only load on startup!

### 3. Visit the Stream

Open [http://localhost:3000/stream](http://localhost:3000/stream)

## ✅ What You'll See

### Instant Backfill
- 📦 Loading animation for ~2 seconds
- Then **lots of tokens appear** from the last 24 hours
- No waiting for live events!

### Live Streaming
- ✅ Green "LIVE" indicator when WebSocket connected
- 🪙 New tokens appear in real-time as they're created
- Auto-reconnects if connection drops

## 🔍 Expected Console Output

```
📦 Loading recent Four.meme tokens...
📦 Backfilling tokens from last 24 hours...
✅ Backfilled 47 tokens
✅ Loaded 47 historical tokens
🔌 Connecting to Bitquery WebSocket...
Token: ory_at_qn-zAK...
✅ Connected to Bitquery WebSocket
```

When new token is created:
```
📡 Received data: {...}
🎉 1 new token(s) created!
🪙 New token: MoonCoin MOON 0x1234...5678
```

## 📊 Token Data Shown

Each token displays:
- **Name** and **Symbol**
- **Creator** wallet address
- **Token** contract address
- **Total Supply** (formatted as billions)
- **Launch Time** (when token goes live)
- **Links** to BscScan (TX + Contract)

## ❌ Troubleshooting

### No tokens appearing?

1. **Check console** for errors
2. **Verify token** is set: `echo $env:NEXT_PUBLIC_BITQUERY_TOKEN` (PowerShell)
3. **Restart server**: `npm run dev`
4. **Check network tab** for WebSocket connection

### Connection errors?

1. Token might be expired - rotate it on Bitquery
2. Check your internet connection
3. Verify token format (should start with `ory_`)

### Want server-side token (private)?

See `app/api/stream-relay/route.ts` for SSE relay option

## 🎯 Key Features

✅ **Correct Four.meme contract**: `0x5c952063c7fc8610ffdb798152d69f0b9550762b`
✅ **Instant data**: HTTP backfill shows tokens immediately  
✅ **Live updates**: WebSocket streams new creations in real-time  
✅ **Keep-alive**: 15s pings prevent disconnects  
✅ **Auto-reconnect**: Exponential backoff if connection drops  
✅ **No duplicates**: Smart deduplication logic  
✅ **Rich data**: All TokenCreate event fields parsed  

## 📚 More Info

- Full setup guide: `BITQUERY_SETUP.md`
- API utilities: `lib/bitquery.ts`
- Stream hook: `hooks/useFourMemeStream.ts`
- Stream component: `components/FourMemeStream.tsx`

---

**That's it!** You should see lots of tokens immediately. 🚀

