// Token metrics and filtering logic for Four.meme tokens

import { BITQUERY_HTTP, getBitqueryToken, FOUR_MEME_CONTRACT } from './bitquery';

export interface TokenMetrics {
  price: number;
  marketCap: number;
  volume24h: number;
  volume1h: number;
  volume5m: number;
  trades24h: number;
  trades1h: number;
  trades5m: number;
  bondingProgress: number;
  holders: number;
}

/**
 * Fetch comprehensive metrics for a token
 */
export async function fetchTokenMetrics(tokenAddress: string): Promise<TokenMetrics | null> {
  const token = getBitqueryToken();

  // Exact query from Four.meme docs for bonding curve balance
  const balanceQuery = /* GraphQL */ `
    query MyQuery($token: String) {
      EVM(dataset: combined, network: bsc) {
        BalanceUpdates(
          where: {
            BalanceUpdate: { Address: { is: "0x5c952063c7fc8610FFDB798152D69F0B9550762b" } }
            Currency: { SmartContract: { is: $token } }
          }
          orderBy: { descendingByField: "balance" }
        ) {
          Currency {
            Name
          }
          balance: sum(of: BalanceUpdate_Amount)
          BalanceUpdate {
            Address
          }
        }
      }
    }
  `;

  // Exact query from Four.meme docs for trade metrics
  const metricsQuery = /* GraphQL */ `
    query MyQuery($currency: String) {
      EVM(network: bsc) {
        DEXTradeByTokens(
          where: {
            Trade: { Currency: { SmartContract: { is: $currency } }, Success: true }
            Block: { Time: { since_relative: { hours_ago: 24 } } }
          }
        ) {
          Trade {
            Currency {
              Name
              Symbol
              SmartContract
            }
            price_usd: PriceInUSD(maximum: Block_Number)
          }
          volume_24hr: sum(of: Trade_Side_AmountInUSD)
          volume_1hr: sum(
            of: Trade_Side_AmountInUSD
            if: { Block: { Time: { since_relative: { hours_ago: 1 } } } }
          )
          volume_5min: sum(
            of: Trade_Side_AmountInUSD
            if: { Block: { Time: { since_relative: { minutes_ago: 5 } } } }
          )
          trades_24hr: count
          trades_1hr: count(
            if: { Block: { Time: { since_relative: { hours_ago: 1 } } } }
          )
          trades_5min: count(
            if: { Block: { Time: { since_relative: { minutes_ago: 5 } } } }
          )
        }
      }
      
      holders: EVM(network: bsc) {
        BalanceUpdates(
          where: {
            Currency: { SmartContract: { is: $currency } }
          }
        ) {
          holders: uniq(of: BalanceUpdate_Address)
        }
      }
    }
  `;

  try {
    // Fetch balance from bonding curve contract
    const balanceResponse = await fetch(BITQUERY_HTTP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: balanceQuery,
        variables: { token: tokenAddress },
      }),
    });

    const balanceJson = await balanceResponse.json();

    if (balanceJson.errors) {
      console.error('      ❌ Balance query errors:', balanceJson.errors);
    }

    // Fetch trade metrics and holders
    const metricsResponse = await fetch(BITQUERY_HTTP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: metricsQuery,
        variables: { currency: tokenAddress },
      }),
    });

    const metricsJson = await metricsResponse.json();

    if (metricsJson.errors) {
      console.error('      ❌ Metrics query errors:', metricsJson.errors);
      return null;
    }

    const tradeData = metricsJson.data?.EVM?.DEXTradeByTokens?.[0];
    const holderData = metricsJson.data?.holders?.BalanceUpdates?.[0];
    const balanceData = balanceJson.data?.EVM?.BalanceUpdates?.[0];

    if (!tradeData) {
      console.log('      ⏭️  No trades yet');
      return null;
    }

    const price = parseFloat(tradeData.Trade?.price_usd || '0');
    
    if (price === 0) {
      console.log('      ⏭️  No price data yet');
      return null;
    }

    const marketCap = price * 1_000_000_000;
    
    // Get balance from the bonding curve contract
    // If no balance data, token might be brand new - default to full supply (1B)
    const balance = balanceData?.balance ? parseFloat(balanceData.balance) : 1_000_000_000;
    
    // Formula from docs: BondingCurveProgress = 100 - (((balance - 200,000,000) * 100) / 800,000,000)
    // Where:
    // - balance = current token balance at Four.meme proxy
    // - 200M = reserved tokens for migration
    // - 800M = initial sale tokens (totalSupply 1B - 200M reserved)
    const leftTokens = balance - 200_000_000;
    const initialRealTokenReserves = 800_000_000;
    const bondingProgress = Math.max(0, Math.min(100, 
      100 - ((leftTokens * 100) / initialRealTokenReserves)
    ));

    const volume24h = parseFloat(tradeData.volume_24hr || '0');
    const volume1h = parseFloat(tradeData.volume_1hr || '0');
    const volume5m = parseFloat(tradeData.volume_5min || '0');
    const trades24h = parseInt(tradeData.trades_24hr || '0');
    const trades1h = parseInt(tradeData.trades_1hr || '0');
    const trades5m = parseInt(tradeData.trades_5min || '0');
    const holders = parseInt(holderData?.holders || '0');

    console.log(`      📊 Cap: $${(marketCap/1000).toFixed(1)}K | 24h Vol: $${volume24h.toFixed(0)} | 1h Vol: $${volume1h.toFixed(0)} | Progress: ${bondingProgress.toFixed(1)}%`);

    return {
      price,
      marketCap,
      volume24h,
      volume1h,
      volume5m,
      trades24h,
      trades1h,
      trades5m,
      bondingProgress,
      holders,
    };
  } catch (error) {
    console.error('      ❌ Error fetching metrics:', error);
    return null;
  }
}

