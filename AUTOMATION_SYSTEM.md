# AI Trading Automation System

## Overview

The AI Trading Automation System orchestrates all 6 AI models to automatically execute two types of trades:

1. **BNB Token Purchases**: Each AI attempts to find and buy the most recent tokens from Four.meme
2. **Asterdex Leverage Trades**: If no suitable BNB token is available, the AI places a leverage trade on Asterdex

## Architecture

### Core Components

1. **`lib/ai-automation.ts`** - Main orchestration engine
   - Manages all 6 AI trading cycles
   - Coordinates between BNB token buying and Asterdex trading
   - Tracks positions, PnL, and statistics

2. **API Routes**
   - `/api/automation/start` - Start automation for specific or all AIs
   - `/api/automation/stop` - Stop automation for specific or all AIs
   - `/api/automation/status` - Get real-time status and statistics

3. **Monitor Page**
   - `/automation` - Real-time dashboard showing all AI activities
   - Live stats, positions, trades, and controls

### Trading Flow

```
┌─────────────────────────────────────────────────────────┐
│                    AI Trading Cycle                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────┐
            │  Track Smart Wallets      │
            │  (67 profitable wallets)  │
            │  Find NEWEST buyable      │
            └───────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
          FOUND │                       │ NOT FOUND
                ▼                       ▼
    ┌─────────────────────┐   ┌────────────────────┐
    │  Buy BNB Token      │   │  Place Asterdex    │
    │  - 0.01 BNB/trade   │   │  Leverage Trade    │
    │  - 15% slippage     │   │  - AI analyzes     │
    │  - Validate buyable │   │  - LONG/SHORT      │
    │  - Track position   │   │  - 5x-15x leverage │
    └─────────────────────┘   └────────────────────┘
                                        │
                            ┌───────────┴───────────┐
                            │                       │
                            ▼                       ▼
                   ┌────────────────┐    ┌──────────────┐
                   │  Update PnL    │    │  Set SL/TP   │
                   │  Track Balance │    │  Risk Mgmt   │
                   └────────────────┘    └──────────────┘
```

## Features

### 1. BNB Token Trading
- **Smart Wallet Tracking**: Monitors 67 profitable wallets for their recent buys
- **Auto-Discovery**: Finds the NEWEST buyable token from smart wallet activity
- **Buyability Validation**: Checks if token can be bought via PancakeSwap or Four.meme proxy
- **Smart Buying**: Uses PancakeSwap for migrated tokens, Four.meme proxy for non-migrated
- **Position Tracking**: Monitors token balances and calculates PnL
- **Transaction History**: Records all buys with timestamps and TX hashes

### 2. Asterdex Leverage Trading
- **AI Decision Making**: Each AI analyzes market data (BTC, ETH, BNB, SOL)
- **Risk Management**: Mandatory stop-loss and take-profit on every trade
- **Leverage Control**: 5x-15x based on AI confidence
- **Position Management**: Tracks active positions and unrealized PnL

### 3. Real-Time Monitoring
- **Live Dashboard**: Updates every 5 seconds
- **Aggregated Stats**: Total positions, success rate, PnL across all AIs
- **Individual AI Status**: Last action, running state, error handling
- **Position Details**: Shows recent BNB buys and Asterdex trades

## Configuration

### Environment Variables Required

#### Binance Smart Chain (for BNB token buying)
```env
NEXT_PUBLIC_BSC_RPC_URL=your_bsc_rpc_url

# AI Wallet Credentials (6 wallets, one per AI)
NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY=...
NEXT_PUBLIC_AI1_BINANCE_WALLET=...
NEXT_PUBLIC_AI2_BINANCE_PRIVATE_KEY=...
NEXT_PUBLIC_AI2_BINANCE_WALLET=...
# ... (AI3, AI4, AI5, AI6)
```

#### Asterdex (for leverage trading)
```env
# AI Asterdex Credentials (6 accounts)
NEXT_PUBLIC_AI1_ASTERDEX_API_KEY=...
NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET=...
NEXT_PUBLIC_AI2_ASTERDEX_API_KEY=...
NEXT_PUBLIC_AI2_ASTERDEX_API_SECRET=...
# ... (AI3, AI4, AI5, AI6)
```

#### AI Model APIs
```env
NEXT_PUBLIC_DEEPSEEK_API_KEY=...
NEXT_PUBLIC_OPENAI_API_KEY=...
NEXT_PUBLIC_XAI_API_KEY=...
NEXT_PUBLIC_QWEN_API_KEY=...
NEXT_PUBLIC_GOOGLE_API_KEY=...
NEXT_PUBLIC_ANTHROPIC_API_KEY=...
```

