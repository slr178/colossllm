# AI Trading Automation - Quick Start Guide

## What Was Built

A complete automation system that runs all 6 AI models simultaneously, executing:
1. **BNB token purchases** from Four.meme (most recent tokens)
2. **Asterdex leverage trades** as fallback when no tokens are available

## Files Created

### Core System
- `lib/ai-automation.ts` - Main orchestration engine (600+ lines)
  - Controls all 6 AIs simultaneously
  - Manages BNB token buying logic
  - Integrates Asterdex leverage trading
  - Tracks positions and PnL

### API Routes
- `app/api/automation/start/route.ts` - Start automation
- `app/api/automation/stop/route.ts` - Stop automation
- `app/api/automation/status/route.ts` - Get real-time status

### Monitor Page
- `app/automation/page.tsx` - Real-time dashboard
  - Shows all 6 AIs with individual cards
  - Live stats (updates every 5 seconds)
  - Start/Stop controls
  - BNB position tracking
  - Asterdex trade monitoring

### Navigation
- Updated `app/layout.tsx` - Added "Automation" link to header

## How to Use

### 1. Access the Dashboard
Navigate to: `http://localhost:3000/automation`

### 2. Set Cycle Interval
Default is 5 minutes. Adjust based on your needs:
- 5 min = Moderate trading frequency
- 10 min = Conservative, lower API usage
- 1 min = Aggressive (watch API rate limits)

### 3. Start Trading
- **Start All**: Launches all 6 AIs with 10-second stagger
- **Individual Start**: Start specific AIs one at a time

### 4. Monitor Activity
Watch the real-time dashboard showing:
- Running status for each AI
- Latest BNB token purchases
- Asterdex leverage trades
- Success/failure counts
- Recent actions with timestamps

## Trading Logic

### Each AI Cycle:

```
1. Track 67 smart wallets for recent buys (last 30 min)
   ├─ If buyable token found → Buy 0.01 BNB worth
   │                           Validate via PancakeSwap or Four.meme
   │                           Track position
   │                           Monitor balance
   └─ If not found → Place Asterdex leverage trade
                     AI analyzes BTC/ETH/BNB/SOL
                     Opens LONG/SHORT with 5x-15x leverage
                     Sets mandatory SL/TP
```

### BNB Token Buying
- **Smart Wallet Tracking**: Monitors 67 profitable wallets (same as Live Monitor page)
- Uses `lib/wallet-tracker.ts` to find newest tokens
- Uses `lib/ai-bsc-swap.ts` for execution
- Validates buyability (PancakeSwap pair or Four.meme eligibility)
- 0.01 BNB per trade
- 15% slippage tolerance
- Smart routing (PancakeSwap or Four.meme proxy)

### Asterdex Trading
- Uses `lib/ai-asterdex-trader.ts`
- AI analyzes market data
- Places leveraged positions
- Mandatory stop-loss and take-profit
- Risk management built-in

## Dashboard Features

### Aggregated Stats (Top)
- Running AIs count
- Total BNB positions (active/total)
- Total Asterdex trades (active/total)
- Overall success rate

### Per-AI Cards
Each AI shows:
- **Header**: Logo, name, running status, Start/Stop button
- **Stats**: BNB spent, success count, failure count
- **Last Action**: Most recent trade or error with timestamp
- **BNB Positions**: List of token purchases (symbol, amount, status)
- **Asterdex Trades**: List of leverage positions (symbol, LONG/SHORT, leverage)

### Real-Time Updates
- Polls status every 5 seconds
- No page refresh needed
- Live position tracking

## Environment Setup Required

Make sure you have all credentials in `.env.local`:

```env
# BSC RPC
NEXT_PUBLIC_BSC_RPC_URL=...

# AI Wallets (6 sets)
NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY=...
NEXT_PUBLIC_AI1_BINANCE_WALLET=...
# ... (2-6)

# Asterdex (6 sets)
NEXT_PUBLIC_AI1_ASTERDEX_API_KEY=...
NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET=...
# ... (2-6)

# AI Model APIs
NEXT_PUBLIC_DEEPSEEK_API_KEY=...
NEXT_PUBLIC_OPENAI_API_KEY=...
NEXT_PUBLIC_XAI_API_KEY=...
NEXT_PUBLIC_QWEN_API_KEY=...
NEXT_PUBLIC_GOOGLE_API_KEY=...
NEXT_PUBLIC_ANTHROPIC_API_KEY=...

# Bitquery (for token discovery)
NEXT_PUBLIC_BITQUERY_TOKEN=...
```

## Key Features

✅ **All 6 AIs run simultaneously** with staggered starts  
✅ **BNB token buying** with automatic discovery  
✅ **Asterdex leverage trading** as intelligent fallback  
✅ **PnL tracking** for BNB positions  
✅ **Real-time monitoring** with 5-second updates  
✅ **Position tracking** for both BNB tokens and Asterdex  
✅ **Success/failure statistics** per AI  
✅ **Error handling** with graceful recovery  
✅ **Master controls** to start/stop all AIs at once  
✅ **Individual controls** for each AI  

## Safety Features

- **Pre-validation**: Checks token eligibility before buying
- **Balance checks**: Ensures sufficient BNB/USDT before trading
- **Mandatory SL/TP**: All Asterdex trades have stop-loss and take-profit
- **Error recovery**: System continues running even if one trade fails
- **Rate limit protection**: Staggered starts prevent API overload

## Next Steps

1. Verify all environment variables are set
2. Ensure wallets are funded (BNB for token buying, USDT for Asterdex)
3. Navigate to `/automation`
4. Start with 1-2 AIs to test
5. Monitor the dashboard
6. Scale up to all 6 AIs when comfortable

## Documentation

- **Full Guide**: See `AUTOMATION_SYSTEM.md` for complete documentation
- **Code**: Check `lib/ai-automation.ts` for implementation details
- **API**: Explore API routes in `app/api/automation/`

---

**Ready to trade!** 🚀