/**
 * Filter criteria for promising tokens
 */
export interface FilterCriteria {
  minMarketCap: number;
  maxMarketCap: number;
  minVolume24h: number;
  minTrades24h: number;
  minBondingProgress: number;
  maxBondingProgress: number;
  minHolders: number;
}

export const DEFAULT_CRITERIA: FilterCriteria = {
  minMarketCap: 5000,      // Minimum market cap
  maxMarketCap: 100000,    // Maximum market cap  
  minVolume24h: 4000,      // Must have $4K+ volume in 24h
  minTrades24h: 10,        // At least some activity
  minBondingProgress: 60,  // Must be 60%+ (pre-filtered by query)
  maxBondingProgress: 95,  // Below 95% (not fully sold yet)
  minHolders: 5,           // At least a few holders
};

/**
 * Determine if a token is promising based on metrics
 * Also checks for honeypot indicators and age
 */
export function isPromisingToken(
  metrics: TokenMetrics, 
  honeypotData?: { isHoneypot: boolean; buyCount: number; sellCount: number },
  criteria: FilterCriteria = DEFAULT_CRITERIA,
  tokenAge?: number
): boolean {
  // Age check - ONLY tokens < 15 minutes old
  if (tokenAge !== undefined) {
    const ageMinutes = tokenAge / (1000 * 60);
    if (ageMinutes > 15) {
      console.log(`      ❌ Too old: ${ageMinutes.toFixed(1)} minutes`);
      return false;
    }
  }

  // Honeypot check - CRITICAL
  if (honeypotData?.isHoneypot) {
    console.log('      ❌ HONEYPOT DETECTED');
    return false;
  }

  // Market cap check
  if (metrics.marketCap < criteria.minMarketCap || metrics.marketCap > criteria.maxMarketCap) {
    console.log(`      ❌ Market cap out of range: $${(metrics.marketCap/1000).toFixed(1)}K`);
    return false;
  }

  // Volume check
  if (metrics.volume24h < criteria.minVolume24h) {
    console.log(`      ❌ Volume too low: $${metrics.volume24h.toFixed(0)}`);
    return false;
  }

  // Trade activity check
  if (metrics.trades24h < criteria.minTrades24h) {
    console.log(`      ❌ Not enough trades: ${metrics.trades24h}`);
    return false;
  }

  // Bonding curve progress check
  if (metrics.bondingProgress < criteria.minBondingProgress || metrics.bondingProgress > criteria.maxBondingProgress) {
    console.log(`      ❌ Progress out of range: ${metrics.bondingProgress.toFixed(1)}%`);
    return false;
  }

  // Holder count check
  if (metrics.holders < criteria.minHolders) {
    console.log(`      ❌ Not enough holders: ${metrics.holders}`);
    return false;
  }

  // Sell pressure check (if honeypot data available)
  if (honeypotData && honeypotData.buyCount > 0) {
    const sellRatio = honeypotData.sellCount / honeypotData.buyCount;
    // If there are buys but absolutely no sells, suspicious
    if (honeypotData.buyCount > 10 && sellRatio === 0) {
      console.log('      ⚠️  Warning: No sell transactions detected');
    }
    // Some sells are actually healthy (means liquidity works both ways)
    if (sellRatio > 0 && sellRatio < 0.5) {
      console.log('      ✅ Healthy buy/sell ratio');
    }
  }

  return true;
}

/**
 * Get quality score (0-100) for a token
 */
export function getTokenScore(metrics: TokenMetrics): number {
  let score = 0;

  // Market cap positioning (20 points) - favor mid-range
  const capRange = 40000 - 14000;
  const capPosition = (metrics.marketCap - 14000) / capRange;
  score += 20 * (1 - Math.abs(capPosition - 0.5) * 2); // Best at 50% of range

  // Volume (30 points)
  score += Math.min(30, (metrics.volume24h / 10000) * 30);

  // Trade activity (20 points)
  score += Math.min(20, (metrics.trades24h / 100) * 20);

  // Bonding progress (15 points) - favor 40-60%
  const progressDiff = Math.abs(metrics.bondingProgress - 50);
  score += 15 * (1 - progressDiff / 50);

  // Holders (15 points)
  score += Math.min(15, (metrics.holders / 100) * 15);

  return Math.round(Math.max(0, Math.min(100, score)));
}

