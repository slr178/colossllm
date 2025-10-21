COLOSSLLM

COLOSSLLM is an AI-powered trading arena where six autonomous models compete in real-time — trading perpetuals on AsterDEX and memecoins on the Binance blockchain.
Built with Binance’s bold black-and-yellow aesthetic, it blends simulated AI trading with live blockchain data from Bitquery.

🚀 Features

Live Trading Simulation – Real-time profit and loss updates

Six AI Traders – Each model starts with $2,000 USDT to trade perps and memecoins

Interactive Charts – Smooth visualizations built with Recharts

Model Analytics – View open positions, trade history, and performance

Admin Console – Tune volatility, returns, and trading parameters

Four.meme Stream – Real-time memecoin listings via Bitquery API

Responsive Design – Optimized for all screen sizes

Dark Binance Theme – Black, gray, and gold UI inspired by Binance

🧠 Tech Stack

Next.js 14 (App Router)

TypeScript

Tailwind CSS

Recharts for charting

GraphQL-WS for WebSocket streaming

Bitquery API v2 for blockchain data

⚙️ Getting Started
1. Install Dependencies
npm install

2. Configure Environment

Create a .env.local file:

# BITQUERY
NEXT_PUBLIC_BITQUERY_TOKEN=your_bitquery_api_token

# AI #1 - DeepSeek MAX
NEXT_PUBLIC_AI1_ASTERDEX_API_KEY=your_ai1_asterdex_api_key
NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET=your_ai1_asterdex_api_secret
NEXT_PUBLIC_AI1_BINANCE_WALLET=your_ai1_binance_wallet_address
NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY=your_ai1_binance_private_key

# AI #2 - GPT-5
NEXT_PUBLIC_AI2_ASTERDEX_API_KEY=your_ai2_asterdex_api_key
NEXT_PUBLIC_AI2_ASTERDEX_API_SECRET=your_ai2_asterdex_api_secret
NEXT_PUBLIC_AI2_BINANCE_WALLET=your_ai2_binance_wallet_address
NEXT_PUBLIC_AI2_BINANCE_PRIVATE_KEY=your_ai2_binance_private_key

# AI #3 - GROK-4
NEXT_PUBLIC_AI3_ASTERDEX_API_KEY=your_ai3_asterdex_api_key
NEXT_PUBLIC_AI3_ASTERDEX_API_SECRET=your_ai3_asterdex_api_secret
NEXT_PUBLIC_AI3_BINANCE_WALLET=your_ai3_binance_wallet_address
NEXT_PUBLIC_AI3_BINANCE_PRIVATE_KEY=your_ai3_binance_private_key

# AI #4 - Qwen 3 Max
NEXT_PUBLIC_AI4_ASTERDEX_API_KEY=your_ai4_asterdex_api_key
NEXT_PUBLIC_AI4_ASTERDEX_API_SECRET=your_ai4_asterdex_api_secret
NEXT_PUBLIC_AI4_BINANCE_WALLET=your_ai4_binance_wallet_address
NEXT_PUBLIC_AI4_BINANCE_PRIVATE_KEY=your_ai4_binance_private_key

# AI #5 - Gemini 2.5 Pro
NEXT_PUBLIC_AI5_ASTERDEX_API_KEY=your_ai5_asterdex_api_key
NEXT_PUBLIC_AI5_ASTERDEX_API_SECRET=your_ai5_asterdex_api_secret
NEXT_PUBLIC_AI5_BINANCE_WALLET=your_ai5_binance_wallet_address
NEXT_PUBLIC_AI5_BINANCE_PRIVATE_KEY=your_ai5_binance_private_key

# AI #6 - Claude 3 Opus
NEXT_PUBLIC_AI6_ASTERDEX_API_KEY=your_ai6_asterdex_api_key
NEXT_PUBLIC_AI6_ASTERDEX_API_SECRET=your_ai6_asterdex_api_secret
NEXT_PUBLIC_AI6_BINANCE_WALLET=your_ai6_binance_wallet_address
NEXT_PUBLIC_AI6_BINANCE_PRIVATE_KEY=your_ai6_binance_private_key

# AI Provider API Keys
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_XAI_API_KEY=your_xai_api_key
NEXT_PUBLIC_QWEN_API_KEY=your_qwen_api_key
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key

# BSC Test Wallet
NEXT_PUBLIC_BSC_RPC_URL=your_bsc_rpc_url
NEXT_PUBLIC_TEST_WALLET_PRIVATE_KEY=your_test_wallet_private_key
NEXT_PUBLIC_TEST_WALLET_ADDRESS=your_test_wallet_address


Get a token at Bitquery API Tokens

3. Run Development Server
npm run dev


Then open http://localhost:3000
.

📂 Project Structure
collosllm/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── admin/page.tsx        # Admin console
│   ├── stream/page.tsx       # Four.meme live stream
│   └── models/[id]/page.tsx  # Model detail pages
├── components/               # Reusable UI components
├── data/                     # Mock data (P&L, trades, positions)
├── hooks/                    # Live data & WebSocket hooks
├── public/                   # Logos & static assets
└── tailwind.config.ts        # Theme config

🤖 AI Models
Model	Style	Theme
DeepSeek MAX	Aggressive, high-risk	Yellow
GPT-5	Stable trend follower	Teal
GROK-4	Volatile, reactive	Purple
Qwen 3 Max	Mid-range, consistent	Orange
Gemini 2.5 Pro	Conservative, low-risk	Gray
Claude 3 Opus	Adaptive hybrid	Gold

Each model trades autonomously with a $2,000 USDT starting balance.

🎨 Design

Colors

Background – #0B0E11

Cards – #12161C

Accent – #F0B90B (Binance Yellow)

Text – #A7B1C2

Typography

Main Font: Inter

Numbers: Monospace

Polished UI with smooth transitions, rounded corners, and minimal borders.

📊 Main Pages
Dashboard (/)

Six-model leaderboard and P&L charts

Real-time simulated updates

Admin Console (/admin)

Adjust model performance, volatility, and returns

System monitoring

Four.meme Stream (/stream)

Live BNB Chain token events via Bitquery

Token name, symbol, creator, and BscScan links

Model Details (/models/[id])

Individual model charts

Open positions and trade logs

🔗 Four.meme Integration

Uses Bitquery GraphQL API for real-time token data:

HTTP Backfill – Last 24 hours of new tokens

WebSocket Feed – Ongoing token creation stream

Duplicate Filtering + Auto-Reconnect

New Four.meme tokens appear instantly in the live feed.

📜 License

MIT License © 2025 COLOSSLLM

Note:
Trading performance is simulated for visual purposes.
The Four.meme stream uses live blockchain data from Bitquery API.

GitHub tagline suggestion:

“Six AI traders battle on AsterDEX & Binance Chain — real-time charts, live memecoins, and Binance-style visuals.”
