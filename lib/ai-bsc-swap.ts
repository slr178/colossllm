// AI-specific BSC token buying - matches bsc-swap.ts logic exactly

import { ethers } from 'ethers';

const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const PANCAKE_FACTORY = '0xca143ce32fe78f1f7019d7d551a6402fc5350c73';
const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const FOURMEME_PROXY = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';

const routerAbi = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable external'
];

const factoryAbi = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

const fourMemeProxyAbi = [
  'function buy(address token, address recipient) external payable'
];

export interface SwapResult {
  success: boolean;
  txHash?: string;
  error?: string;
  estimatedTokens?: string;
}

/**
 * Get AI wallet credentials (Next.js requires explicit variable names)
 */
function getAIWalletCredentials(aiNumber: number): { privateKey?: string; wallet?: string } {
  switch (aiNumber) {
    case 1:
      return {
        privateKey: process.env.NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY,
        wallet: process.env.NEXT_PUBLIC_AI1_BINANCE_WALLET
      };
    case 2:
      return {
        privateKey: process.env.NEXT_PUBLIC_AI2_BINANCE_PRIVATE_KEY,
        wallet: process.env.NEXT_PUBLIC_AI2_BINANCE_WALLET
      };
    case 3:
      return {
        privateKey: process.env.NEXT_PUBLIC_AI3_BINANCE_PRIVATE_KEY,
        wallet: process.env.NEXT_PUBLIC_AI3_BINANCE_WALLET
      };
    case 4:
      return {
        privateKey: process.env.NEXT_PUBLIC_AI4_BINANCE_PRIVATE_KEY,
        wallet: process.env.NEXT_PUBLIC_AI4_BINANCE_WALLET
      };
    case 5:
      return {
        privateKey: process.env.NEXT_PUBLIC_AI5_BINANCE_PRIVATE_KEY,
        wallet: process.env.NEXT_PUBLIC_AI5_BINANCE_WALLET
      };
    case 6:
      return {
        privateKey: process.env.NEXT_PUBLIC_AI6_BINANCE_PRIVATE_KEY,
        wallet: process.env.NEXT_PUBLIC_AI6_BINANCE_WALLET
      };
    default:
      return { privateKey: undefined, wallet: undefined };
  }
}

/**
 * Buy token using a specific AI's wallet - same logic as bsc-swap.ts
 */
export async function buyTokenWithAIWallet(
  aiNumber: number,
  tokenAddress: string,
  bnbAmount: string = '0.01',
  slippagePercent: number = 15
): Promise<SwapResult> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BSC_RPC_URL;
    const { privateKey, wallet: walletAddress } = getAIWalletCredentials(aiNumber);

    console.log(`AI${aiNumber} Credentials Check:`);
    console.log(`   RPC: ${rpcUrl ? 'Loaded' : 'MISSING'}`);
    console.log(`   Private Key: ${privateKey ? 'Loaded' : 'MISSING'}`);
    console.log(`   Wallet Address: ${walletAddress || 'N/A'}`);

    if (!rpcUrl || !privateKey) {
      return { success: false, error: `Missing config for AI${aiNumber}` };
    }

    // Ensure private key has 0x prefix
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(formattedPrivateKey, provider);
    const router = new ethers.Contract(PANCAKE_ROUTER, routerAbi, wallet);
    const factory = new ethers.Contract(PANCAKE_FACTORY, factoryAbi, provider);

    const amountIn = ethers.parseEther(bnbAmount);
    const balance = await provider.getBalance(wallet.address);

    console.log(`AI${aiNumber}: Wallet ${wallet.address} | BNB Balance: ${ethers.formatEther(balance)}`);
    if (balance < amountIn) return { success: false, error: 'Insufficient BNB' };

    // Get token info
    const erc20 = new ethers.Contract(tokenAddress, [
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)'
    ], provider);

    let decimals = 18;
    let symbol = '?';
    try {
      [decimals, symbol] = await Promise.all([erc20.decimals(), erc20.symbol()]);
    } catch (e) {
      console.log('Could not fetch decimals/symbol');
    }

    // Check if token has PancakeSwap pair (migrated) or use Four.meme proxy (non-migrated)
    const [tokenA, tokenB] = tokenAddress.toLowerCase() < WBNB.toLowerCase()
      ? [tokenAddress, WBNB]
      : [WBNB, tokenAddress];
    const pair = await factory.getPair(tokenA, tokenB);

    let tx;
    let expectedOut = BigInt(0);

    if (pair !== ZERO_ADDRESS) {
      // MIGRATED TOKEN: Use PancakeSwap
      console.log(`Token is migrated - buying on PancakeSwap`);
      console.log(`   Estimating ${bnbAmount} BNB -> ${symbol}`);
      
      const path = [WBNB, tokenAddress];
      let amountsOut;

      try {
        amountsOut = await router.getAmountsOut(amountIn, path);
      } catch {
        return { success: false, error: 'Could not estimate output — likely no liquidity' };
      }

      expectedOut = amountsOut[1];
      const minOut = expectedOut * BigInt(100 - slippagePercent) / BigInt(100);

      tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        minOut,
        path,
        wallet.address,
        Math.floor(Date.now() / 1000) + 180,
        { value: amountIn, gasLimit: ethers.toBigInt(500000) }
      );
    } else {
      // NON-MIGRATED TOKEN: Use Four.meme bonding curve proxy
      console.log(`Token not migrated - buying via Four.meme bonding curve`);
      console.log(`   Validating token eligibility on Four.meme...`);

      const fourMemeProxy = new ethers.Contract(FOURMEME_PROXY, fourMemeProxyAbi, wallet);

      // Pre-validate with static call to avoid wasting gas
      try {
        await fourMemeProxy.buy.staticCall(
          tokenAddress,
          wallet.address,
          { value: amountIn }
        );
        console.log(`   Token is eligible for bonding curve purchase`);
      } catch (err: any) {
        const revertReason = err?.error?.message || err?.reason || err.message || 'Unknown revert';
        console.error(`   Pre-validation failed: ${revertReason}`);
        return {
          success: false,
          error: `Token not yet eligible for bonding curve buy. ${revertReason}`
        };
      }

      console.log(`   Sending ${bnbAmount} BNB to Four.meme proxy for ${symbol}`);
      tx = await fourMemeProxy.buy(
        tokenAddress,
        wallet.address,
        { value: amountIn, gasLimit: ethers.toBigInt(300000) }
      );
    }

    const receipt = await tx.wait();
    console.log(`AI${aiNumber} Buy Success: ${tx.hash}`);

    return {
      success: true,
      txHash: tx.hash,
      estimatedTokens: ethers.formatUnits(expectedOut, decimals)
    };
  } catch (error: any) {
    console.error('Swap failed:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
