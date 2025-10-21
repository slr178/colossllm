'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { SeriesData } from '@/data/series';

interface ModelCardProps {
  modelId: string;
  modelName: string;
  color: string;
  logo: string;
  data: SeriesData[];
}

export default function ModelCard({ modelId, modelName, color, logo, data }: ModelCardProps) {
  if (data.length === 0) return null;

  const startValue = data[0][modelId as keyof SeriesData] as number;
  const currentValue = data[data.length - 1][modelId as keyof SeriesData] as number;
  const pnl = currentValue - startValue;
  const pnlPercent = (pnl / startValue) * 100;

  // Prepare sparkline data
  const sparklineData = data.map((d) => ({
    value: d[modelId as keyof SeriesData] as number,
  }));

  return (
    <Link
      href={`/models/${modelId}`}
      className="bg-card border border-border hover:border-yellow transition-all p-3 group relative overflow-hidden"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-4 h-4 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
            <Image
              src={logo}
              alt={modelName}
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <h3 className="font-bold text-xs text-white/70 group-hover:text-yellow transition-colors uppercase tracking-wide">
            {modelName}
          </h3>
        </div>

        {/* Sparkline */}
        <div className="h-10 mb-2 opacity-50 group-hover:opacity-70 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                animationDuration={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-baseline justify-between">
          <div className={`text-xl font-mono font-black ${pnl >= 0 ? 'text-yellow' : 'text-red-500'}`}>
            {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
          </div>
          <div className={`text-xs font-mono ${pnl >= 0 ? 'text-yellow/60' : 'text-red-500/60'}`}>
            {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </Link>
  );
}

