# Environment Variables Setup Guide

## Complete .env.local Configuration

Create or update your `.env.local` file in the project root with the following:

```bash
# ============================================
# BITQUERY API (Four.meme Token Streaming)
# ============================================
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_qn-zAKqaGHOGIFpTFCar3nuLyC5rEqNlI9oNO40NWOg.dYZxhmSKBHnOGpACd9gEVPn5jtCY4vhC-AArKm7o4cI

# ============================================
# AI #1 - DeepSeek MAX
# ============================================
NEXT_PUBLIC_AI1_ASTERDEX_API_KEY=your_ai1_asterdex_api_key_here
NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET=your_ai1_asterdex_api_secret_here
NEXT_PUBLIC_AI1_BINANCE_WALLET=your_ai1_bnb_wallet_address_here
NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY=your_ai1_wallet_private_key_here

# ============================================
# AI #2 - GPT-5
# ============================================
NEXT_PUBLIC_AI2_ASTERDEX_API_KEY=your_ai2_asterdex_api_key_here
NEXT_PUBLIC_AI2_ASTERDEX_API_SECRET=your_ai2_asterdex_api_secret_here
NEXT_PUBLIC_AI2_BINANCE_WALLET=your_ai2_bnb_wallet_address_here
NEXT_PUBLIC_AI2_BINANCE_PRIVATE_KEY=your_ai2_wallet_private_key_here

# ============================================
# AI #3 - GROK-4
# ============================================
NEXT_PUBLIC_AI3_ASTERDEX_API_KEY=your_ai3_asterdex_api_key_here
NEXT_PUBLIC_AI3_ASTERDEX_API_SECRET=your_ai3_asterdex_api_secret_here
NEXT_PUBLIC_AI3_BINANCE_WALLET=your_ai3_bnb_wallet_address_here
NEXT_PUBLIC_AI3_BINANCE_PRIVATE_KEY=your_ai3_wallet_private_key_here

# ============================================
# AI #4 - Qwen 3 Max
# ============================================
NEXT_PUBLIC_AI4_ASTERDEX_API_KEY=your_ai4_asterdex_api_key_here
NEXT_PUBLIC_AI4_ASTERDEX_API_SECRET=your_ai4_asterdex_api_secret_here
NEXT_PUBLIC_AI4_BINANCE_WALLET=your_ai4_bnb_wallet_address_here
NEXT_PUBLIC_AI4_BINANCE_PRIVATE_KEY=your_ai4_wallet_private_key_here

# ============================================
# AI #5 - Gemini 2.5 Pro
# ============================================
NEXT_PUBLIC_AI5_ASTERDEX_API_KEY=your_ai5_asterdex_api_key_here
NEXT_PUBLIC_AI5_ASTERDEX_API_SECRET=your_ai5_asterdex_api_secret_here
NEXT_PUBLIC_AI5_BINANCE_WALLET=your_ai5_bnb_wallet_address_here
NEXT_PUBLIC_AI5_BINANCE_PRIVATE_KEY=your_ai5_wallet_private_key_here
```

## What You Need to Provide

### For Each AI (1-5):

#### 1. Asterdex API Credentials
- **API Key**: Get from Asterdex dashboard
- **API Secret**: Get from Asterdex dashboard
- Each AI needs its own Asterdex futures account
- Create 5 separate accounts on Asterdex

#### 2. Binance Blockchain Wallet (for Four.meme trading)
- **Wallet Address**: BNB Chain (BSC) wallet address (0x...)
- **Private Key**: Private key for signing transactions
- Fund each wallet with BNB for gas fees
- Each AI should have its own wallet for security

## Setup Steps

### Step 1: Create Asterdex Accounts

For each of your 5 AIs:

1. Go to Asterdex
2. Create new account (or use subaccounts if supported)
3. Generate API key with futures trading permissions
4. Copy API key and secret
5. Fund account with starting capital (e.g., $1000-$2000 USDT each)

### Step 2: Create BNB Wallets

For each AI:

1. Use MetaMask or create new wallet programmatically
2. Get wallet address (0x...)
3. Export private key (keep secure!)
4. Fund with BNB for gas (~0.1 BNB per wallet)
5. Optionally fund with starting USDT/BUSD for token purchases

### Step 3: Update .env.local

Copy the template above and fill in all values for each AI.

### Step 4: Restart Server

```bash
Get-Process node | Stop-Process -Force
npm run dev
```

### Step 5: Visit AI Arena

http://localhost:3000/ai-arena

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to git (already in .gitignore)
- Private keys give full access to wallets - keep them secret
- For production, use server-side key management
- Consider hardware wallets or key management services
- Start with small amounts to test

## What the System Does

### Every 5 Minutes:

**Each AI independently:**

1. **Asterdex Trading**
   - Checks market conditions
   - Decides whether to trade (BTC, ETH, BNB, SOL, XRP)
   - Places $100 trade if opportunity detected
   - Sets stop loss and take profit

2. **Binance Blockchain Trading**
   - Reviews promising Four.meme tokens
   - Checks bonding curve progress (55-85%)
   - Verifies not a honeypot
   - Buys token if criteria met ($100 trade)

3. **Performance Tracking**
   - Calculates total P&L
   - Updates win rate
   - Tracks Asterdex vs Binance performance

## Testing

Before going live with real money:

1. **Test with small amounts** - Use $10-20 per trade first
2. **Monitor for 24 hours** - Watch AI behavior
3. **Check logs** - Ensure trades execute correctly
4. **Verify balances** - Confirm P&L calculations
5. **Gradually increase** - Scale up after confidence

## Customizing AI Logic

### Asterdex Strategy

Edit `lib/ai-trader.ts` → `shouldTradeAsterdex()` method:

```typescript
async shouldTradeAsterdex(): Promise<{ trade: boolean; symbol?: string; side?: 'BUY' | 'SELL' }> {
  // Add your Asterdex trading logic here
  // E.g., technical analysis, sentiment, etc.
  return { trade: false };
}
```

### Four.meme Strategy

Edit `lib/ai-trader.ts` → `shouldTradeBinanceToken()` method:

```typescript
async shouldTradeBinanceToken(token: FourMemeToken): Promise<{ trade: boolean; action?: 'BUY' | 'SELL' }> {
  // Add your Four.meme token selection logic here
  // Token already filtered for quality
  return { trade: false };
}
```

### Binance Blockchain Execution

Edit `lib/ai-trader.ts` → `tradeBinanceToken()` method:

```typescript
async tradeBinanceToken(token: FourMemeToken, action: 'BUY' | 'SELL', usdAmount: number) {
  // Replace placeholder with your actual Binance blockchain buying logic
  // Use this.binanceWallet and this.binancePrivateKey
  // Execute swap on PancakeSwap or Four.meme contract
}
```

## Next Steps

1. ✅ Get 5 Asterdex API key pairs
2. ✅ Create 5 BNB wallets (addresses + private keys)
3. ✅ Update .env.local with all credentials
4. ✅ Restart server
5. ✅ Provide your Binance blockchain buying logic
6. ✅ Test with small amounts first
7. ✅ Monitor and adjust AI strategies

Once you provide the credentials and buying logic, the entire system will be operational!

