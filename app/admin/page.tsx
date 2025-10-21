'use client';

import { useState } from 'react';
import Link from 'next/link';
import { models } from '@/data/models';

export default function AdminPage() {
  const [adjustments, setAdjustments] = useState<Record<string, number>>({
    'deepseek-max': 0,
    'gpt-5': 0,
    'grok-4': 0,
    'qwen-3-max': 0,
    'gemini-2-5-pro': 0,
  });

  const [volatility, setVolatility] = useState<Record<string, number>>({
    'deepseek-max': 1.2,
    'gpt-5': 0.9,
    'grok-4': 2.5,
    'qwen-3-max': 1.1,
    'gemini-2-5-pro': 0.6,
  });

  const handlePnLAdjustment = (modelId: string, value: number) => {
    setAdjustments(prev => ({ ...prev, [modelId]: value }));
    // In a real app, this would update the backend/database
    console.log(`Adjusting ${modelId} P&L by ${value}%`);
  };

  const handleVolatilityChange = (modelId: string, value: number) => {
    setVolatility(prev => ({ ...prev, [modelId]: value }));
    console.log(`Setting ${modelId} volatility to ${value}`);
  };

  const resetAll = () => {
    setAdjustments({
      'deepseek-max': 0,
      'gpt-5': 0,
      'grok-4': 0,
      'qwen-3-max': 0,
      'gemini-2-5-pro': 0,
    });
  };

  return (
    <main className="flex-1 bg-black min-h-screen">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-muted hover:text-yellow transition-colors uppercase tracking-wider">
            ← Back to Dashboard
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-yellow uppercase tracking-tight">Admin Console</h1>
              <p className="text-sm text-muted mt-1">Control model performance parameters</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-yellow/30 rounded">
              <div className="w-2 h-2 bg-yellow rounded-full animate-pulse"></div>
              <span className="text-xs font-mono text-yellow">ADMIN MODE</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={resetAll}
            className="bg-card border border-border hover:border-yellow p-4 transition-all group"
          >
            <div className="text-xs font-bold text-yellow uppercase tracking-widest mb-1">Reset All</div>
            <div className="text-xs text-muted">Clear adjustments</div>
          </button>
          <button className="bg-card border border-border hover:border-yellow p-4 transition-all group">
            <div className="text-xs font-bold text-yellow uppercase tracking-widest mb-1">Pause All</div>
            <div className="text-xs text-muted">Stop updates</div>
          </button>
          <button className="bg-card border border-border hover:border-yellow p-4 transition-all group">
            <div className="text-xs font-bold text-yellow uppercase tracking-widest mb-1">Export Data</div>
            <div className="text-xs text-muted">Download CSV</div>
          </button>
          <button className="bg-card border border-border hover:border-yellow p-4 transition-all group">
            <div className="text-xs font-bold text-yellow uppercase tracking-widest mb-1">Randomize</div>
            <div className="text-xs text-muted">Add variance</div>
          </button>
        </div>

        {/* Model Controls */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-yellow uppercase tracking-widest">Model Controls</h2>
          
          {models.map((model) => (
            <div key={model.id} className="bg-card border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: model.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">{model.name}</h3>
                    <p className="text-xs text-muted font-mono">{model.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted mb-1">Current Adjustment</div>
                  <div className={`text-lg font-mono font-black ${adjustments[model.id] >= 0 ? 'text-yellow' : 'text-red-500'}`}>
                    {adjustments[model.id] >= 0 ? '+' : ''}{adjustments[model.id].toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* P&L Adjustment */}
                <div>
                  <label className="block text-xs font-bold text-yellow uppercase tracking-widest mb-3">
                    P&L Adjustment (%)
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="0.1"
                    value={adjustments[model.id]}
                    onChange={(e) => handlePnLAdjustment(model.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-yellow"
                  />
                  <div className="flex justify-between text-xs text-muted mt-2 font-mono">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handlePnLAdjustment(model.id, adjustments[model.id] - 5)}
                      className="flex-1 px-3 py-2 bg-black border border-border hover:border-yellow text-xs font-mono text-white transition-colors"
                    >
                      -5%
                    </button>
                    <button
                      onClick={() => handlePnLAdjustment(model.id, 0)}
                      className="flex-1 px-3 py-2 bg-black border border-border hover:border-yellow text-xs font-mono text-yellow transition-colors"
                    >
                      RESET
                    </button>
                    <button
                      onClick={() => handlePnLAdjustment(model.id, adjustments[model.id] + 5)}
                      className="flex-1 px-3 py-2 bg-black border border-border hover:border-yellow text-xs font-mono text-white transition-colors"
                    >
                      +5%
                    </button>
                  </div>
                </div>

                {/* Volatility Control */}
                <div>
                  <label className="block text-xs font-bold text-yellow uppercase tracking-widest mb-3">
                    Volatility Multiplier
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={volatility[model.id]}
                    onChange={(e) => handleVolatilityChange(model.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-yellow"
                  />
                  <div className="flex justify-between text-xs text-muted mt-2 font-mono">
                    <span>0.1x</span>
                    <span className="text-yellow">{volatility[model.id].toFixed(1)}x</span>
                    <span>5.0x</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleVolatilityChange(model.id, 0.5)}
                      className="px-3 py-2 bg-black border border-border hover:border-yellow text-xs font-mono text-white transition-colors"
                    >
                      LOW
                    </button>
                    <button
                      onClick={() => handleVolatilityChange(model.id, 1.0)}
                      className="px-3 py-2 bg-black border border-border hover:border-yellow text-xs font-mono text-yellow transition-colors"
                    >
                      MED
                    </button>
                    <button
                      onClick={() => handleVolatilityChange(model.id, 3.0)}
                      className="px-3 py-2 bg-black border border-border hover:border-yellow text-xs font-mono text-white transition-colors"
                    >
                      HIGH
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Status */}
        <div className="mt-6 bg-card border border-border p-5">
          <h2 className="text-xs font-bold text-yellow uppercase tracking-widest mb-4">System Status</h2>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-muted mb-1">Data Points</div>
              <div className="font-mono text-white">576</div>
            </div>
            <div>
              <div className="text-muted mb-1">Update Rate</div>
              <div className="font-mono text-yellow">1s</div>
            </div>
            <div>
              <div className="text-muted mb-1">Duration</div>
              <div className="font-mono text-white">48h</div>
            </div>
            <div>
              <div className="text-muted mb-1">Status</div>
              <div className="font-mono text-yellow flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-yellow rounded-full animate-pulse"></span>
                LIVE
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

