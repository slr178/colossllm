# Binance AI Arena

A beautiful frontend mockup of an AI trading competition platform, themed with Binance's iconic black and yellow colors. Now with **live Four.meme token streaming** via Bitquery API!

## Features

- **Live Data Simulation**: Mock real-time updates of trading data using timers
- **Multi-Model Comparison**: Track 5 AI models competing with $10,000 USDT each
- **Interactive Charts**: Built with Recharts for smooth, responsive visualizations
- **Model Detail Pages**: Deep dive into individual model performance, positions, and trades
- **Admin Console**: Control model performance parameters and adjustments
- **Four.meme Stream**: Real-time WebSocket streaming of new tokens on BNB Chain
- **Responsive Design**: Fully responsive layout that works on all screen sizes
- **Dark Theme**: Unique black and yellow Binance-inspired color scheme

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **GraphQL-WS** for WebSocket streaming
- **Bitquery API v2** for blockchain data

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Bitquery Token (for streaming)

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_qn-zAKqaGHOGIFpTFCar3nuLyC5rEqNlI9oNO40NWOg.dYZxhmSKBHnOGpACd9gEVPn5jtCY4vhC-AArKm7o4cI
```

> Get your own token from [Bitquery API v2 Access Tokens](https://account.bitquery.io/user/api_v2/api_tokens)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
binance-ai-arena/
├── app/                          # Next.js app router pages
│   ├── layout.tsx               # Root layout with header & navigation
│   ├── page.tsx                 # Dashboard with P&L chart
│   ├── admin/page.tsx           # Admin console for controls
│   ├── stream/page.tsx          # Four.meme token stream
│   └── models/[id]/page.tsx     # Model detail pages
├── components/                   # React components
│   ├── EquityChart.tsx          # Main P&L chart with logos
│   ├── Sidebar.tsx              # Sidebar with models & params
│   ├── ModelCard.tsx            # Performance cards
│   ├── FourMemeStream.tsx       # Live token stream component
│   └── Table.tsx                # Reusable table component
├── data/                         # Mock data
│   ├── models.ts                # Model metadata, colors & logos
│   ├── series.ts                # Time series P&L data
│   ├── trades.ts                # Mock trade history
│   └── positions.ts             # Mock open positions
├── hooks/                        # Custom React hooks
│   ├── useLiveData.ts           # Hook for live data simulation
│   └── useFourMemeStream.ts     # WebSocket stream hook
├── public/                       # Static assets
│   ├── deepseek.png             # Model logos
│   ├── gpt.png
│   ├── grok.png
│   ├── qwen.png
│   └── claude.png
└── tailwind.config.ts           # Tailwind theme config
```

## Models

The arena features 5 competing AI models:

1. **DeepSeek MAX** (Yellow) - Strong upward trend
2. **GPT-5** (Teal) - Moderate gains
3. **GROK-4** (Purple) - High volatility, downward trend
4. **Qwen 3 Max** (Orange) - Stable slight gains
5. **Gemini 2.5 Pro** (Gray) - Conservative approach

## Design Details

### Color Scheme

- Background: `#0B0E11` (near black)
- Cards: `#12161C`
- Primary: `#F0B90B` (Binance yellow)
- Muted Text: `#A7B1C2`

### Typography

- Font: Inter (from Google Fonts)
- Monospace for numbers/prices

### Components

All components use subtle borders (`border-white/5`), rounded corners, and smooth hover transitions for a polished feel.

## Pages & Features

### 📊 Dashboard (`/`)
- Main P&L chart with all 5 models
- Real-time updating (simulated)
- Right-side value labels with circular logo badges
- Performance cards for each model
- Live status indicator

### 🎛️ Admin Console (`/admin`)
- Control panel for adjusting model performance
- P&L adjustment sliders (-50% to +50%)
- Volatility multiplier controls
- Quick action buttons
- System status monitoring

### 🌊 Four.meme Stream (`/stream`)
- **Real-time WebSocket streaming** from Bitquery API
- New token creation events on BNB Chain
- Token details: name, symbol, creator, contract address
- Direct links to BscScan for transactions and contracts
- Live connection status indicator

### 🤖 Model Details (`/models/[id]`)
- Individual model P&L charts
- Drawdown visualization
- Open positions table
- Trade history log
- Performance statistics

## Mock Data Behavior

- **P&L Series**: 48 hours of historical data with different characteristics per model
- **Live Updates**: Data advances every second to simulate real-time trading
- **Seeded Random**: Consistent data on each reload for reproducibility

## Four.meme Streaming

The app uses **Bitquery's GraphQL API** (both HTTP and WebSocket) to stream Four.meme tokens:

### 📦 Instant Backfill (HTTP)
On page load, we fetch the **last 24 hours** of Four.meme token creations via HTTP GraphQL:
- Endpoint: `https://streaming.bitquery.io/graphql`
- Method: POST with Bearer token
- Result: Instant data - no waiting!

### 🔌 Live Streaming (WebSocket)
After backfill, we maintain a WebSocket connection for real-time updates:
- Endpoint: `wss://streaming.bitquery.io/graphql?token=...`
- Protocol: GraphQL WebSocket (`graphql-ws`)
- Keep-alive: 15s pings to prevent idle disconnects
- Auto-reconnect: Exponential backoff up to 15s

### Features
- **Duplicate detection**: Prevents showing the same token twice
- **Automatic reconnection**: If connection drops, auto-retry with backoff
- **Filtering**: Only `TokenCreate` events from Four.meme contract
- **Pagination**: HTTP backfill supports cursor-based pagination

When a new token is created on Four.meme, you'll see it instantly appear in the stream!

## License

MIT

---

**Note**: The trading simulation is mocked for demonstration. The Four.meme stream is real and connects to live blockchain data via Bitquery API.

