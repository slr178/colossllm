// Bitquery API utilities for Four.meme token streaming

export const BITQUERY_HTTP = 'https://streaming.bitquery.io/graphql';
export const BITQUERY_WS = 'wss://streaming.bitquery.io/graphql';

// Four.meme factory contract on BSC
export const FOUR_MEME_CONTRACT = '0x5c952063c7fc8610ffdb798152d69f0b9550762b';

import { getRotatingBitqueryToken, handleQuotaError } from './bitquery-rotator';

export function getBitqueryToken() {
  return getRotatingBitqueryToken();
}

export interface FourMemeEvent {
  SmartContract: { Address: string };
  Transaction: { Hash: string; From: string };
  Block: { Number: number; Time: string };
  EventArguments: Array<{ Argument: string; Value: any }>;
  Cursor?: { Next?: string };
}

export interface FourMemeToken {
  id: string;
  creator: string;
  token: string;
  name: string;
  symbol: string;
  totalSupply: string;
  requestId: string;
  launchTime: number;
  launchFee: string;
  txHash: string;
  blockTime: string;
  // Enriched metrics
  price?: number;
  marketCap?: number;
  volume24h?: number;
  volume1h?: number;
  volume5m?: number;
  trades24h?: number;
  trades1h?: number;
  trades5m?: number;
  holders?: number;
  bondingProgress?: number;
  isPromising?: boolean;
}

/**
 * Fetch historical Four.meme token creations via HTTP
 * Use this on page load to backfill with recent tokens
 */
export async function fetchFourMemeCreations(hoursAgo: number = 24): Promise<any[]> {
  const token = getBitqueryToken();
  const from = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const query = /* GraphQL */ `
    query ($from: DateTime!) {
      EVM(network: bsc) {
        Events(
          where: {
            Transaction: { To: { is: "${FOUR_MEME_CONTRACT}" } }
            Log: { Signature: { Name: { is: "TokenCreate" } } }
            Block: { Time: { after: $from } }
          }
          limit: { count: 200 }
          orderBy: { descending: Block_Time }
        ) {
          Block {
            Time
          }
          Transaction {
            Hash
            From
          }
          Arguments {
            Name
            Value {
              ... on EVM_ABI_Address_Value_Arg {
                address
              }
              ... on EVM_ABI_String_Value_Arg {
                string
              }
              ... on EVM_ABI_BigInt_Value_Arg {
                bigInteger
              }
              ... on EVM_ABI_Integer_Value_Arg {
                integer
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(BITQUERY_HTTP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables: { from },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    
    if (response.status === 402) {
      console.warn('⚠️ Token quota exhausted, rotating...');
      const newToken = handleQuotaError();
      
      if (newToken) {
        // Retry with new token
        console.log('🔄 Retrying with rotated token...');
        return fetchFourMemeCreations(hoursAgo);
      }
    }
    
    console.error(`❌ Bitquery HTTP Error (${response.status}):`, text);
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
  }

  const json = await response.json();

  if (json.errors) {
    console.error('Bitquery GraphQL errors:', json.errors);
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data?.EVM?.Events ?? [];
}

/**
 * Helper to get argument value by name
 */
function getArgValue(event: any, name: string): any {
  const arg = event.Arguments?.find((a: any) => a.Name === name);
  if (!arg) return null;
  
  return (
    arg.Value?.address ||
    arg.Value?.string ||
    arg.Value?.bigInteger ||
    arg.Value?.integer ||
    null
  );
}

/**
 * Parse event arguments into a structured token object
 */
export function parseTokenEvent(event: any): FourMemeToken {
  return {
    id: event.Transaction.Hash + '-' + Date.now(),
    creator: getArgValue(event, 'creator') || event.Transaction.From,
    token: getArgValue(event, 'token') || '',
    name: getArgValue(event, 'name') || 'Unknown',
    symbol: getArgValue(event, 'symbol') || 'N/A',
    totalSupply: getArgValue(event, 'totalSupply') || '0',
    requestId: getArgValue(event, 'requestId') || '0',
    launchTime: getArgValue(event, 'launchTime') || 0,
    launchFee: getArgValue(event, 'launchFee') || '0',
    txHash: event.Transaction.Hash,
    blockTime: event.Block.Time,
  };
}

/**
 * Backfill recent tokens (e.g., last 24 hours)
 * This gives you instant data on page load
 */
export async function backfillRecentTokens(hoursAgo: number = 24): Promise<FourMemeToken[]> {
  console.log(`📦 Backfilling tokens from last ${hoursAgo} hours...`);

  try {
    const events = await fetchFourMemeCreations(hoursAgo);
    console.log(`✅ Backfilled ${events.length} tokens`);
    return events.map(parseTokenEvent);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  }
}

