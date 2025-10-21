'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { models } from '@/data/models';
import dynamic from 'next/dynamic';

// Dynamically import chart to avoid SSR issues
const PerformanceChart = dynamic(() => import('@/components/PerformanceChart'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-yellow text-sm">Loading chart...</div>
});

interface JournalEntry {
  timestamp: number;
  aiNumber: number;
  type: 'BNB_BUY' | 'ASTER_LONG' | 'ASTER_SHORT' | 'ASTER_CLOSE' | 'DECISION' | 'ERROR';
  symbol?: string;
  decision?: string;
  reasoning?: string;
  amount?: number;
  leverage?: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence?: number;
  result?: string;
  txHash?: string;
  orderId?: string;
}

interface AIStatus {
  aiNumber: number;
  aiName: string;
  isRunning: boolean;
  lastAction?: string;
  lastActionTime?: number;
  bnbPositions: any[];
  asterTrades: any[];
  totalBNBSpent: number;
  totalBNBPnL: number;
  totalAsterPnL: number;
  successCount: number;
  failureCount: number;
  totalBalance?: number;
  initialBalance?: number;
  binanceBalance?: number;
  asterdexBalance?: number;
  totalPnL?: number;
  totalPnLPercent?: number;
}

interface AggregatedStats {
  totalAIs: number;
  runningAIs: number;
  totalBNBPositions: number;
  activeBNBPositions: number;
  totalAsterTrades: number;
  activeAsterTrades: number;
  totalBNBSpent: number;
  totalBNBPnL: number;
  totalAsterPnL: number;
  totalSuccesses: number;
  totalFailures: number;
}

interface PerformanceData {
  timestamp: number;
  ai1: number;
  ai2: number;
  ai3: number;
  ai4: number;
  ai5: number;
  ai6: number;
}

