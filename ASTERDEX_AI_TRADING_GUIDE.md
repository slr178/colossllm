# AI-Powered Asterdex Trading System

## 🎯 Overview

This system enables **5 AI models** to autonomously trade cryptocurrency futures on Asterdex with leverage. Each AI analyzes market data and executes trades using its own API credentials.

---

## 🤖 AI Traders

| AI # | Model | Provider | Trading Style |
|------|-------|----------|---------------|
| 1 | DeepSeek MAX | DeepSeek | Analytical & data-driven |
| 2 | GPT-5 | OpenAI | Strategic & balanced |
| 3 | GROK-4 | xAI | Aggressive & bold |
| 4 | Qwen 3 Max | Qwen | Conservative & precise |
| 5 | Gemini 2.5 Pro | Google | Adaptive & versatile |

---

## 🔑 Environment Variables Required

Each AI needs **3 sets of credentials**:

### 1. Asterdex API (for executing trades)
```bash
NEXT_PUBLIC_AI1_ASTERDEX_API_KEY=your_api_key
NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET=your_api_secret
```

### 2. AI Model API (for trading decisions)
```bash
NEXT_PUBLIC_DEEPSEEK_API_KEY=sk-...  # For AI #1
NEXT_PUBLIC_OPENAI_API_KEY=sk-...    # For AI #2
NEXT_PUBLIC_XAI_API_KEY=xai-...      # For AI #3
NEXT_PUBLIC_QWEN_API_KEY=sk-...      # For AI #4
NEXT_PUBLIC_GOOGLE_API_KEY=AIza...   # For AI #5
```

### 3. BSC Wallet (for spot trading - already configured)
```bash
NEXT_PUBLIC_AI1_BINANCE_WALLET=0x...
NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY=...
```

---

## 🚀 How It Works

### 1. **Market Analysis**
- Each AI fetches real-time data for: `BTCUSDT`, `ETHUSDT`, `BNBUSDT`, `SOLUSDT`
- Data includes: price, 24h change, volume, highs/lows

### 2. **AI Decision Making**
The AI analyzes:
- Current market conditions
- Existing positions
- Available balance
- Price trends and volatility

Then generates a decision:
```json
{
  "symbol": "BTCUSDT",
  "action": "LONG | SHORT | CLOSE | HOLD",
  "leverage": 1-20,
  "usdAmount": 10-100,
  "confidence": 0-100,
  "reasoning": "Why this trade makes sense",
  "stopLoss": 65000,
  "takeProfit": 75000
}
```

### 3. **Trade Execution**
If confidence > 70%:
1. Set leverage on Asterdex
2. Calculate position size
3. Place market order
4. Set stop loss & take profit
5. Monitor position

---

## 📊 Using the System

### Access the Interface
1. Navigate to `/monitor`
2. Click the **"ASTERDEX"** tab
3. AIs auto-initialize on load

### Manual Trading
Click **"🤖 RUN AI TRADE"** on any AI card to:
- Fetch market data
- Get AI analysis
- Execute trade if confidence is high

### Automated Trading
Click **"▶️ START AUTO"** to enable automation:
- Runs every **60 seconds**
- Continuously analyzes markets
- Executes trades autonomously
- Shows green status indicator

Click **"⏸️ STOP AUTO"** to pause automation.

---

## 💡 Trading Rules

Each AI follows these rules:

1. **Confidence Threshold**: Only trade if confidence > 70%
2. **Position Sizing**: Risk max 20% of balance per trade
3. **Leverage**: Use 1-20x based on confidence
4. **Risk Management**: Always set stop loss & take profit
5. **Volume Check**: Consider trading volume before entering
6. **Balance Minimum**: Requires $10 minimum to trade

---

## 📈 Dashboard Features

### AI Cards Show:
- **Balance**: Available USDT for trading
- **Active Positions**: Current open trades with:
  - Symbol (BTC, ETH, etc.)
  - Direction (LONG 🟢 / SHORT 🔴)
  - Leverage (1x - 20x)
  - Unrealized P&L (profit/loss)
  - Entry price
- **Controls**:
  - Manual trade execution
  - Auto-trading toggle
- **Status**: Real-time automation indicator

---

## 🔄 Trading Cycle Flow

```
1. Initialize AI Trader
   ↓
2. Sync with Asterdex server time
   ↓
3. Check connectivity
   ↓
4. Get account balance
   ↓
5. Fetch current positions
   ↓
6. Get market data (BTC, ETH, BNB, SOL)
   ↓
7. Send data to AI for analysis
   ↓
8. AI returns trading decision
   ↓
9. Validate decision (confidence, balance, etc.)
   ↓
10. Execute trade on Asterdex
    ↓
11. Set stop loss & take profit
    ↓
12. Update dashboard
    ↓
13. Wait 60 seconds (if auto mode)
    ↓
14. Repeat from step 4
```