#### Bitquery (for token discovery)
```env
NEXT_PUBLIC_BITQUERY_TOKEN=...
```

## Usage

### Start Automation

#### Via UI
1. Navigate to `/automation`
2. Set cycle interval (default: 5 minutes)
3. Click "Start All" or start individual AIs

#### Via API
```typescript
// Start all AIs
fetch('/api/automation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    startAll: true, 
    intervalMinutes: 5 
  })
});

// Start specific AI
fetch('/api/automation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    aiNumber: 1, 
    intervalMinutes: 5 
  })
});
```

### Stop Automation

```typescript
// Stop all AIs
fetch('/api/automation/stop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ stopAll: true })
});

// Stop specific AI
fetch('/api/automation/stop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ aiNumber: 1 })
});
```

### Get Status

```typescript
// Get all AI statuses
const response = await fetch('/api/automation/status');
const data = await response.json();
console.log(data.statuses); // Array of all AI statuses
console.log(data.aggregated); // Aggregated statistics

// Get specific AI status
const response = await fetch('/api/automation/status?aiNumber=1');
const data = await response.json();
console.log(data.status);
```

## AI Model Mapping

| AI Number | Model Name | BNB Trading | Asterdex Trading |
|-----------|------------|-------------|------------------|
| 1 | DeepSeek MAX | ✅ | ✅ |
| 2 | GPT-5 | ✅ | ✅ |
| 3 | GROK-4 | ✅ | ✅ |
| 4 | Qwen 3 Max | ✅ | ✅ |
| 5 | Gemini 2.5 Pro | ✅ | ✅ |
| 6 | Claude 3.5 Sonnet | ✅ | ✅ |

## Risk Management

### BNB Token Trading
- **Fixed Position Size**: 0.01 BNB per trade
- **Slippage Tolerance**: 15%
- **Token Criteria**: Only tokens with 60%+ bonding progress
- **Validation**: Pre-trade validation to avoid failed transactions

### Asterdex Trading
- **Minimum Balance**: $100 USDT required
- **Position Size**: $100-$300 per trade (based on confidence)
- **Leverage Range**: 5x-15x
- **Stop Loss**: Mandatory 2-4% from entry
- **Take Profit**: Mandatory 4-8% from entry
- **Risk/Reward**: Minimum 2:1 ratio
- **Confidence Threshold**: 40% minimum (increase to 70% for production)

## Monitoring & Alerts

### Dashboard Metrics
- **Running AIs**: How many AIs are actively trading
- **BNB Positions**: Active vs total token positions
- **Asterdex Trades**: Active vs total leverage trades
- **Success Rate**: Overall success percentage
- **Total BNB Spent**: Cumulative BNB used for token purchases
- **Total PnL**: Combined profit/loss across all positions

### Per-AI Metrics
- **Status**: Running or stopped
- **Last Action**: Most recent trade or error
- **Success/Failure Count**: Trade statistics
- **BNB Positions**: List of held tokens with status
- **Asterdex Trades**: Active leverage positions

## Cycle Interval

The automation runs on a configurable interval (default: 5 minutes):
- **Staggered Start**: AIs start 10 seconds apart to avoid API rate limits
- **Continuous Operation**: Runs until manually stopped
- **Auto-Recovery**: Handles errors gracefully and continues

## Best Practices

1. **Start Small**: Test with 1-2 AIs first
2. **Monitor Closely**: Watch the dashboard for the first few cycles
3. **Adequate Balance**: Ensure both BNB and USDT are funded
4. **API Keys**: Verify all API keys are working before starting
5. **Interval Selection**: 5-10 minutes recommended to avoid rate limits
6. **Stop Loss**: Never disable SL/TP on Asterdex trades

## Troubleshooting

### Common Issues

**"No suitable BNB token found"**
- Smart wallets may not have made any recent buys (last 30 minutes)
- All recent tokens may fail buyability check (not migrated, no liquidity)
- System will automatically fall back to Asterdex trading

**"Insufficient balance"**
- Check BNB balance for token purchases
- Check USDT balance for Asterdex trades (minimum $100)

**"API key missing"**
- Verify all environment variables are set
- Restart dev server after adding .env.local

**"Time sync error"**
- Asterdex API uses strict timestamp validation
- System auto-resyncs time on errors

## Future Enhancements

- [ ] Real-time PnL calculation for BNB tokens (requires DEX price feeds)
- [ ] Auto-sell logic for BNB tokens (take profit/stop loss)
- [ ] Portfolio rebalancing across AIs
- [ ] Advanced analytics and backtesting
- [ ] Telegram/Discord notifications
- [ ] AI strategy evolution based on performance

