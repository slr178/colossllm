# Test Wallet Setup for .env

Add these to your `.env` or `.env.local` file:

```bash
# ============================================
# BSC TEST WALLET (for test transactions)
# ============================================

# Ankr BNB Chain RPC URL (your personal endpoint)
NEXT_PUBLIC_BSC_RPC_URL=https://rpc.ankr.com/bsc/59fb8447a6e6e021f463a5bcd79b7b11778f3f8610576a06727fb130966cf149

# Test Wallet Private Key (keep this secret!)
# Create a new wallet just for testing with small amounts
NEXT_PUBLIC_TEST_WALLET_PRIVATE_KEY=0xyour_private_key_here

# Test Wallet Address (for display/verification)
NEXT_PUBLIC_TEST_WALLET_ADDRESS=0xyour_wallet_address_here
```

## 🔐 How to Get Test Wallet:

### Option 1: MetaMask (Recommended)
1. Create new account in MetaMask
2. Name it "Test Wallet - Small Amounts Only"
3. Go to Account Details → Export Private Key
4. Copy private key (starts with 0x)
5. Copy wallet address
6. Send small amount of BNB for gas (~0.01 BNB)

### Option 2: Generate Programmatically
```bash
# In Node.js console:
const ethers = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

## ⚠️ Security Notes:

- **Never use your main wallet** for testing
- **Only fund with small amounts** you can afford to lose
- **Never commit .env files** to git
- **Test wallet should have max 0.1 BNB**
- **Private key = full access**, keep it secret!

## 📝 Complete .env Example:

```bash
# Bitquery
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_BfvFLRAQ...

# BSC Test Wallet
NEXT_PUBLIC_BSC_RPC_URL=https://rpc.ankr.com/bsc/59fb8447a6e6e021f463a5bcd79b7b11778f3f8610576a06727fb130966cf149
NEXT_PUBLIC_TEST_WALLET_PRIVATE_KEY=0x1234567890abcdef... (64 hex chars)
NEXT_PUBLIC_TEST_WALLET_ADDRESS=0xYourWalletAddress...

# AI Model APIs
NEXT_PUBLIC_DEEPSEEK_API_KEY=sk-...
# ... etc
```

## 💰 Funding Your Test Wallet:

1. **Get BNB** from main wallet or exchange
2. **Send 0.05-0.1 BNB** to test wallet address
3. **This covers:**
   - Gas fees (~$0.20 per swap)
   - Small token purchases for testing
   - Multiple test transactions

Once configured, the "TEST BUY" button will use this wallet for transactions!

