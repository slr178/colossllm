import Link from 'next/link';
import Image from 'next/image';
import { models } from '@/data/models';

export default function Sidebar() {
  return (
    <div className="space-y-3">
      {/* Models */}
      <div className="bg-card border border-border p-4">
        <h2 className="text-xs font-bold mb-3 text-yellow uppercase tracking-widest">Competitors</h2>
        <div className="space-y-1">
          {models.map((model) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="flex items-center gap-2 p-2 hover:bg-yellow/5 transition-colors group border-l-2 border-transparent hover:border-yellow"
            >
              <div className="relative w-4 h-4 flex-shrink-0 opacity-70 group-hover:opacity-100">
                <Image
                  src={model.logo}
                  alt={model.name}
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <div className="text-xs font-medium text-white/70 group-hover:text-yellow transition-colors">
                {model.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-card border border-border p-4">
        <h2 className="text-xs font-bold mb-3 text-yellow uppercase tracking-widest">Parameters</h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted">Capital</span>
            <span className="font-mono text-white">2,000</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Market</span>
            <span className="font-mono text-white">Crypto</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Objective</span>
            <span className="font-mono text-white">Max ROI</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Status</span>
            <span className="font-mono text-yellow flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-yellow rounded-full animate-pulse"></span>
              LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

