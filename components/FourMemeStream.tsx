'use client';

import { useFourMemeStream } from '@/hooks/useFourMemeStream';
import Link from 'next/link';

export default function FourMemeStream() {
  const { tokens, isConnected, isBackfilling, error } = useFourMemeStream();

  return (
    <div className="bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-bold text-yellow uppercase tracking-widest mb-1">
            Token Stream
          </h2>
          <p className="text-xs text-muted">Collecting tokens • Analyzed every 2 minutes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-muted">
            {tokens.length} collected
          </div>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow rounded-full animate-pulse"></span>
              <span className="text-xs font-mono text-yellow">LIVE</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-xs font-mono text-red-500">ERROR</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-muted rounded-full animate-pulse"></span>
              <span className="text-xs font-mono text-muted">CONNECTING</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border-2 border-red-500 text-red-500 text-xs">
          <p className="font-bold mb-2 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            Connection Error
          </p>
          <p className="mb-3">{error}</p>
          <div className="bg-black p-3 border border-red-500/30 font-mono text-white mb-3">
            <p className="text-yellow mb-1">Create .env.local file:</p>
            <code>NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_...</code>
          </div>
          <p className="text-red-500/70">
            Then restart: <code className="bg-black px-2 py-0.5">npm run dev</code>
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {isBackfilling ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3 animate-pulse">📦</div>
            <p className="text-sm text-yellow font-bold mb-1">Loading recent tokens...</p>
            <p className="text-xs text-muted">Fetching last 24 hours of Four.meme tokens</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-xs">Waiting for new tokens...</p>
            <p className="text-xs text-muted mt-2">No tokens created in the last 24h</p>
          </div>
        ) : (
          tokens.map((token) => (
            <div
              key={token.id}
              className="bg-black border border-border p-3 hover:border-yellow/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-yellow transition-colors">
                    {token.name}
                  </h3>
                  <p className="text-xs text-muted font-mono">{token.symbol}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-yellow font-mono">NEW</div>
                  <div className="text-xs text-muted">
                    {new Date(token.blockTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <span className="text-muted">Creator:</span>
                  <p className="font-mono text-white/70 truncate">
                    {token.creator?.slice(0, 6)}...{token.creator?.slice(-4)}
                  </p>
                </div>
                <div>
                  <span className="text-muted">Token:</span>
                  <p className="font-mono text-white/70 truncate">
                    {token.token?.slice(0, 6)}...{token.token?.slice(-4)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <span className="text-muted">Supply:</span>
                  <p className="font-mono text-white/70">
                    {(parseInt(token.totalSupply || '0') / 1e9).toFixed(2)}B
                  </p>
                </div>
                <div>
                  <span className="text-muted">Launch:</span>
                  <p className="font-mono text-white/70">
                    {token.launchTime ? new Date(token.launchTime * 1000).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Link
                  href={`https://bscscan.com/tx/${token.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-yellow/10 border border-yellow/30 text-yellow hover:bg-yellow/20 transition-colors font-mono"
                >
                  View TX
                </Link>
                <Link
                  href={`https://bscscan.com/address/${token.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-border hover:bg-yellow/5 border border-border hover:border-yellow/30 text-white transition-colors font-mono"
                >
                  Contract
                </Link>
                <span className="ml-auto text-muted font-mono text-xs">
                  {new Date(token.blockTime).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

