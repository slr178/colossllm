// OPTIONAL: Add PancakeSwap PairCreated events for more activity
// This shows lots of new DEX pairs being created on BSC

export const PANCAKESWAP_V2_FACTORY = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
export const PANCAKESWAP_V3_FACTORY = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865';

/**
 * GraphQL subscription for PancakeSwap pair creations
 * Use this if you want to show more frequent activity
 */
export const PANCAKESWAP_SUBSCRIPTION = `
  subscription {
    EVM(network: bsc) {
      Events(
        where: {
          Log: {
            SmartContract: { 
              in: [
                "${PANCAKESWAP_V2_FACTORY}", 
                "${PANCAKESWAP_V3_FACTORY}"
              ]
            }
            Signature: { Name: { is: "PairCreated" } }
          }
        }
        orderBy: { descending: Block_Time }
        limit: { count: 10 }
      ) {
        Block {
          Number
          Time
        }
        Transaction {
          Hash
          From
        }
        Log {
          SmartContract
        }
        Arguments {
          Name
          Value {
            ... on EVM_ABI_Address_Value_Arg {
              address
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

/**
 * Parse PancakeSwap PairCreated event
 */
export function parsePancakePair(event: any) {
  const args = event.Arguments || [];
  const argMap: Record<string, any> = {};

  args.forEach((arg: any) => {
    argMap[arg.Name] = arg.Value?.address || arg.Value?.integer || '';
  });

  return {
    id: event.Transaction.Hash + '-' + event.Block.Number,
    token0: argMap.token0,
    token1: argMap.token1,
    pair: argMap.pair,
    pairIndex: argMap.pairIndex,
    timestamp: event.Block.Time,
    txHash: event.Transaction.Hash,
    blockNumber: event.Block.Number,
    factory: event.Log.SmartContract,
  };
}

/**
 * Example: Combined stream of Four.meme + PancakeSwap
 * This will show LOTS of activity since PancakeSwap is very active
 */
export const COMBINED_SUBSCRIPTION = (fourMemeContract: string) => `
  subscription {
    fourMeme: EVM(network: bsc) {
      Events(
        where: {
          Log: {
            SmartContract: { is: "${fourMemeContract}" }
            Signature: { Name: { is: "TokenCreate" } }
          }
        }
        orderBy: { descending: Block_Time }
        limit: { count: 5 }
      ) {
        Block { Number Time }
        Transaction { Hash From }
        Log { SmartContract }
        Arguments {
          Name
          Value {
            ... on EVM_ABI_String_Value_Arg { string }
            ... on EVM_ABI_Address_Value_Arg { address }
            ... on EVM_ABI_BigInt_Value_Arg { bigInteger }
          }
        }
      }
    }
    
    pancake: EVM(network: bsc) {
      Events(
        where: {
          Log: {
            SmartContract: { 
              in: ["${PANCAKESWAP_V2_FACTORY}", "${PANCAKESWAP_V3_FACTORY}"]
            }
            Signature: { Name: { is: "PairCreated" } }
          }
        }
        orderBy: { descending: Block_Time }
        limit: { count: 5 }
      ) {
        Block { Number Time }
        Transaction { Hash From }
        Log { SmartContract }
        Arguments {
          Name
          Value {
            ... on EVM_ABI_Address_Value_Arg { address }
            ... on EVM_ABI_Integer_Value_Arg { integer }
          }
        }
      }
    }
  }
`;

// Usage:
// - Use COMBINED_SUBSCRIPTION for tons of activity (Four.meme + PancakeSwap)
// - Filter results by checking which query they came from (fourMeme vs pancake)
// - Display them in different sections or merge into one feed

