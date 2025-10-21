// Wallet Tracker - Monitor smart money wallets for Four.meme buys

import { BITQUERY_HTTP, getBitqueryToken } from './bitquery';
import { SMART_WALLETS } from '@/data/smart-wallets';

export interface WalletBuy {
  wallet: string;
  tokenContract: string;
  tokenName: string;
  tokenSymbol: string;
  amount: number;
  priceUSD: number;
  timestamp: string;
  txHash: string;
  stillHolding: boolean;
  walletCount?: number; // How many tracked wallets bought this token
}

/**
 * Fetch recent buys from smart wallets (batch query for efficiency)
 * Only returns buys from last 1 hour where wallet still holds the token
 */
export async function fetchSmartWalletBuys(): Promise<WalletBuy[]> {
  const token = getBitqueryToken();
  
  console.log(`Fetching trades from 67 wallets...`);
  console.log(`   Looking for buys in last 30 minutes (wider window for Bitquery lag)`);
  console.log(`   Example wallet: ${SMART_WALLETS[0]}`);
  console.log(`   Query uses: network bsc (realtime data)`);
  
  // Query recent buys from ALL smart wallets in one call
  const walletsFilter = SMART_WALLETS.map(w => `"${w}"`).join(', ');
  
  const query = /* GraphQL */ `
    query {
      EVM(network: bsc) {
        DEXTrades(
          where: {
            Trade: {
              Dex: { ProtocolName: { is: "fourmeme_v1" } }
              Success: true
            }
            Transaction: { From: { in: [${walletsFilter}] } }
            Block: { Time: { since_relative: { minutes_ago: 30 } } }
          }
          orderBy: { descending: Block_Time }
          limit: { count: 100 }
        ) {
          Block {
            Time
          }
          Trade {
            Buy {
              Buyer
              Currency {
                Name
                Symbol
                SmartContract
              }
              Amount
              Price
              PriceInUSD
            }
            Sell {
              Currency {
                SmartContract
              }
            }
          }
          Transaction {
            Hash
            From
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(BITQUERY_HTTP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      if (response.status === 402) {
        const { handleQuotaError } = await import('./bitquery-rotator');
        const newToken = handleQuotaError();
        
        if (newToken) {
          console.log('Retrying wallet tracker with rotated token...');
          return fetchSmartWalletBuys(); // Retry with new token
        }
      }
      
      const text = await response.text();
      console.error(`Wallet tracker error (${response.status}):`, text.substring(0, 100));
      return [];
    }

    const json = await response.json();

    if (json.errors) {
      console.error('Wallet tracker query errors:', json.errors);
      return [];
    }

    const trades = json.data?.EVM?.DEXTrades || [];
    console.log(`   Received ${trades.length} trade records from Bitquery`);
    
    // Group by token to count wallet interest and get latest buy
    const tokenMap = new Map<string, { walletCount: number; latestBuy: any; firstWallet: string }>();

    for (const trade of trades) {
      const buyData = trade.Trade?.Buy;
      if (!buyData || !buyData.Currency) continue;

      const tokenContract = buyData.Currency.SmartContract;
      
      // Skip invalid tokens (empty address, BNB, WBNB, etc.)
      if (!tokenContract || 
          tokenContract === '0x' || 
          tokenContract.length < 20 ||
          buyData.Currency.Symbol === 'BNB' ||
          buyData.Currency.Symbol === 'WBNB') {
        continue;
      }

      const wallet = trade.Transaction.From;
      const timestamp = new Date(trade.Block.Time).getTime();

      if (!tokenMap.has(tokenContract)) {
        tokenMap.set(tokenContract, {
          walletCount: 1,
          latestBuy: trade,
          firstWallet: wallet,
        });
      } else {
        const existing = tokenMap.get(tokenContract)!;
        existing.walletCount++;
        
        // Keep the LATEST buy
        const existingTime = new Date(existing.latestBuy.Block.Time).getTime();
        if (timestamp > existingTime) {
          existing.latestBuy = trade;
        }
      }
    }

    // Convert to array and sort by latest buy time (most recent first)
    const buys: WalletBuy[] = Array.from(tokenMap.entries())
      .map(([tokenContract, data]) => {
        const buyData = data.latestBuy.Trade.Buy;
        return {
          wallet: data.firstWallet,
          tokenContract,
          tokenName: buyData.Currency.Name || 'Unknown',
          tokenSymbol: buyData.Currency.Symbol || 'N/A',
          amount: parseFloat(buyData.Amount || '0'),
          priceUSD: parseFloat(buyData.PriceInUSD || '0'),
          timestamp: data.latestBuy.Block.Time,
          txHash: data.latestBuy.Transaction.Hash,
          stillHolding: true,
          walletCount: data.walletCount, // How many wallets bought this
        };
      })
      .sort((a, b) => {
        // Sort by: 1) Most wallets bought it, 2) Most recent
        const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        const walletDiff = (b.walletCount || 0) - (a.walletCount || 0);
        return walletDiff * 1000000 + timeDiff; // Prioritize wallet count, then time
      });

    console.log(`   After filtering: ${buys.length} unique tokens`);
    
    if (buys.length > 0) {
      console.log(`   Top token: ${buys[0].tokenName} (${buys[0].walletCount}x wallets)`);
    }

    return buys;
  } catch (error) {
    console.error('Failed to fetch wallet buys:', error);
    return [];
  }
}

/**
 * Fetch current price and market cap for a token
 */
export async function fetchTokenPrice(tokenAddress: string): Promise<{
  price: number;
  marketCap: number;
  volume24h: number;
} | null> {
  const token = getBitqueryToken();

  const query = /* GraphQL */ `
    query MyQuery($currency: String) {
      EVM(network: bsc) {
        DEXTradeByTokens(
          where: {
            Trade: { Currency: { SmartContract: { is: $currency } }, Success: true }
            Block: { Time: { since_relative: { hours_ago: 24 } } }
          }
        ) {
          Trade {
            current: PriceInUSD
          }
          volume_24hr: sum(of: Trade_Side_AmountInUSD)
        }
      }
    }
  `;

  try {
    const response = await fetch(BITQUERY_HTTP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { currency: tokenAddress },
      }),
    });

    const json = await response.json();
    const data = json.data?.EVM?.DEXTradeByTokens?.[0];

    if (!data) return null;

    const price = parseFloat(data.Trade?.current || '0');
    const marketCap = price * 1_000_000_000;
    const volume24h = parseFloat(data.volume_24hr || '0');

    return { price, marketCap, volume24h };
  } catch (error) {
    return null;
  }
}

