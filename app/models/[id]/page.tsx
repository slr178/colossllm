'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { models } from '@/data/models';
import { positions } from '@/data/positions';
import { trades } from '@/data/trades';
import { Table, TableRow, TableCell } from '@/components/Table';
import { useLiveData } from '@/hooks/useLiveData';
import type { SeriesData } from '@/data/series';

interface ModelPageProps {
  params: Promise<{ id: string }>;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
};

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CustomTooltip = ({ active, payload, color }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-muted mb-1">{formatTime(payload[0].payload.timestamp)}</p>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-mono font-semibold">{formatCurrency(payload[0].value)}</span>
      </div>
    </div>
  );
};

export default function ModelPage({ params }: ModelPageProps) {
  const { id } = use(params);
  const liveData = useLiveData();
  const model = models.find((m) => m.id === id);

  if (!model) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Model not found</h1>
          <Link href="/" className="text-yellow hover:underline">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const modelPositions = positions[id] || [];
  const modelTrades = trades[id] || [];

  const startingCapital = 2000; // Starting capital $2,000

  // Calculate stats
  let currentEquity = startingCapital;
  let currentPnL = 0;
  let maxEquity = startingCapital;
  let maxDrawdown = 0;
  let returnPercent = 0;

  if (liveData.length > 0) {
    currentEquity = liveData[liveData.length - 1][id as keyof SeriesData] as number;
    currentPnL = currentEquity - startingCapital;
    returnPercent = (currentPnL / startingCapital) * 100;

    // Calculate max drawdown
    liveData.forEach((point) => {
      const value = point[id as keyof SeriesData] as number;
      if (value > maxEquity) maxEquity = value;
      const drawdown = ((value - maxEquity) / maxEquity) * 100;
      if (drawdown < maxDrawdown) maxDrawdown = drawdown;
    });
  }

  // Prepare P&L data (relative to starting capital)
  const pnlData = liveData.map((point) => ({
    timestamp: point.timestamp,
    pnl: (point[id as keyof SeriesData] as number) - startingCapital,
  }));

  // Prepare drawdown data
  const drawdownData = liveData.map((point) => {
    const value = point[id as keyof SeriesData] as number;
    if (value > maxEquity) maxEquity = value;
    const drawdown = ((value - maxEquity) / maxEquity) * 100;
    return {
      timestamp: point.timestamp,
      drawdown: Math.abs(drawdown),
    };
  });

  return (
    <main className="flex-1 bg-bg">
      <div className="container mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link href="/" className="text-xs text-muted hover:text-yellow transition-colors">
            ← Back
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative w-5 h-5 flex-shrink-0">
              <Image
                src={model.logo}
                alt={model.name}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold">{model.name}</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-white/5 p-4">
            <div className="text-xs text-muted mb-1 uppercase tracking-wider">P&L</div>
            <div className={`text-xl font-mono font-bold ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentPnL >= 0 ? '+' : ''}{formatCurrency(currentPnL)}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-white/5 p-4">
            <div className="text-xs text-muted mb-1 uppercase tracking-wider">Return</div>
            <div
              className={`text-xl font-mono font-bold ${returnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {returnPercent >= 0 ? '+' : ''}
              {returnPercent.toFixed(2)}%
            </div>
          </div>
          <div className="bg-card rounded-lg border border-white/5 p-4">
            <div className="text-xs text-muted mb-1 uppercase tracking-wider">Max DD</div>
            <div className="text-xl font-mono font-bold text-red-400">{maxDrawdown.toFixed(2)}%</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Equity Chart */}
          <div className="bg-card rounded-lg border border-white/5 p-4">
            <h2 className="text-xs font-semibold mb-3 text-muted uppercase tracking-wider">P&L</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    stroke="#A7B1C2"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => {
                      const sign = v >= 0 ? '+' : '';
                      return `${sign}$${v.toLocaleString()}`;
                    }}
                    stroke="#A7B1C2"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload }: any) => {
                      if (!active || !payload || !payload.length) return null;
                      const pnl = payload[0].value;
                      return (
                        <div className="bg-card border border-white/10 rounded-lg p-3 shadow-xl">
                          <p className="text-xs text-muted mb-1">{formatTime(payload[0].payload.timestamp)}</p>
                          <div className={`text-sm font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke={model.color}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Drawdown Chart */}
          <div className="bg-card rounded-lg border border-white/5 p-4">
            <h2 className="text-xs font-semibold mb-3 text-muted uppercase tracking-wider">Drawdown</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    stroke="#A7B1C2"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#A7B1C2"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="bg-card border border-white/10 rounded-lg p-3 shadow-xl">
                          <p className="text-xs text-muted mb-1">
                            {formatTime(payload[0].payload.timestamp)}
                          </p>
                          <div className="text-sm font-semibold text-red-400">
                            -{payload[0].value.toFixed(2)}%
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#EF4444"
                    fill="#EF444420"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold mb-3 text-muted uppercase tracking-wider">Positions</h2>
          {modelPositions.length > 0 ? (
            <Table headers={['Pair', 'Side', 'Entry Price', 'Current Price', 'Amount', 'Unrealized PnL', 'PnL %']}>
              {modelPositions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-semibold">{position.pair}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        position.side === 'LONG'
                          ? 'bg-green-400/20 text-green-400'
                          : 'bg-red-400/20 text-red-400'
                      }`}
                    >
                      {position.side}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{formatCurrency(position.entryPrice)}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(position.currentPrice)}</TableCell>
                  <TableCell className="font-mono">{position.amount}</TableCell>
                  <TableCell
                    className={`font-mono font-semibold ${
                      position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {position.unrealizedPnl >= 0 ? '+' : ''}
                    {formatCurrency(position.unrealizedPnl)}
                  </TableCell>
                  <TableCell
                    className={`font-mono font-semibold ${
                      position.unrealizedPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {position.unrealizedPnlPercent >= 0 ? '+' : ''}
                    {position.unrealizedPnlPercent.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          ) : (
            <div className="bg-card rounded-lg border border-white/5 p-8 text-center text-muted text-sm">
              No positions
            </div>
          )}
        </div>

        {/* Trade Log */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted uppercase tracking-wider">Trades</h2>
          {modelTrades.length > 0 ? (
            <Table headers={['Time', 'Pair', 'Side', 'Price', 'Amount', 'Total', 'PnL']}>
              {modelTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="text-muted">
                    {new Date(trade.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold">{trade.pair}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.side === 'BUY'
                          ? 'bg-green-400/20 text-green-400'
                          : 'bg-red-400/20 text-red-400'
                      }`}
                    >
                      {trade.side}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{formatCurrency(trade.price)}</TableCell>
                  <TableCell className="font-mono">{trade.amount}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(trade.total)}</TableCell>
                  <TableCell
                    className={`font-mono font-semibold ${
                      (trade.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {trade.pnl
                      ? `${trade.pnl >= 0 ? '+' : ''}${formatCurrency(trade.pnl)}`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          ) : (
            <div className="bg-card rounded-lg border border-white/5 p-8 text-center text-muted text-sm">
              No trades
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

