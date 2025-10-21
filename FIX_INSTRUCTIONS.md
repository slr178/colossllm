# Fixed Issues - Restart Required

## Issues Fixed:

### 1. **Leverage Error Fixed**
- Changed from 30x to **20x leverage** (Asterdex was rejecting 30x)
- Added supported leverage validation
- Stop loss: 2-3% from entry
- Take profit: 4-8% from entry

### 2. **0% Display Fixed**
- Fixed initialBalance tracking issue
- Now properly tracks starting balance (~$1900)
- P&L percentages will display correctly

### 3. **API Improvements**
- Added leverage validation with common supported values
- Better error handling for unsupported leverage

## To Apply Changes:

1. **Stop the server** (Ctrl+C)
2. **Start fresh**:
   ```
   npm run dev
   ```

## What Will Happen:

1. All AIs will auto-start with **20x leverage**
2. P&L percentages will show correctly (not 0%)
3. No more "Leverage 30 is not valid" errors
4. Starting balance properly tracked at ~$1900

## Monitor After Restart:
- Check that new trades use 20x leverage
- Verify P&L percentages display correctly
- Watch for successful trade executions
- Confirm no leverage errors in console