export default function HomePage() {
  const [statuses, setStatuses] = useState<AIStatus[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedStats | null>(null);
  const [journals, setJournals] = useState<Record<number, JournalEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);

  // Fetch data every 2 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/automation/status');
        const data = await res.json();
        
        if (data.success) {
          setStatuses(data.statuses || []);
          setAggregated(data.aggregated || null);
          setJournals(data.journals || {});
          
          // Debug log to check P&L data
          if (data.statuses && data.statuses.length > 0) {
            console.log('Status data:', data.statuses.map((s: any) => ({
              ai: s.aiNumber,
              balance: s.totalBalance,
              pnl: s.totalPnL,
              pnlPercent: s.totalPnLPercent
            })));
          }
          
          // Add new performance data point
          if (data.statuses && data.statuses.length > 0) {
            const newDataPoint: PerformanceData = {
              timestamp: Date.now(),
              // Include unrealized P&L in portfolio value
              ai1: (data.statuses[0]?.totalBalance || 1000) + (data.statuses[0]?.totalAsterPnL || 0),
              ai2: (data.statuses[1]?.totalBalance || 1000) + (data.statuses[1]?.totalAsterPnL || 0),
              ai3: (data.statuses[2]?.totalBalance || 1000) + (data.statuses[2]?.totalAsterPnL || 0),
              ai4: (data.statuses[3]?.totalBalance || 1000) + (data.statuses[3]?.totalAsterPnL || 0),
              ai5: (data.statuses[4]?.totalBalance || 1000) + (data.statuses[4]?.totalAsterPnL || 0),
              ai6: (data.statuses[5]?.totalBalance || 1000) + (data.statuses[5]?.totalAsterPnL || 0),
            };
            
            setPerformanceHistory(prev => {
              const newHistory = [...prev, newDataPoint];
              // Keep last 100 data points (about 3 minutes of data at 2s intervals)
              return newHistory.slice(-100);
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds to reduce scrolling
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [journals, autoScroll]);

  // Combine all journal entries and sort by timestamp
  const allLogs = Object.entries(journals)
    .flatMap(([aiNum, entries]) => 
      entries.map(entry => ({ ...entry, aiNumber: parseInt(aiNum) }))
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100); // Show last 100 entries

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatPnL = (value: number) => {
    const formatted = value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
    return <span className={value >= 0 ? 'text-green-500' : 'text-red-500'}>{formatted}</span>;
  };

  // Calculate total P&L from individual AI P&Ls
  const totalPnL = statuses.reduce((sum, status) => sum + (status.totalPnL || 0), 0);
  // Calculate total starting capital from actual AI initial balances (default $1900)
  const totalStartingCapital = statuses.reduce((sum, status) => sum + (status.initialBalance || 1900), 0) || 11400;
  const totalCurrentBalance = statuses.reduce((sum, status) => sum + (status.totalBalance || 1900), 0);
  const totalEquity = totalCurrentBalance > 0 ? totalCurrentBalance : totalStartingCapital;
  const roiPercent = totalStartingCapital > 0 ? (totalPnL / totalStartingCapital) * 100 : 0;
  
  // Initialize with starting values
  useEffect(() => {
    if (performanceHistory.length === 0) {
      const initialData: PerformanceData = {
        timestamp: Date.now(),
        ai1: 1900,
        ai2: 1900,
        ai3: 1900,
        ai4: 1900,
        ai5: 1900,
        ai6: 1900,
      };
      setPerformanceHistory([initialData]);
    }
  }, []);

  // Sort AIs by performance for leaderboard
  const leaderboard = statuses
    .map((status, idx) => ({
      ...status,
      model: models[idx],
      totalPnL: status.totalPnL || 0,
      equity: status.totalBalance || 1900,
      initialBalance: status.initialBalance || 1900,
    }))
    .sort((a, b) => b.totalPnL - a.totalPnL);

  if (loading) {
    return (
      <main className="flex-1 bg-black">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-yellow font-mono text-sm">Loading...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-black">
      <div className="container mx-auto px-6 py-6">
        {/* Performance Chart and Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <div className="bg-card border border-border p-6">
              <div className="h-[400px]">
                <PerformanceChart 
                  data={performanceHistory} 
                  initialBalances={statuses.map(s => s.initialBalance || 1900)}
                />
              </div>
            </div>
          </div>
          
          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border h-full">
              <div className="border-b border-border p-4">
                <h2 className="text-xs font-bold text-yellow uppercase tracking-widest">LEADERBOARD</h2>
              </div>
              <div className="p-4 space-y-3">
                {leaderboard.map((ai, index) => (
                  <div key={ai.aiNumber} className="flex items-center gap-3">
                    <div className="text-lg font-mono font-bold text-gray-600 w-6">
                      {index + 1}
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: ai.model.color + '20', border: `1px solid ${ai.model.color}` }}
                    >
                      <Image src={ai.model.logo} alt={ai.model.name} width={16} height={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-mono" style={{ color: ai.model.color }}>
                        {ai.model.name}
                      </div>
                      <div className="text-[10px] font-mono text-muted">
                        ${ai.equity.toFixed(2)}
                      </div>
                    </div>
                    <div className={`text-xs font-mono font-bold ${ai.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {ai.totalPnL >= 0 ? '+' : ''}{(ai.totalPnLPercent || 0).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Header Stats */}
        <div className="mb-6">
          <div className="bg-card border border-border p-4 max-w-xs">
            <div className="text-xs text-muted mb-1">TOTAL EQUITY</div>
            <div className="text-2xl font-mono font-bold text-white">${totalEquity.toFixed(2)}</div>
            <div className="text-xs mt-1">{formatPnL(totalPnL)} ({roiPercent.toFixed(2)}%)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Status Grid */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border">
              <div className="border-b border-border p-4">
                <h2 className="text-xs font-bold text-yellow uppercase tracking-widest">LIVE AI COMPETITION</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {statuses.map((status, idx) => {
                  const model = models[idx];
                  const aiPnL = status.totalPnL || 0;
                  const aiPnLPercent = status.totalPnLPercent || 0;
                  const equity = status.totalBalance || 1900;
                  const initialBalance = status.initialBalance || 1900;
                  const activePositions = 
                    status.bnbPositions.filter(p => p.status === 'active').length +
                    status.asterTrades.filter(t => t.status === 'active').length;
                  
                  return (
                    <div key={status.aiNumber} className="bg-black border border-border p-3 hover:border-yellow transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center relative"
                          style={{ backgroundColor: model.color + '20', border: `2px solid ${model.color}` }}
                        >
                          <Image src={model.logo} alt={model.name} width={20} height={20} className="rounded-full" />
                          {status.isRunning && (
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-mono text-xs font-bold" style={{ color: model.color }}>
                            {model.name}
                          </div>
                          <div className="font-mono text-[10px] text-muted">
                            AI{status.aiNumber} • {activePositions} pos
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5 text-[11px] font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-muted">Value</span>
                          <span className="text-white font-bold">${equity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted text-[10px]">BSC/ASTER</span>
                          <span className="text-muted text-[10px]">
                            ${status.binanceBalance?.toFixed(0)}/${status.asterdexBalance?.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted">P&L</span>
                          <span className={aiPnL >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                            {aiPnL >= 0 ? '+' : ''}{aiPnLPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted">Win</span>
                          <span className="text-white">
                            {status.successCount + status.failureCount > 0 
                              ? Math.round((status.successCount / (status.successCount + status.failureCount)) * 100) 
                              : 0}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Active Positions */}
                      {status.asterTrades
                        .filter(t => t.status === 'active')
                        .slice(0, 1) // Show only the latest active position
                        .map((trade, tradeIdx) => (
                          <div key={tradeIdx} className="mt-2 pt-2 border-t border-gray-800">
                            <div className="text-[9px] space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-yellow font-bold">
                                  {trade.action} {trade.symbol} {trade.leverage}x
                                </span>
                                <span className="text-gray-500">${trade.amount}</span>
                              </div>
                              {trade.stopLoss && trade.takeProfit && (
                                <div className="flex justify-between text-[8px]">
                                  <span className="text-red-500">SL: ${trade.stopLoss.toFixed(2)}</span>
                                  <span className="text-green-500">TP: ${trade.takeProfit.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Trading Log */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border h-[600px] flex flex-col">
              <div className="border-b border-border p-3 flex items-center justify-between">
                <h2 className="text-xs font-bold text-yellow uppercase tracking-widest">ACTIVITY FEED</h2>
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                    autoScroll ? 'bg-yellow/10 text-yellow' : 'bg-gray-900 text-gray-600'
                  }`}
                >
                  {autoScroll ? '● LIVE' : '○ PAUSED'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px]">
                {allLogs.length === 0 ? (
                  <div className="text-gray-600">Waiting for trading activity...</div>
                ) : (
                  <div className="space-y-1">
                    {allLogs.map((entry, idx) => {
                      const model = models[entry.aiNumber - 1];
                      return (
                        <div key={idx} className="py-2 border-b border-gray-900/50 hover:bg-gray-900/20">
                          <div className="flex items-start gap-2">
                            <div 
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: model.color + '15', border: `1px solid ${model.color}40` }}
                            >
                              <span className="text-[8px] font-bold" style={{ color: model.color }}>
                                {entry.aiNumber}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className={`font-semibold ${
                                    entry.type === 'ERROR' ? 'text-red-500' :
                                    entry.type === 'DECISION' ? 'text-gray-500' :
                                    entry.type.includes('ASTER') ? 'text-yellow' :
                                    'text-green-500'
                                  }`}>
                                    {entry.type === 'ASTER_LONG' ? 'LONG' :
                                     entry.type === 'ASTER_SHORT' ? 'SHORT' :
                                     entry.type === 'BNB_BUY' ? 'BUY' :
                                     entry.type}
                                  </span>
                                  {entry.symbol && <span className="text-white font-mono">{entry.symbol}</span>}
                                  {entry.leverage && <span className="text-gray-600">{entry.leverage}x</span>}
                                  {entry.amount && <span className="text-gray-600">${entry.amount}</span>}
                                  {(entry.type === 'ASTER_LONG' || entry.type === 'ASTER_SHORT') && entry.stopLoss && (
                                    <span className="text-red-600 text-[9px]">SL:${entry.stopLoss.toFixed(2)}</span>
                                  )}
                                  {(entry.type === 'ASTER_LONG' || entry.type === 'ASTER_SHORT') && entry.takeProfit && (
                                    <span className="text-green-600 text-[9px]">TP:${entry.takeProfit.toFixed(2)}</span>
                                  )}
                                </div>
                                <span className="text-[9px] text-gray-700 flex-shrink-0">
                                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {entry.reasoning && (
                                <div className="text-[9px] text-gray-500 mt-0.5 line-clamp-2">
                                  {entry.reasoning}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}