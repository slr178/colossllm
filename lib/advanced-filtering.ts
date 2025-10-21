// Advanced token filtering - Query for mid-stage tokens directly

import { BITQUERY_HTTP, getBitqueryToken } from './bitquery';

/**
 * Fetch tokens that are 60%+ through bonding curve
 * 
 * Balance range for 60-100% progress:
 * - 60% progress: balance = 200M + (800M * 0.40) = 520M
 * - 100% progress: balance = 200M
 * Range: 200M to 520M
 */
export async function fetchMidStageTokens(): Promise<any[]> {
  const token = getBitqueryToken();

  const query = /* GraphQL */ `
    query MyQuery {
      EVM(dataset: combined, network: bsc) {
        BalanceUpdates(
          limit: { count: 50 }
          where: {
            BalanceUpdate: {
              Address: { is: "0x5c952063c7fc8610FFDB798152D69F0B9550762b" }
            }
          }
          orderBy: { descendingByField: "balance" }
        ) {
          Currency {
            SmartContract
            Name
            Symbol
          }
          balance: sum(
            of: BalanceUpdate_Amount
            selectWhere: { ge: "200000000", le: "520000000" }
          )
          BalanceUpdate {
            Address
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
          console.log('🔄 Retrying with rotated token...');
          return fetchMidStageTokens(); // Retry
        }
      }
      
      const text = await response.text();
      console.error(`❌ Bitquery API Error (${response.status}):`, text.substring(0, 100));
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.error('❌ Mid-stage query errors:', json.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    const results = json.data?.EVM?.BalanceUpdates || [];
    
    // Filter out entries with no balance
    return results.filter((r: any) => r.balance && parseFloat(r.balance) > 0);
  } catch (error) {
    console.error('❌ Failed to fetch mid-stage tokens:', error);
    throw error;
  }
}

/**
 * Check if token is a honeypot
 */
export async function checkHoneypot(tokenAddress: string): Promise<{
  isHoneypot: boolean;
  reason?: string;
  buyCount: number;
  sellCount: number;
  topHolderPercent: number;
}> {
  const token = getBitqueryToken();

  const query = /* GraphQL */ `
    query ($token: String!) {
      buySells: EVM(network: bsc) {
        DEXTrades(
          where: {
            Trade: {
              Currency: { SmartContract: { is: $token } }
              Dex: { ProtocolName: { is: "fourmeme_v1" } }
              Success: true
            }
          }
          limit: { count: 100 }
        ) {
          Trade {
            Side {
              Type
            }
            Buy {
              Amount
              Buyer
            }
            Sell {
              Amount
              Seller
            }
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
      body: JSON.stringify({
        query,
        variables: { token: tokenAddress },
      }),
    });

    const json = await response.json();

    if (json.errors || !json.data?.buySells?.DEXTrades) {
      return { isHoneypot: false, buyCount: 0, sellCount: 0, topHolderPercent: 0 };
    }

    const trades = json.data.buySells.DEXTrades;
    const buys = trades.filter((t: any) => t.Trade.Side?.Type === 'buy');
    const sells = trades.filter((t: any) => t.Trade.Side?.Type === 'sell');

    const buyCount = buys.length;
    const sellCount = sells.length;

    // Red flag: lots of buys but zero sells = might be honeypot
    if (buyCount > 10 && sellCount === 0) {
      return {
        isHoneypot: true,
        reason: 'No sell transactions detected (possible honeypot)',
        buyCount,
        sellCount,
        topHolderPercent: 0,
      };
    }

    return {
      isHoneypot: false,
      buyCount,
      sellCount,
      topHolderPercent: 0,
    };
  } catch (error) {
    console.error('      ❌ Honeypot check failed:', error);
    return { isHoneypot: false, buyCount: 0, sellCount: 0, topHolderPercent: 0 };
  }
}