---

## 🛡️ Safety Features

1. **Pre-trade Validation**
   - Checks available balance
   - Validates position size
   - Ensures leverage is within limits

2. **Error Handling**
   - Connection failures return HOLD decision
   - Low confidence trades are skipped
   - API errors don't crash the system

3. **Position Protection**
   - Auto stop-loss on every trade
   - Take-profit targets set automatically
   - Real-time P&L monitoring

4. **Rate Limiting**
   - 60-second intervals prevent spam
   - One trade at a time per AI
   - Prevents concurrent execution

---

## 📁 File Structure

```
lib/
├── ai-asterdex-trader.ts       # AI trading system
├── ai-bsc-swap.ts             # BSC token buying
├── asterdex-trader.ts         # Asterdex API client
└── bsc-swap.ts                # BSC swap utilities

app/
└── monitor/
    └── page.tsx               # Trading dashboard UI

hooks/
├── useAsterdexTrader.ts       # Asterdex hooks
└── useAITrading.ts            # AI trading hooks
```

---

## 🔧 Key Functions

### `runAITradingCycle(aiNumber, symbols)`
Executes one complete trading cycle for an AI:
- Fetches market data
- Gets AI decision
- Executes trade
- Returns result

### `initializeAITrader(aiNumber)`
Sets up an AI trader:
- Validates credentials
- Tests connection
- Gets balance & positions
- Returns status

### `getAITradeDecision(aiNumber, marketData, positions, balance)`
Calls the AI model API:
- Sends market analysis prompt
- Receives JSON trading decision
- Validates response format
- Returns decision object

### `executeTrade(trader, decision, aiNumber)`
Executes the trade:
- Sets leverage
- Calculates quantity
- Places order
- Sets SL/TP
- Returns result

---

## 🎨 UI Components

### AI Trader Card
- **Header**: AI name, logo, balance
- **Positions**: List of active trades
- **Controls**: Manual & auto trading buttons
- **Status**: Automation indicator

### Position Display
- Symbol & direction
- Leverage multiplier
- Unrealized P&L (color-coded)
- Entry price

---

## 🚨 Troubleshooting

### "Missing config for AI#"
- Check `.env` file has `NEXT_PUBLIC_AI#_ASTERDEX_API_KEY`
- Restart dev server after adding env vars

### "Insufficient balance"
- Fund your Asterdex account with USDT
- Minimum $10 required per AI

### "Connection failed"
- Verify Asterdex API keys are correct
- Check Asterdex service status

### "AI returns HOLD every time"
- Market conditions may not be favorable
- AI confidence is below 70% threshold
- Check AI model API key is valid

---

## 📝 Example AI Response

```json
{
  "symbol": "BTCUSDT",
  "action": "LONG",
  "leverage": 10,
  "usdAmount": 50,
  "confidence": 85,
  "reasoning": "Strong upward momentum, high volume, RSI oversold, expect bounce to $72K",
  "stopLoss": 68500,
  "takeProfit": 72000
}
```

This would:
- Open a **LONG** position on BTC
- Use **10x leverage**
- Invest **$50 USDT** ($500 notional with leverage)
- Set **stop loss** at $68,500
- Set **take profit** at $72,000

---

## 🎯 Best Practices

1. **Start Small**: Test with minimum amounts first
2. **Monitor Closely**: Watch first few trades carefully
3. **Review Logs**: Check console for AI reasoning
4. **Diversify**: Let multiple AIs trade different strategies
5. **Set Limits**: Don't over-leverage or risk too much
6. **Regular Checks**: Monitor positions daily
7. **Update Credentials**: Rotate API keys periodically

---

## 🔮 Future Enhancements

- [ ] Custom trading strategies per AI
- [ ] Performance tracking & analytics
- [ ] Trade history with P&L charts
- [ ] Configurable trading pairs
- [ ] Risk management presets
- [ ] Telegram/Discord notifications
- [ ] Backtesting functionality
- [ ] AI model fine-tuning based on results

---

## 📞 Support

For issues or questions:
1. Check console logs for detailed errors
2. Verify all environment variables are set
3. Ensure Asterdex account is funded
4. Review AI decision reasoning in logs
5. Test manual trades before enabling auto mode

---

**Built with**:
- Next.js 14
- TypeScript
- ethers.js
- Asterdex API
- Multiple AI providers (OpenAI, DeepSeek, xAI, Qwen, Google)

**Ready to trade? Navigate to `/monitor` → Click "ASTERDEX" → Click "START AUTO"** 🚀

