# Restart Instructions

To apply all the changes made:

1. **Stop the current server** (Ctrl+C in terminal)

2. **Start the server again**:
   ```
   npm run dev
   ```

3. **The system will now**:
   - Use 30x leverage for all trades
   - Display correct portfolio values including unrealized P&L
   - Show effective balances in charts and leaderboards
   - Automatically start all AIs on server startup

## What Changed:

### 1. Leverage Updated to 30x
- Stop loss: 1.5-2.5% from entry (liquidation at 3.33%)
- Take profit: 3-7% from entry
- More conservative than 40x but still high risk

### 2. Balance Display Fixed
- Chart now shows: Wallet Balance + Unrealized P&L
- Leaderboard shows effective portfolio value
- Individual AI stats show:
  - WALLET: Cash balance
  - UNREALIZED: Open position P&L
  - TOTAL: Combined value

### 3. API Logic Verified
- Balance fetching includes position calculations
- Unrealized P&L properly tracked
- Portfolio values update correctly

## Monitor Your Positions:
- Visit http://localhost:3000/automation
- Check the chart shows proper values ($1900-2000 range)
- Verify balances include open position P&L
- Watch the 30x leverage trades carefully!
