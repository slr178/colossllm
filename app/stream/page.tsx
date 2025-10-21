'use client';

import Link from 'next/link';
import FourMemeStream from '@/components/FourMemeStream';

export default function StreamPage() {
  return (
    <main className="flex-1 bg-black min-h-screen">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-muted hover:text-yellow transition-colors uppercase tracking-wider">
            ← Back to Dashboard
          </Link>
          <div className="mt-4">
            <h1 className="text-2xl font-black text-yellow uppercase tracking-tight mb-2">
              Four.meme Token Stream
            </h1>
            <p className="text-sm text-muted">
              Live stream of newly created tokens on BNB Chain via Bitquery API
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border p-4">
            <div className="text-xs font-bold text-yellow uppercase tracking-widest mb-2">
              Network
            </div>
            <div className="text-lg font-mono text-white">BNB Chain</div>
            <div className="text-xs text-muted mt-1">BSC Mainnet</div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="text-xs font-bold text-yellow uppercase tracking-widest mb-2">
              Contract
            </div>
            <div className="text-sm font-mono text-white break-all">0x5c95...762b</div>
            <div className="text-xs text-muted mt-1">Four.meme Factory</div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="text-xs font-bold text-yellow uppercase tracking-widest mb-2">
              API
            </div>
            <div className="text-lg font-mono text-white">Bitquery v2</div>
            <div className="text-xs text-muted mt-1">WebSocket Stream</div>
          </div>
        </div>

        {/* Stream Component */}
        <FourMemeStream />

        {/* How It Works */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border p-5">
            <h2 className="text-xs font-bold text-yellow uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>📦</span> Instant Backfill
            </h2>
            <div className="space-y-2 text-xs text-muted">
              <p>On page load, we fetch the last <span className="text-yellow font-mono">24 hours</span> of Four.meme token creations via HTTP.</p>
              <p>This gives you <span className="text-white">instant data</span> - no waiting for new events!</p>
              <div className="mt-3 p-2 bg-black border border-border">
                <code className="text-white text-xs">GET https://streaming.bitquery.io/graphql</code>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-5">
            <h2 className="text-xs font-bold text-yellow uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>🔌</span> Live Streaming
            </h2>
            <div className="space-y-2 text-xs text-muted">
              <p>After backfill, we maintain a <span className="text-yellow font-mono">WebSocket</span> connection for real-time updates.</p>
              <p>New tokens appear <span className="text-white">instantly</span> as they're created on-chain!</p>
              <div className="mt-3 p-2 bg-black border border-border">
                <code className="text-white text-xs">wss://streaming.bitquery.io/graphql</code>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-6 bg-card border border-yellow/30 p-5">
          <h2 className="text-xs font-bold text-yellow uppercase tracking-widest mb-3">
            Setup Instructions
          </h2>
          <div className="space-y-2 text-xs text-muted">
            <p>To enable streaming, create a <code className="text-yellow bg-black px-2 py-0.5 font-mono">.env.local</code> file in your project root:</p>
            <pre className="bg-black p-3 font-mono text-white border border-border overflow-x-auto">
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_qn-zAKqaGHOGIFpTFCar3nuLyC5rEqNlI9oNO40NWOg.dYZxhmSKBHnOGpACd9gEVPn5jtCY4vhC-AArKm7o4cI
            </pre>
            <p className="text-yellow">Then restart your development server with <code className="bg-black px-2 py-0.5 font-mono">npm run dev</code></p>
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400">
              <p className="font-bold mb-1">✅ Contract Configured</p>
              <p className="text-xs">Four.meme factory contract: <code className="font-mono">0x5c952063c7fc8610ffdb798152d69f0b9550762b</code></p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

