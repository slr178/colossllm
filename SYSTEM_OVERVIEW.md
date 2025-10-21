# Token Research System - Complete Overview

## 🎯 System Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  STAGE 1: TOKEN COLLECTION (Continuous)                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  HTTP Backfill (On Page Load)                           │
│  └─> Fetch last 24h of TokenCreate events               │
│      └─> Store in rawTokens[] array                     │
│                                                           │
│  WebSocket Stream (Real-time)                           │
│  └─> Listen for new TokenCreate events                  │
│      └─> Add to rawTokens[] array                       │
│      └─> No duplicates                                   │
│                                                           │
│  Result: Growing list of raw tokens (NO ANALYSIS YET)   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  STAGE 2: BATCH ANALYSIS (Every 2 Minutes)              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Timer Triggers: setInterval(120,000ms)                 │
│                                                           │
│  For EACH token in rawTokens[]:                         │
│    1. Fetch Balance from Four.meme Proxy               │
│       └─> Query: BalanceUpdates at 0x5c95...762b       │
│                                                           │
│    2. Fetch Trade Data                                  │
│       └─> Volume, Trades, Price                         │
│                                                           │
│    3. Fetch Holder Count                                │
│       └─> Unique addresses with balance > 0            │
│                                                           │
│    4. Calculate Bonding Progress                        │
│       └─> Formula: 100 - ((balance - 200M) * 100 / 800M)│
│                                                           │
│    5. Calculate Quality Score (0-100)                   │
│       └─> Based on cap, volume, trades, progress        │
│                                                           │
│    6. Check Filter Criteria                             │
│       ├─> Market Cap: $14K - $40K                       │
│       ├─> Volume 24h: > $2K                             │
│       ├─> Trades 24h: > 20                              │
│       ├─> Progress: 10% - 90%                           │
│       └─> Holders: > 20                                 │
│                                                           │
│  Result: enrichedTokens[] + promisingTokens[]           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  STAGE 3: DISPLAY (Real-time UI Updates)                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Promising Tokens Section                               │
│  └─> Show only tokens meeting ALL criteria              │
│  └─> Sorted by score (highest first)                    │
│  └─> Display: price, cap, volume, progress, holders     │
│                                                           │
│  All Tokens Section                                      │
│  └─> Show all analyzed tokens                           │
│  └─> Visual indicator for promising ones                │
│                                                           │
│  Status Indicators                                       │
│  ├─> "STREAM LIVE" - WebSocket connected                │
│  ├─> "ANALYZING..." - Batch analysis running            │
│  └─> "Next analysis: 1:45" - Countdown timer            │
└─────────────────────────────────────────────────────────┘
```

## 📊 Data Queries

### 1. New Token Events (WebSocket)

**Endpoint:** `wss://streaming.bitquery.io/graphql?token=<TOKEN>`

```graphql
subscription {
  EVM(network: bsc) {
    Events(
      where: {
        Transaction: { To: { is: "0x5c952063c7fc8610ffdb798152d69f0b9550762b" } }
        Log: { Signature: { Name: { is: "TokenCreate" } } }
      }
      limit: { count: 10 }
      orderBy: { descending: Block_Time }
    ) {
      Block { Time }
      Transaction { Hash From }
      Arguments {
        Name
        Value {
          ... on EVM_ABI_Address_Value_Arg { address }
          ... on EVM_ABI_String_Value_Arg { string }
          ... on EVM_ABI_BigInt_Value_Arg { bigInteger }
          ... on EVM_ABI_Integer_Value_Arg { integer }
        }
      }
    }
  }
}
```

**Returns:** creator, token address, name, symbol, totalSupply, launchTime, etc.

### 2. Historical Tokens (HTTP Backfill)

**Endpoint:** `https://streaming.bitquery.io/graphql`
**Method:** POST with `Authorization: Bearer <TOKEN>`

