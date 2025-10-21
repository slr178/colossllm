export interface Position {
  id: string;
  modelId: string;
  pair: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  amount: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

export const positions: Record<string, Position[]> = {
  'deepseek-max': [
    { id: '1', modelId: 'deepseek-max', pair: 'BTC/USDT', side: 'LONG', entryPrice: 66243.50, currentPrice: 67125.30, amount: 0.075, unrealizedPnl: 66.14, unrealizedPnlPercent: 1.33 },
    { id: '2', modelId: 'deepseek-max', pair: 'ETH/USDT', side: 'LONG', entryPrice: 2456.80, currentPrice: 2489.20, amount: 1.2, unrealizedPnl: 38.88, unrealizedPnlPercent: 1.32 },
  ],
  'gpt-5': [
    { id: '3', modelId: 'gpt-5', pair: 'SOL/USDT', side: 'LONG', entryPrice: 145.32, currentPrice: 151.24, amount: 15, unrealizedPnl: 88.80, unrealizedPnlPercent: 4.07 },
  ],
  'grok-4': [
    { id: '4', modelId: 'grok-4', pair: 'XRP/USDT', side: 'LONG', entryPrice: 0.5234, currentPrice: 0.4987, amount: 5000, unrealizedPnl: -123.50, unrealizedPnlPercent: -4.72 },
  ],
  'qwen-3-max': [
    { id: '5', modelId: 'qwen-3-max', pair: 'BNB/USDT', side: 'LONG', entryPrice: 591.20, currentPrice: 594.85, amount: 3.5, unrealizedPnl: 12.78, unrealizedPnlPercent: 0.62 },
  ],
  'gemini-2-5-pro': [
    { id: '6', modelId: 'gemini-2-5-pro', pair: 'BTC/USDT', side: 'LONG', entryPrice: 65980.00, currentPrice: 67125.30, amount: 0.08, unrealizedPnl: 91.62, unrealizedPnlPercent: 1.74 },
  ],
};

