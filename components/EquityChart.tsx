'use client';

import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { models } from '@/data/models';
import type { SeriesData } from '@/data/series';

interface EquityChartProps {
  data: SeriesData[];
  showLegend?: boolean;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
};

const formatCurrency = (value: number) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-black border-2 border-yellow p-3 shadow-2xl">
      <p className="text-xs text-yellow/60 mb-2 font-mono uppercase tracking-wider">{formatTime(payload[0].payload.timestamp)}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => {
          const model = models.find(m => m.id === entry.dataKey);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              {model && (
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center border-2 bg-black flex-shrink-0"
                  style={{ borderColor: entry.color }}
                >
                  <Image
                    src={model.logo}
                    alt={model.name}
                    width={14}
                    height={14}
                    className="object-contain"
                  />
                </div>
              )}
              <span className="text-white text-xs font-medium">{entry.name}:</span>
              <span className={`font-mono font-bold text-sm ml-auto ${entry.value >= 0 ? 'text-yellow' : 'text-red-500'}`}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function EquityChart({ data, showLegend = true }: EquityChartProps) {
  if (data.length === 0) return null;

  const startingCapital = 2000; // Starting capital $2,000
  const latestData = data[data.length - 1];

  // Transform data to show P&L instead of absolute equity
  const pnlData = data.map((point) => {
    const transformed: any = { timestamp: point.timestamp };
    models.forEach((model) => {
      const equity = point[model.id as keyof SeriesData] as number;
      transformed[model.id] = equity - startingCapital;
    });
    return transformed;
  });

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pnlData} margin={{ top: 20, right: 140, bottom: 20, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#999999"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke="#999999"
            fontSize={11}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              wrapperStyle={{ paddingBottom: '20px' }}
            />
          )}
          {models.map((model) => (
            <Line
              key={model.id}
              type="monotone"
              dataKey={model.id}
              stroke={model.color}
              strokeWidth={2.5}
              dot={false}
              name={model.name}
              animationDuration={300}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Value labels on the right */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 space-y-2">
        {models.map((model) => {
          const equity = latestData[model.id as keyof SeriesData] as number;
          const pnl = equity - startingCapital;
          const change = (pnl / startingCapital) * 100;

          return (
            <div
              key={model.id}
              className="relative bg-black/95 backdrop-blur-sm border-2 px-3 py-2 min-w-[120px] shadow-lg"
              style={{ borderColor: model.color }}
            >
              {/* Logo Badge */}
              <div 
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-black shadow-lg"
                style={{ borderColor: model.color }}
              >
                <Image
                  src={model.logo}
                  alt={model.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              
              <div className="pl-2">
                <div className={`text-sm font-mono font-black mb-0.5 ${pnl >= 0 ? 'text-yellow' : 'text-red-500'}`}>
                  {formatCurrency(pnl)}
                </div>
                <div
                  className={`text-xs font-mono ${change >= 0 ? 'text-yellow/60' : 'text-red-500/60'}`}
                >
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