```graphql
query ($from: DateTime!) {
  EVM(network: bsc) {
    Events(
      where: {
        Transaction: { To: { is: "0x5c952063c7fc8610ffdb798152d69f0b9550762b" } }
        Log: { Signature: { Name: { is: "TokenCreate" } } }
        Block: { Time: { after: $from } }
      }
      limit: { count: 200 }
      orderBy: { descending: Block_Time }
    ) {
      Block { Time }
      Transaction { Hash From }
      Arguments {
        Name
        Value {
          ... on EVM_ABI_Address_Value_Arg { address }
          ... on EVM_ABI_String_Value_Arg { string }
          ... on EVM_ABI_BigInt_Value_Arg { bigInteger }
          ... on EVM_ABI_Integer_Value_Arg { integer }
        }
      }
    }
  }
}
```

**Variables:** `{ from: "2025-10-19T00:00:00Z" }` (24h ago)

### 3. Bonding Curve Balance (Per Token)

```graphql
query MyQuery($token: String) {
  EVM(dataset: combined, network: bsc) {
    BalanceUpdates(
      where: {
        BalanceUpdate: { Address: { is: "0x5c952063c7fc8610FFDB798152D69F0B9550762b" } }
        Currency: { SmartContract: { is: $token } }
      }
      orderBy: { descendingByField: "balance" }
    ) {
      Currency { Name }
      balance: sum(of: BalanceUpdate_Amount)
      BalanceUpdate { Address }
    }
  }
}
```

**Returns:** Current token balance at Four.meme proxy

**Formula:**
```
leftTokens = balance - 200,000,000
initialRealTokenReserves = 800,000,000
BondingCurveProgress = 100 - ((leftTokens * 100) / initialRealTokenReserves)
```

### 4. Trade Metrics (Per Token)

```graphql
query ($token: String!) {
  EVM(network: bsc) {
    DEXTradeByTokens(
      where: {
        Trade: {
          Currency: { SmartContract: { is: $token } }
          Success: true
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
        }
      }
    ) {
      Trade {
        price_usd: PriceInUSD(maximum: Block_Number)
      }
      volume_24h: sum(of: Trade_Side_AmountInUSD)
      trades_24h: count
    }
  }
}
```

**Returns:** Price in USD, 24h volume, trade count

### 5. Holder Count (Per Token)

```graphql
query ($token: String!) {
  EVM(network: bsc) {
    BalanceUpdates(
      where: {
        Currency: { SmartContract: { is: $token } }
      }
    ) {
      holders: uniq(of: BalanceUpdate_Address)
    }
  }
}
```

**Returns:** Number of unique holders

## 🔍 Filtering Criteria

### Promising Token Must Have:

| Metric | Minimum | Maximum | Reason |
|--------|---------|---------|--------|
| Market Cap | $14,000 | $40,000 | Early but proven traction |
| 24h Volume | $2,000 | - | Active trading |
| 24h Trades | 20 | - | Multiple participants |
| Bonding Progress | 10% | 90% | Mid-stage (not too early/late) |
| Holders | 20 | - | Distributed interest |

### Quality Score (0-100)

- **Market Cap Position** (20 pts): Favor tokens near middle of $14K-$40K range
- **Trading Volume** (30 pts): Higher volume = higher score
- **Trade Activity** (20 pts): More trades = more points
- **Bonding Progress** (15 pts): Favor 40-60% progress (mid-stage)
- **Holder Count** (15 pts): More holders = better distribution

## ⏱️ Timing

### Initial Load
1. Page loads
2. HTTP backfill fetches last 24h (instant data)
3. WebSocket connects and starts streaming
4. Tokens accumulate in rawTokens[]
5. **First analysis runs immediately** when tokens are available

### Ongoing Operation
1. WebSocket adds new tokens as they're created
2. **Every 2 minutes**: Batch analysis runs
3. All tokens re-analyzed with fresh metrics
4. Promising list updates
5. UI shows countdown to next analysis

## 📁 File Structure

