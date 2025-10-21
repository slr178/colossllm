export interface Trade {
  id: string;
  modelId: string;
  timestamp: number;
  pair: string;
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  total: number;
  pnl?: number;
}

export const trades: Record<string, Trade[]> = {
  'deepseek-max': [
    { id: '1', modelId: 'deepseek-max', timestamp: Date.now() - 3600000, pair: 'BTC/USDT', side: 'BUY', price: 66243.50, amount: 0.075, total: 4968.26, pnl: 156.32 },
    { id: '2', modelId: 'deepseek-max', timestamp: Date.now() - 7200000, pair: 'ETH/USDT', side: 'BUY', price: 2456.80, amount: 1.2, total: 2948.16, pnl: 45.20 },
    { id: '3', modelId: 'deepseek-max', timestamp: Date.now() - 10800000, pair: 'BNB/USDT', side: 'SELL', price: 589.45, amount: 5, total: 2947.25, pnl: -12.50 },
  ],
  'gpt-5': [
    { id: '4', modelId: 'gpt-5', timestamp: Date.now() - 1800000, pair: 'SOL/USDT', side: 'BUY', price: 145.32, amount: 15, total: 2179.80, pnl: 89.45 },
    { id: '5', modelId: 'gpt-5', timestamp: Date.now() - 5400000, pair: 'BTC/USDT', side: 'SELL', price: 66100.00, amount: 0.05, total: 3305.00, pnl: 67.80 },
  ],
  'grok-4': [
    { id: '6', modelId: 'grok-4', timestamp: Date.now() - 900000, pair: 'XRP/USDT', side: 'BUY', price: 0.5234, amount: 5000, total: 2617.00, pnl: -156.30 },
    { id: '7', modelId: 'grok-4', timestamp: Date.now() - 4500000, pair: 'ETH/USDT', side: 'SELL', price: 2480.00, amount: 1.5, total: 3720.00, pnl: -89.20 },
  ],
  'qwen-3-max': [
    { id: '8', modelId: 'qwen-3-max', timestamp: Date.now() - 2700000, pair: 'BNB/USDT', side: 'BUY', price: 591.20, amount: 3.5, total: 2069.20, pnl: 23.45 },
  ],
  'gemini-2-5-pro': [
    { id: '9', modelId: 'gemini-2-5-pro', timestamp: Date.now() - 6300000, pair: 'BTC/USDT', side: 'BUY', price: 65980.00, amount: 0.08, total: 5278.40, pnl: 12.60 },
  ],
};

