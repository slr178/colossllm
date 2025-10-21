'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAITrading } from '@/hooks/useAITrading';
import { useTokenResearch } from '@/hooks/useTokenResearch';

export default function AIArenaPage() {
  const { promisingTokens } = useTokenResearch();
  const { traders, performances, isRunning, cycleCount } = useAITrading(promisingTokens);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-muted hover:text-yellow transition-colors uppercase tracking-wider">
            ← Back to Dashboard
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-yellow uppercase tracking-tight">AI Trading Arena</h1>
              <p className="text-sm text-muted mt-1">5 AI agents competing in real markets</p>
            </div>
            <div className="flex items-center gap-3">
              {isRunning ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-blue-500/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono text-blue-400">TRADING...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-yellow/30">
                  <div className="w-2 h-2 bg-yellow rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono text-yellow">ACTIVE</span>
                </div>
              )}
              <div className="text-xs font-mono text-muted">
                Cycle #{cycleCount}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border p-4">
            <div className="text-xs text-muted uppercase tracking-widest mb-1">AI Traders</div>
            <div className="text-2xl font-mono font-black text-white">{traders.length}</div>
          </div>
          <div className="bg-card border border-yellow p-4">
            <div className="text-xs text-yellow uppercase tracking-widest mb-1">Opportunities</div>
            <div className="text-2xl font-mono font-black text-yellow">{promisingTokens.length}</div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="text-xs text-muted uppercase tracking-widest mb-1">Platforms</div>
            <div className="text-sm font-mono font-bold text-white">Asterdex + BSC</div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="text-xs text-muted uppercase tracking-widest mb-1">Trade Frequency</div>
            <div className="text-sm font-mono font-bold text-white">Every 5min</div>
          </div>
        </div>

        {/* AI Performance Cards */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-yellow uppercase tracking-widest">
            AI Performance Leaderboard
          </h2>

          {performances.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <div className="text-3xl mb-3 animate-pulse">🤖</div>
              <p className="text-white font-bold mb-2">Initializing AI traders...</p>
              <p className="text-sm text-muted">Setting up Asterdex connections</p>
            </div>
          ) : (
            <div className="space-y-3">
              {performances
                .sort((a, b) => b.performance.totalPnL - a.performance.totalPnL)
                .map((item) => (
                  <div
                    key={item.trader.id}
                    className="bg-card border border-border hover:border-yellow transition-all p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={item.trader.logo}
                            alt={item.trader.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{item.trader.name}</h3>
                          <p className="text-xs text-muted font-mono">{item.trader.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-mono font-black ${
                          item.performance.totalPnL >= 0 ? 'text-yellow' : 'text-red-500'
                        }`}>
                          {item.performance.totalPnL >= 0 ? '+' : ''}
                          ${item.performance.totalPnL.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted">Total P&L</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 text-xs">
                      <div>
                        <div className="text-muted uppercase mb-1">Equity</div>
                        <div className="font-mono text-white font-bold">
                          ${item.performance.currentEquity.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted uppercase mb-1">Trades</div>
                        <div className="font-mono text-white">{item.performance.totalTrades}</div>
                      </div>
                      <div>
                        <div className="text-muted uppercase mb-1">Win Rate</div>
                        <div className="font-mono text-white">{item.performance.winRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted uppercase mb-1">Asterdex</div>
                        <div className={`font-mono ${
                          item.performance.asterdexPnL >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {item.performance.asterdexPnL >= 0 ? '+' : ''}
                          ${item.performance.asterdexPnL.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted uppercase mb-1">Binance</div>
                        <div className={`font-mono ${
                          item.performance.binancePnL >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {item.performance.binancePnL >= 0 ? '+' : ''}
                          ${item.performance.binancePnL.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-card border border-yellow/30 p-5">
          <h2 className="text-xs font-bold text-yellow uppercase tracking-widest mb-3">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted">
            <div>
              <p className="font-bold text-white mb-2">🎯 Asterdex Trading</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Each AI has its own futures account</li>
                <li>$100 trades with 10x leverage</li>
                <li>Auto stop loss (-2%) and take profit (+4%)</li>
                <li>Trades BTC, ETH, BNB, SOL, XRP</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-2">🪙 Binance Blockchain (Four.meme)</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Buys promising tokens from research system</li>
                <li>55%+ bonding curve progress required</li>
                <li>Honeypot detection enabled</li>
                <li>Your buying logic will be integrated here</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

