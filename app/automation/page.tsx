'use client';

import { useEffect, useState, useRef } from 'react';
import { models } from '@/data/models';
import Image from 'next/image';

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

interface AIAutomationStatus {
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
  error?: string;
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

export default function AutomationPage() {
  const [statuses, setStatuses] = useState<AIAutomationStatus[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedStats | null>(null);
  const [journals, setJournals] = useState<Record<number, JournalEntry[]>>({});
  const [selectedAI, setSelectedAI] = useState(1);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(120); // Countdown in seconds

  // Auto-scroll journal when new entries come in
  const prevJournalLength = useRef(0);
  const journalEndRef = useRef<HTMLDivElement>(null);
  const [autoScrollJournal, setAutoScrollJournal] = useState(true);

  const fetchData = async () => {
    try {
      const statusRes = await fetch('/api/automation/status');
      const statusData = await statusRes.json();
      
      if (statusData.success) {
        setStatuses(statusData.statuses || []);
        setAggregated(statusData.aggregated || null);
        
        // Journal data comes from status endpoint
        if (statusData.journals) {
          setJournals(statusData.journals);
          const entryCounts = Object.keys(statusData.journals).map(k => `AI${k}: ${statusData.journals[k].length}`).join(', ');
          console.log('[FRONTEND] Journal entries loaded:', entryCounts);
          
          // Log details of journal entries
          Object.keys(statusData.journals).forEach(aiNum => {
            const entries = statusData.journals[aiNum];
            if (entries.length > 0) {
              console.log(`[FRONTEND] AI${aiNum} latest entry:`, entries[entries.length - 1]);
            }
          });
        } else {
          console.warn('[FRONTEND] No journals in response');
        }
      }
      
      // Reset countdown after fetching
      setCountdown(120);
    } catch (error) {
      console.error('[FRONTEND] Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // Fetch every 2 minutes
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 120);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentLength = (journals[selectedAI] || []).length;
    if (currentLength > prevJournalLength.current && autoScrollJournal) {
      journalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevJournalLength.current = currentLength;
  }, [journals, selectedAI, autoScrollJournal]);

  // Sort AIs by P&L for leaderboard
  const leaderboard = [...statuses].sort((a, b) => {
    const aPnL = a.totalPnL || 0;
    const bPnL = b.totalPnL || 0;
    return bPnL - aPnL;
  });

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <main className="flex-1 bg-black p-6">
        <div className="font-mono text-white text-xs">INIT</div>
      </main>
    );
  }

  const currentJournal = journals[selectedAI] || [];
  const currentStatus = statuses[selectedAI - 1];

  return (
    <main className="flex-1 bg-black p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-4 pb-2 border-b border-white flex justify-between items-center">
          <h1 className="font-mono text-white text-lg font-bold">AI_MONITOR</h1>
          <div className="font-mono text-gray-600 text-xs">
            NEXT UPDATE: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </div>
        </div>

        {/* Stats */}
        {aggregated && (
          <div className="grid grid-cols-6 gap-2 mb-4">
            <div className="border border-white p-2">
              <div className="font-mono text-gray-600 text-[9px]">RUN</div>
              <div className="font-mono text-white text-sm">{aggregated.runningAIs}/{aggregated.totalAIs}</div>
            </div>
            <div className="border border-white p-2">
              <div className="font-mono text-gray-600 text-[9px]">BNB</div>
              <div className="font-mono text-white text-sm">{aggregated.activeBNBPositions}</div>
            </div>
            <div className="border border-white p-2">
              <div className="font-mono text-gray-600 text-[9px]">AST</div>
              <div className="font-mono text-white text-sm">{aggregated.activeAsterTrades}</div>
            </div>
            <div className="border border-white p-2">
              <div className="font-mono text-gray-600 text-[9px]">SUC</div>
              <div className="font-mono text-white text-sm">{aggregated.totalSuccesses}</div>
            </div>
            <div className="border border-white p-2">
              <div className="font-mono text-gray-600 text-[9px]">FAIL</div>
              <div className="font-mono text-white text-sm">{aggregated.totalFailures}</div>
            </div>
            <div className="border border-white p-2">
              <div className="font-mono text-gray-600 text-[9px]">OPS</div>
              <div className="font-mono text-white text-sm">{aggregated.totalSuccesses + aggregated.totalFailures}</div>
            </div>
          </div>
        )}

        {/* Grid: Leaderboard and Recent Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Leaderboard */}
          <div className="border border-white p-3">
            <div className="font-mono text-white text-[11px] font-bold mb-2">LEADERBOARD</div>
            <div className="space-y-1">
              {leaderboard.map((status, idx) => {
                const model = models[status.aiNumber - 1];
                const pnl = status.totalPnL || 0;
                const pnlPercent = status.totalPnLPercent || 0;
                
                return (
                  <div key={status.aiNumber} className="flex items-center justify-between font-mono text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-6">#{idx + 1}</span>
                      <div className="w-4 h-4">
                        <Image src={model.logo} alt={model.name} width={16} height={16} />
                      </div>
                      <span className="text-white">{status.aiName}</span>
                      {status.isRunning && <span className="text-[8px] text-gray-500">LIVE</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white">${(status.totalBalance || 1900).toFixed(2)}</span>
                      <span className={pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="border border-white p-3">
            <div className="font-mono text-white text-[11px] font-bold mb-2">RECENT_TRADES</div>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {Object.entries(journals)
                .flatMap(([aiNum, entries]) => 
                  entries
                    .filter(e => e.type === 'ASTER_LONG' || e.type === 'ASTER_SHORT' || e.type === 'ASTER_CLOSE')
                    .map(e => ({ ...e, aiNumber: parseInt(aiNum) }))
                )
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map((entry, idx) => {
                  const model = models[entry.aiNumber - 1];
                  return (
                    <div key={idx} className="flex items-center justify-between font-mono text-[9px]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3">
                          <Image src={model.logo} alt="" width={12} height={12} />
                        </div>
                        <span className={
                          entry.type === 'ASTER_LONG' ? 'text-green-500' :
                          entry.type === 'ASTER_SHORT' ? 'text-red-500' :
                          'text-gray-500'
                        }>
                          {entry.type.replace('ASTER_', '')}
                        </span>
                        <span className="text-white">{entry.symbol}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.leverage && <span className="text-gray-600">{entry.leverage}x</span>}
                        <span className="text-gray-700">{formatTime(entry.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(journals).length === 0 && (
                <div className="font-mono text-gray-700 text-[9px]">NO_TRADES_YET</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Tabs */}
        <div className="border-b border-white mb-4">
          <div className="flex">
            {statuses.map((status, idx) => {
              const model = models[idx];
              const activePositions = (status.asterTrades?.filter((t: any) => t.status === 'active') || []).length;
              
              return (
                <button
                  key={status.aiNumber}
                  onClick={() => setSelectedAI(status.aiNumber)}
                  className={`font-mono text-[10px] px-3 py-2 border-r border-white relative ${
                    selectedAI === status.aiNumber ? 'bg-white text-black' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3">
                      <Image src={model.logo} alt={model.name} width={12} height={12} />
                    </div>
                    <span>AI{status.aiNumber}</span>
                    {status.isRunning && <span className="text-[8px]">RUN</span>}
                  </div>
                  {activePositions > 0 && (
                    <div className="absolute top-0 right-0 w-1 h-1 bg-white"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected AI Panel */}
        {currentStatus && (
          <div className="grid grid-cols-[300px_1fr] gap-4">
            {/* Left: AI Stats */}
            <div>
              <div className="border border-white p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 border border-white">
                    <Image src={models[selectedAI - 1].logo} alt="" width={24} height={24} />
                  </div>
                  <div className="font-mono text-white text-sm font-bold">
                    {currentStatus.aiName.toUpperCase().replace(/ /g, '_')}
                  </div>
                  {currentStatus.isRunning && (
                    <span className="font-mono text-[8px] text-gray-500">LIVE</span>
                  )}
                </div>

                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-600">BALANCE</span>
                    <span className="text-white">${(currentStatus.totalBalance || 1900).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P&L</span>
                    <span className={(currentStatus.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {(currentStatus.totalPnL || 0) >= 0 ? '+' : ''}${Math.abs(currentStatus.totalPnL || 0).toFixed(2)} ({(currentStatus.totalPnLPercent || 0).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="border-t border-gray-800 pt-2 mt-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">BNB_SPENT</span>
                    <span className="text-white">{currentStatus.totalBNBSpent.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SUCCESS</span>
                    <span className="text-white">{currentStatus.successCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">FAILED</span>
                    <span className="text-white">{currentStatus.failureCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">POS_BNB</span>
                    <span className="text-white">{currentStatus.bnbPositions?.filter((p: any) => p.status === 'active').length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">POS_AST</span>
                    <span className="text-white">{currentStatus.asterTrades?.filter((t: any) => t.status === 'active').length || 0}/2</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Journal */}
            <div className="border border-white">
              <div className="border-b border-white p-2 flex justify-between items-center">
                <div className="font-mono text-white text-[10px] font-bold">TRADE_JOURNAL</div>
                <button
                  onClick={() => setAutoScrollJournal(!autoScrollJournal)}
                  className={`font-mono text-[9px] px-2 py-0.5 ${
                    autoScrollJournal ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {autoScrollJournal ? '● LIVE' : '○ PAUSED'}
                </button>
              </div>
              
              <div className="p-3 h-[600px] overflow-y-auto bg-black" style={{ fontFamily: 'Consolas, monospace' }}>
                {currentJournal.length === 0 ? (
                  <div className="font-mono text-gray-700 text-[10px]">
                    NO_ENTRIES_YET
                    <div className="mt-2 text-gray-800">Waiting for AI to make trades...</div>
                    <div className="mt-1 text-gray-800">Check terminal for activity</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentJournal.map((entry, idx) => (
                      <div key={idx} className="border-b border-gray-900 pb-3">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-[10px] font-bold ${
                              entry.type === 'BNB_BUY' ? 'text-white' :
                              entry.type === 'ASTER_LONG' ? 'text-white' :
                              entry.type === 'ASTER_SHORT' ? 'text-white' :
                              entry.type === 'ASTER_CLOSE' ? 'text-gray-500' :
                              entry.type === 'ERROR' ? 'text-red-500' :
                              'text-gray-600'
                            }`}>
                              {entry.type}
                            </span>
                            {entry.symbol && (
                              <span className="font-mono text-[10px] text-white">{entry.symbol}</span>
                            )}
                          </div>
                          <span className="font-mono text-[9px] text-gray-700">{formatTime(entry.timestamp)}</span>
                        </div>

                        {/* Decision */}
                        {entry.decision && (
                          <div className="font-mono text-[10px] text-gray-400 mb-1">{entry.decision}</div>
                        )}

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-mono">
                          {entry.amount !== undefined && (
                            <div>
                              <span className="text-gray-700">AMT </span>
                              <span className="text-white">${entry.amount}</span>
                            </div>
                          )}
                          {entry.leverage !== undefined && (
                            <div>
                              <span className="text-gray-700">LEV </span>
                              <span className="text-white">{entry.leverage}X</span>
                            </div>
                          )}
                          {entry.confidence !== undefined && (
                            <div>
                              <span className="text-gray-700">CONF </span>
                              <span className="text-white">{entry.confidence}%</span>
                            </div>
                          )}
                          {entry.stopLoss !== undefined && (
                            <div>
                              <span className="text-gray-700">SL </span>
                              <span className="text-white">${entry.stopLoss.toFixed(2)}</span>
                            </div>
                          )}
                          {entry.takeProfit !== undefined && (
                            <div>
                              <span className="text-gray-700">TP </span>
                              <span className="text-white">${entry.takeProfit.toFixed(2)}</span>
                            </div>
                          )}
                          {entry.result && (
                            <div>
                              <span className="text-gray-700">RES </span>
                              <span className={
                                entry.result === 'SUCCESS' || entry.result === 'EXECUTED' ? 'text-white' :
                                entry.result === 'ERROR' || entry.result === 'FAILED' ? 'text-red-500' :
                                'text-gray-500'
                              }>{entry.result}</span>
                            </div>
                          )}
                        </div>

                        {/* Reasoning */}
                        {entry.reasoning && (
                          <div className="font-mono text-[9px] text-gray-600 mt-1 leading-relaxed">
                            {entry.reasoning}
                          </div>
                        )}

                        {/* TX/Order */}
                        {(entry.txHash || entry.orderId) && (
                          <div className="font-mono text-[9px] text-gray-700 mt-1">
                            {entry.txHash && `TX ${entry.txHash.slice(0, 10)}...`}
                            {entry.orderId && `ORDER ${entry.orderId}`}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={journalEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
