// BSC Token Swap - Buy Four.meme tokens using PancakeSwap

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
 * Buy a Four.meme token using BNB
 */
export async function buyToken(
  tokenAddress: string,
  bnbAmount: string,
  slippagePercent: number = 10
): Promise<SwapResult> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BSC_RPC_URL;
    const privateKey = process.env.NEXT_PUBLIC_TEST_WALLET_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
      return {
        success: false,
        error: 'BSC RPC URL or Private Key not configured in .env',
      };
    }

    console.log('Connecting to BSC...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`Wallet: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} BNB`);

    if (balance === BigInt(0)) {
      return {
        success: false,
        error: 'Wallet has no BNB for gas fees',
      };
    }

    const router = new ethers.Contract(PANCAKE_ROUTER, routerAbi, wallet);
    const factory = new ethers.Contract(PANCAKE_FACTORY, factoryAbi, provider);
    const amountIn = ethers.parseEther(bnbAmount);

    // Get token info
    console.log(`Getting token info...`);
    const erc20 = new ethers.Contract(
      tokenAddress,
      ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'],
      provider
    );
    
    let decimals = 18;
    let symbol = '?';
    try {
      [decimals, symbol] = await Promise.all([erc20.decimals(), erc20.symbol()]);
      console.log(`   Token: ${symbol} (${decimals} decimals)`);
    } catch (err) {
      console.log(`   Could not fetch decimals/symbol`);
    }

    // Check if token has PancakeSwap pair (migrated) or use Four.meme proxy (non-migrated)
    console.log(`Checking if token has WBNB pair on PancakeSwap...`);
    const [tokenA, tokenB] = tokenAddress.toLowerCase() < WBNB.toLowerCase()
      ? [tokenAddress, WBNB]
      : [WBNB, tokenAddress];
    const pair = await factory.getPair(tokenA, tokenB);

    let tx;
    let expectedOut = BigInt(0);

    if (pair !== ZERO_ADDRESS) {
      // MIGRATED TOKEN: Use PancakeSwap
      console.log(`   Pair exists: ${pair}`);
      console.log(`   Token is migrated - buying on PancakeSwap`);
      console.log(`   Estimating ${bnbAmount} BNB -> ${symbol}`);
      
      const path = [WBNB, tokenAddress];
      let amountsOut;

      try {
        amountsOut = await router.getAmountsOut(amountIn, path);
      } catch (err) {
        return {
          success: false,
          error: 'Failed to estimate swap. Token may have insufficient liquidity.',
        };
      }

      expectedOut = amountsOut[1];
      const slippageMultiplier = 100 - slippagePercent;
      const minOut = (expectedOut * BigInt(slippageMultiplier)) / BigInt(100);

      console.log(`   Expected tokens: ${ethers.formatUnits(expectedOut, decimals)}`);
      console.log(`   Min with ${slippagePercent}% slippage: ${ethers.formatUnits(minOut, decimals)}`);

      console.log('   Executing swap...');
      const deadline = Math.floor(Date.now() / 1000) + 180;

      tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        minOut,
        path,
        wallet.address,
        deadline,
        { value: amountIn, gasLimit: ethers.toBigInt(500000) }
      );
    } else {
      // NON-MIGRATED TOKEN: Use Four.meme bonding curve proxy
      console.log(`   No PancakeSwap pair found`);
      console.log(`   Token not migrated - buying via Four.meme bonding curve`);
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

    console.log(`Transaction sent: ${tx.hash}`);
    console.log(`View: https://bscscan.com/tx/${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Confirmed in block ${receipt.blockNumber}`);

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

/**
 * Check if a token can be bought (has PancakeSwap pair or Four.meme eligibility)
 */
export async function isTokenBuyable(tokenAddress: string): Promise<{
  buyable: boolean;
  method: 'pancakeswap' | 'fourmeme' | 'none';
  reason?: string;
}> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BSC_RPC_URL;
    if (!rpcUrl) {
      return { buyable: false, method: 'none', reason: 'RPC not configured' };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const factory = new ethers.Contract(PANCAKE_FACTORY, factoryAbi, provider);

    // Check for PancakeSwap pair
    const [tokenA, tokenB] = tokenAddress.toLowerCase() < WBNB.toLowerCase()
      ? [tokenAddress, WBNB]
      : [WBNB, tokenAddress];
    const pair = await factory.getPair(tokenA, tokenB);

    if (pair !== ZERO_ADDRESS) {
      return { buyable: true, method: 'pancakeswap' };
    }

    // Check Four.meme eligibility with a tiny amount for validation
    const privateKey = process.env.NEXT_PUBLIC_TEST_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      return { buyable: false, method: 'none', reason: 'Wallet not configured' };
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const fourMemeProxy = new ethers.Contract(FOURMEME_PROXY, fourMemeProxyAbi, wallet);

    // Try static call with minimal BNB
    const testAmount = ethers.parseEther('0.0001');
    try {
      await fourMemeProxy.buy.staticCall(
        tokenAddress,
        wallet.address,
        { value: testAmount }
      );
      return { buyable: true, method: 'fourmeme' };
    } catch (err: any) {
      const reason = err?.error?.message || err?.reason || 'Not yet available on bonding curve';
      return { buyable: false, method: 'none', reason };
    }

  } catch (error: any) {
    return { buyable: false, method: 'none', reason: error.message };
  }
}