```
lib/
  ├── bitquery.ts           # Core API utilities, HTTP backfill, parsing
  ├── token-metrics.ts      # Metrics fetching, filtering, scoring
  └── pancakeswap-stream.ts # Optional: PancakeSwap pairs

hooks/
  ├── useFourMemeStream.ts  # Token collection (HTTP + WebSocket)
  ├── useTokenResearch.ts   # Batch analysis every 2 min
  └── useLiveData.ts        # For AI model mock data

components/
  ├── FourMemeStream.tsx    # Raw token stream display
  └── ...

app/
  ├── research/page.tsx     # Main research dashboard
  ├── stream/page.tsx       # Raw stream view
  └── admin/page.tsx        # Control panel
```

## 🚀 Usage

### Prerequisites
```bash
# .env.local
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_...
```

### Running
```bash
npm run dev
# Visit http://localhost:3000/research
```

### Console Output

**On Load:**
```
🔍 Environment check:
Token exists: true
📦 Loading recent Four.meme tokens...
📦 Backfilling tokens from last 24 hours...
✅ Backfilled 12 tokens
✅ Loaded 12 historical tokens
🔌 Connecting to Bitquery WebSocket...
✅ Connected to Bitquery WebSocket
```

**Every 2 Minutes:**
```
🔬 === BATCH ANALYSIS STARTING ===
Analyzing 12 tokens...
Next analysis in 2 minutes

📊 MoonRocket (MOON)...
   📊 Cap: $8.5K | Vol: $450 | Trades: 12 | Progress: 31.2% | Holders: 8
   ⏭️  Skip (Cap too low)

📊 SuperCoin (SUPER)...
   📊 Cap: $22.5K | Vol: $3200 | Trades: 45 | Progress: 56.3% | Holders: 32
   ✨ PROMISING! Score: 78

✅ === BATCH ANALYSIS COMPLETE ===
Total analyzed: 12
Promising found: 1
Next analysis: 3:52:00 PM
```

## 🎨 UI Features

- **Clean black/yellow minimalist theme**
- **Stat cards** at top (Total, Promising, Criteria)
- **Promising tokens section** - Yellow bordered cards with full details
- **Progress bars** - Visual bonding curve progress
- **Score badges** - Quality score 0-100
- **BscScan links** - Direct links to token and transaction
- **Countdown timer** - Shows time until next analysis
- **Status indicators** - LIVE, ANALYZING, etc.

## 📈 Why This Works

✅ **Tokens mature** - 2-minute wait lets trading activity develop  
✅ **Batch processing** - Efficient use of API calls  
✅ **Rate limit friendly** - 200ms delay between token queries  
✅ **Accurate metrics** - Uses exact Bitquery Four.meme queries  
✅ **Correct formula** - Bonding progress from official docs  
✅ **Smart filtering** - Multi-criteria quality assessment  
✅ **Real-time updates** - WebSocket + periodic re-analysis  
✅ **No false positives** - Strict criteria eliminate noise  

## 🔧 Troubleshooting

### No tokens appearing?
- Check browser console for API errors
- Verify token in .env.local
- Ensure server was restarted after adding token
- Check Bitquery API status

### All showing 100% progress?
- Token might be fully sold (graduated)
- Balance query might not have data yet (brand new)
- Check console logs for actual balance values

### No promising tokens?
- Last 24h might have had no qualifying tokens
- Try lowering criteria in `lib/token-metrics.ts`
- Check console to see why tokens are being filtered out
- Criteria might be too strict for current market conditions

## 📚 References

- [Bitquery Four.meme Docs](https://docs.bitquery.io/docs/blockchain/BSC/four-meme-api/)
- [Bonding Curve Progress](https://docs.bitquery.io/docs/blockchain/BSC/four-meme-api/#bonding-curve-progress-api-for-fourmeme-token)
- [WebSocket Authentication](https://docs.bitquery.io/docs/authorisation/websocket/)
- Four.meme Contract: `0x5c952063c7fc8610ffdb798152d69f0b9550762b`

