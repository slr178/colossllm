// Generate 48 hours of data points (every 5 minutes = 576 points)
const INTERVAL_MS = 5 * 60 * 1000;
const TOTAL_POINTS = 576;
const START_TIME = Date.now() - 48 * 60 * 60 * 1000;

// Seeded random number generator for reproducibility
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

function generateModelSeries(seed: number, drift: number, volatility: number): number[] {
  const rng = new SeededRandom(seed);
  const series: number[] = [2000]; // Starting capital $2,000
  
  for (let i = 1; i < TOTAL_POINTS; i++) {
    const change = (rng.next() - 0.5) * volatility + drift;
    const newValue = series[i - 1] * (1 + change / 100);
    series.push(newValue);
  }
  
  return series;
}

export interface SeriesData {
  timestamp: number;
  'deepseek-max': number;
  'gpt-5': number;
  'grok-4': number;
  'qwen-3-max': number;
  'gemini-2-5-pro': number;
}

// Generate series for each model with different characteristics
const deepseekSeries = generateModelSeries(12345, 0.08, 1.2);  // Strong upward trend
const gpt5Series = generateModelSeries(23456, 0.06, 0.9);      // Moderate upward trend
const grok4Series = generateModelSeries(34567, -0.15, 2.5);    // Volatile downward
const qwen3Series = generateModelSeries(45678, 0.02, 1.1);     // Slight upward
const gemini25Series = generateModelSeries(56789, 0.01, 0.6);  // Stable

export const seriesData: SeriesData[] = Array.from({ length: TOTAL_POINTS }, (_, i) => ({
  timestamp: START_TIME + i * INTERVAL_MS,
  'deepseek-max': deepseekSeries[i],
  'gpt-5': gpt5Series[i],
  'grok-4': grok4Series[i],
  'qwen-3-max': qwen3Series[i],
  'gemini-2-5-pro': gemini25Series[i],
}));

export function getCurrentIndex(): number {
  const elapsed = Date.now() - START_TIME;
  const index = Math.floor(elapsed / INTERVAL_MS);
  return Math.min(index, TOTAL_POINTS - 1);
}

