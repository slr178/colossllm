// AI Trading Automation System
// Orchestrates all 6 AIs to trade BNB tokens and Asterdex leverage positions

import { buyTokenWithAIWallet, SwapResult } from './ai-bsc-swap';
import { runAITradingCycle } from './ai-asterdex-trader';
import { ethers } from 'ethers';
import { getLogger } from './automation-logger';
import { AsterdexTrader } from './asterdex-trader';
import { getJournal } from './persistent-journal';
import { getAIWalletBalances, WalletBalances } from './wallet-balance';

const logger = getLogger();

export interface BNBTokenPosition {
  aiNumber: number;
  aiName: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  buyAmount: string; // BNB amount spent
  buyTxHash: string;
  buyTimestamp: number;
  buyPrice?: number; // Token price at entry (in BNB)
  currentPrice?: number; // Current token price
  tokenBalance?: number; // Amount of tokens held
  unrealizedPnL?: number; // In BNB
  unrealizedPnLPercent?: number;
  status: 'active' | 'sold' | 'failed';
}

export interface AsterTrade {
  aiNumber: number;
  aiName: string;
  symbol: string;
  action: 'LONG' | 'SHORT';
  leverage: number;
  usdAmount: number;
  orderId?: string;
  timestamp: number;
  entryPrice?: number;
  currentPrice?: number;
  unrealizedPnL?: number;
  realizedPnL?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: 'active' | 'closed' | 'failed';
}

export interface JournalEntry {
  timestamp: number;
  type: 'BNB_BUY' | 'ASTER_LONG' | 'ASTER_SHORT' | 'ASTER_CLOSE' | 'DECISION' | 'ERROR';
  symbol?: string;
  decision?: string;
  reasoning?: string;
  amount?: number;
  leverage?: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence?: number;
  result?: string;
  txHash?: string;
  orderId?: string;
}

export interface AIAutomationStatus {
  aiNumber: number;
  aiName: string;
  isRunning: boolean;
  lastAction?: string;
  lastActionTime?: number;
  bnbPositions: BNBTokenPosition[];
  asterTrades: AsterTrade[];
  totalBNBSpent: number;
  totalBNBPnL: number;
  totalAsterPnL: number;
  successCount: number;
  failureCount: number;
  error?: string;
  binanceBalance?: number;
  asterdexBalance?: number;
  totalBalance?: number;
  initialBalance?: number;
  totalPnL?: number;
  totalPnLPercent?: number;
}

// Global state for automation
const automationState: Map<number, AIAutomationStatus> = new Map();
const runningIntervals: Map<number, NodeJS.Timeout> = new Map();

// AI Model names mapping
const AI_NAMES = [
  'DeepSeek MAX',
  'GPT-5',
  'GROK-4',
  'Qwen 3 Max',
  'Gemini 2.5 Pro',
  'Claude 3.5 Sonnet'
];

/**
 * Initialize automation status for an AI
 */
function initializeAIStatus(aiNumber: number): AIAutomationStatus {
  // Get mock Asterdex balances for display
  const mockAsterdexBalances: Record<number, number> = {
    1: 930.47,  // DeepSeek MAX
    2: 927.37,  // GPT-5 
    3: 938.93,  // GROK-4
    4: 941.54,  // Qwen 3 Max
    5: 887.13,  // Gemini 2.5 Pro
    6: 845.78   // Claude 3.5 Sonnet
  };
  
  const binanceBalance = 1000;
  const asterdexBalance = mockAsterdexBalances[aiNumber] || 900;
  const totalBalance = binanceBalance + asterdexBalance;
  
  return {
    aiNumber,
    aiName: AI_NAMES[aiNumber - 1],
    isRunning: false,
    bnbPositions: [],
    asterTrades: [],
    totalBNBSpent: 0,
    totalBNBPnL: 0,
    totalAsterPnL: 0,
    successCount: 0,
    failureCount: 0,
    initialBalance: 1900, // Always start from $1900 baseline
    binanceBalance,
    asterdexBalance,
    totalBalance,
    totalPnL: 0,
    totalPnLPercent: 0
  };
}

/**
 * Add journal entry directly to AI status
 */
function addJournalEntry(aiNumber: number, entry: Omit<JournalEntry, 'timestamp'>) {
  const journal = getJournal();
  journal.addEntry(aiNumber, entry);
}

/**
 * Get the latest buyable token from smart wallet tracking (same logic as monitor page)
 */
async function getLatestToken(): Promise<{ address: string; name: string; symbol: string } | null> {
  try {
    console.log('Searching for NEWEST buyable token from smart wallets...');
    
    // Import the smart wallet tracker functions
    const { fetchSmartWalletBuys } = await import('./wallet-tracker');
    const { isTokenBuyable } = await import('./bsc-swap');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Token fetch timeout after 30s')), 30000)
    );
    
    const buys = await Promise.race([
      fetchSmartWalletBuys(),
      timeoutPromise
    ]);
    
    if (buys.length > 0) {
      // Sort by timestamp to get the absolute NEWEST
      const sortedByTime = [...buys].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Filter for buyable tokens only (check max 5 to save time)
      const tokensToCheck = sortedByTime.slice(0, 5);
      console.log(`   Checking ${tokensToCheck.length} most recent tokens for buyability...`);
      
      for (const token of tokensToCheck) {
        const buyability = await isTokenBuyable(token.tokenContract);
        const age = (Date.now() - new Date(token.timestamp).getTime()) / 60000;
        
        if (buyability.buyable) {
          console.log(`   Found buyable token: ${token.tokenName} (${buyability.method})`);
          console.log(`      Age: ${age.toFixed(1)} min ago`);
          console.log(`      Wallet count: ${token.walletCount || 1}x`);
          console.log(`      Method: ${buyability.method === 'pancakeswap' ? 'PancakeSwap' : 'Four.meme Bonding Curve'}`);
          
          return {
            address: token.tokenContract,
            name: token.tokenName,
            symbol: token.tokenSymbol
          };
        } else {
          console.log(`   Skipping ${token.tokenName}: ${buyability.reason}`);
        }
      }
      
      console.log(`   No buyable tokens found in top ${tokensToCheck.length}`);
    } else {
      console.log(`   No tokens found from smart wallets (possible Bitquery quota issue)`);
    }

    return null;
  } catch (error: any) {
    console.error('Failed to fetch latest token:', error.message);
    console.log('   Falling back to Asterdex trading...');
    return null;
  }
}

/**
 * Get token balance for an AI wallet
 */
async function getTokenBalance(
  aiNumber: number,
  tokenAddress: string
): Promise<number> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BSC_RPC_URL;
    if (!rpcUrl) return 0;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const walletCredentials = getAIBinanceWallet(aiNumber);
    
    if (!walletCredentials) return 0;

    const erc20 = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
      provider
    );

    const [balance, decimals] = await Promise.all([
      erc20.balanceOf(walletCredentials),
      erc20.decimals()
    ]);

    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error(`Failed to get token balance for AI${aiNumber}:`, error);
    return 0;
  }
}

/**
 * Get AI Binance wallet address
 */
function getAIBinanceWallet(aiNumber: number): string | undefined {
  switch (aiNumber) {
    case 1: return process.env.NEXT_PUBLIC_AI1_BINANCE_WALLET;
    case 2: return process.env.NEXT_PUBLIC_AI2_BINANCE_WALLET;
    case 3: return process.env.NEXT_PUBLIC_AI3_BINANCE_WALLET;
    case 4: return process.env.NEXT_PUBLIC_AI4_BINANCE_WALLET;
    case 5: return process.env.NEXT_PUBLIC_AI5_BINANCE_WALLET;
    case 6: return process.env.NEXT_PUBLIC_AI6_BINANCE_WALLET;
    default: return undefined;
  }
}

/**
 * Update wallet balances for an AI
 */
async function updateWalletBalances(aiNumber: number, status: AIAutomationStatus): Promise<void> {
  try {
    const binanceWallet = getAIBinanceWallet(aiNumber);
    const { apiKey, apiSecret } = getAIAsterdexCredentials(aiNumber);
    
    const balances = await getAIWalletBalances(
      aiNumber,
      binanceWallet,
      apiKey,
      apiSecret
    );
    
    status.binanceBalance = balances.binanceBalance;
    status.asterdexBalance = balances.asterdexBalance;
    status.totalBalance = balances.totalBalance;
    
  // Keep initial balance at $1900 baseline
  if (!status.initialBalance) {
    status.initialBalance = 1900;
  }
  
  // Calculate P&L as simple difference from $1900 baseline
  status.totalPnL = status.totalBalance - 1900;
  status.totalPnLPercent = (status.totalPnL / 1900) * 100;
  } catch (error: any) {
    console.error(`Failed to update wallet balances for AI${aiNumber}:`, error.message);
  }
}

/**
 * Update PnL for Asterdex positions
 */
async function updateAsterdexPositionsPnL(aiNumber: number, status: AIAutomationStatus): Promise<void> {
  try {
    const { apiKey, apiSecret } = getAIAsterdexCredentials(aiNumber);
    if (!apiKey || !apiSecret) return;
    
    const trader = new AsterdexTrader(apiKey, apiSecret);
    const positions = await trader.getPositions();
    
    // Update P&L for each active trade
    for (const trade of status.asterTrades) {
      if (trade.status === 'active' && trade.symbol) {
        const position = positions.find(p => p.symbol === trade.symbol);
        if (position) {
          const unrealizedPnL = position.unRealizedProfit || 0;
          const markPrice = position.markPrice || 0;
          
          // Update trade with current data
          trade.unrealizedPnL = unrealizedPnL;
          trade.currentPrice = markPrice;
          
          // Check if position is closed
          if ((position.positionAmt || 0) === 0) {
            trade.status = 'closed';
            trade.exitPrice = markPrice;
            trade.realizedPnL = unrealizedPnL;
          }
        }
      }
    }
    
    // Calculate total Asterdex P&L
    status.totalAsterPnL = status.asterTrades.reduce((sum, trade) => {
      if (trade.status === 'active') {
        return sum + (trade.unrealizedPnL || 0);
      } else if (trade.status === 'closed') {
        return sum + (trade.realizedPnL || 0);
      }
      return sum;
    }, 0);
    
  } catch (error: any) {
    console.error(`Failed to update Asterdex P&L for AI${aiNumber}:`, error.message);
  }
}

/**
 * Update PnL for BNB token positions
 */
async function updateBNBPositionPnL(position: BNBTokenPosition): Promise<void> {
  try {
    const balance = await getTokenBalance(position.aiNumber, position.tokenAddress);
    position.tokenBalance = balance;

    // For now, we'll track PnL based on whether we still hold tokens
    // In production, you'd fetch current price from DEX
    if (balance > 0) {
      position.status = 'active';
      // Simplified PnL - would need actual price feeds
      position.unrealizedPnL = 0; // Placeholder
      position.unrealizedPnLPercent = 0;
    } else {
      position.status = 'sold';
    }
  } catch (error) {
    console.error('Failed to update BNB position PnL:', error);
  }
}

/**
 * Single AI trading cycle
 */
async function runAICycle(aiNumber: number): Promise<void> {
  const status = automationState.get(aiNumber) || initializeAIStatus(aiNumber);
  
  try {
    logger.log(`CYCLE_START Success=${status.successCount} Failed=${status.failureCount}`, 'INFO', aiNumber);
    
    // DISABLED: BNB buying functionality - focusing only on Asterdex trading
    // Skip directly to Asterdex trading
    logger.log('Focusing on Asterdex leverage trades only', 'INFO', aiNumber);
    await tryAsterdexTrade(aiNumber, status);
    
    // Comment out BNB position updates since we're not trading BNB anymore
    /*
    // Update all BNB position PnLs
    for (const position of status.bnbPositions) {
      if (position.status === 'active') {
        await updateBNBPositionPnL(position);
      }
    }
    */
    
    // Update Asterdex positions P&L
    await updateAsterdexPositionsPnL(aiNumber, status);
    
    // Calculate total BNB PnL
    status.totalBNBPnL = status.bnbPositions.reduce(
      (sum, pos) => sum + (pos.unrealizedPnL || 0),
      0
    );
    
    // Update wallet balances
    await updateWalletBalances(aiNumber, status);
    
    // Simple P&L calculation from $1900 baseline
    const currentBalance = status.totalBalance || 1900;
    status.totalPnL = currentBalance - 1900;
    status.totalPnLPercent = (status.totalPnL / 1900) * 100;
    
    automationState.set(aiNumber, status);
    
    logger.log(`CYCLE_COMPLETE BNB:${status.bnbPositions.length} Aster:${status.asterTrades.length} Balance:$${currentBalance.toFixed(2)} P&L:$${status.totalPnL.toFixed(2)} (${status.totalPnLPercent.toFixed(2)}%)`, 'INFO', aiNumber);
    
  } catch (error: any) {
    logger.log(`CYCLE_ERROR ${error.message}`, 'ERROR', aiNumber);
    status.error = error.message;
    status.failureCount++;
    status.lastAction = `Error: ${error.message}`;
    status.lastActionTime = Date.now();
    automationState.set(aiNumber, status);
  }
}

/**
 * Get AI Asterdex credentials
 */
function getAIAsterdexCredentials(aiNumber: number): { apiKey?: string; apiSecret?: string } {
  switch (aiNumber) {
    case 1: return { apiKey: process.env.NEXT_PUBLIC_AI1_ASTERDEX_API_KEY, apiSecret: process.env.NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET };
    case 2: return { apiKey: process.env.NEXT_PUBLIC_AI2_ASTERDEX_API_KEY, apiSecret: process.env.NEXT_PUBLIC_AI2_ASTERDEX_API_SECRET };
    case 3: return { apiKey: process.env.NEXT_PUBLIC_AI3_ASTERDEX_API_KEY, apiSecret: process.env.NEXT_PUBLIC_AI3_ASTERDEX_API_SECRET };
    case 4: return { apiKey: process.env.NEXT_PUBLIC_AI4_ASTERDEX_API_KEY, apiSecret: process.env.NEXT_PUBLIC_AI4_ASTERDEX_API_SECRET };
    case 5: return { apiKey: process.env.NEXT_PUBLIC_AI5_ASTERDEX_API_KEY, apiSecret: process.env.NEXT_PUBLIC_AI5_ASTERDEX_API_SECRET };
    case 6: return { apiKey: process.env.NEXT_PUBLIC_AI6_ASTERDEX_API_KEY, apiSecret: process.env.NEXT_PUBLIC_AI6_ASTERDEX_API_SECRET };
    default: return {};
  }
}

/**
 * Clean up old stop loss orders to prevent "max stop order limit" error
 */
async function cleanupStopOrders(aiNumber: number): Promise<void> {
  try {
    const { apiKey, apiSecret } = getAIAsterdexCredentials(aiNumber);
    if (apiKey && apiSecret) {
      const trader = new AsterdexTrader(apiKey, apiSecret);
      await trader.syncTime();
      
      // Get all open orders
      const openOrders = await trader.getOpenOrders();
      
      // Cancel all stop loss orders (STOP_MARKET orders)
      for (const order of openOrders) {
        if (order.type === 'STOP_MARKET' || order.type === 'STOP') {
          try {
            await trader.cancelOrder(order.symbol, order.orderId);
            console.log(`[CLEANUP] Cancelled old stop order for ${order.symbol}`);
          } catch (e) {
            // Ignore errors, order might already be executed
          }
        }
      }
    }
  } catch (error: any) {
    console.log(`[CLEANUP] Error cleaning stop orders: ${error.message}`);
  }
}

/**
 * Close oldest position if at limit (2 positions max)
 */
async function enforcePositionLimit(aiNumber: number, status: AIAutomationStatus): Promise<void> {
  const activeAsterTrades = status.asterTrades.filter(t => t.status === 'active');
  
  if (activeAsterTrades.length >= 2) {
    logger.log('Position limit reached (2/2), closing oldest position', 'WARN', aiNumber);
    
    // Close the oldest position
    const oldestTrade = activeAsterTrades[0];
    
    try {
      const { apiKey, apiSecret } = getAIAsterdexCredentials(aiNumber);
      if (apiKey && apiSecret) {
        const trader = new AsterdexTrader(apiKey, apiSecret);
        await trader.syncTime();
        await trader.closePosition(oldestTrade.symbol);
        
        oldestTrade.status = 'closed';
        logger.log(`Closed ${oldestTrade.symbol} to make room for new position`, 'INFO', aiNumber);
        
        addJournalEntry(aiNumber, {
          type: 'ASTER_CLOSE',
          symbol: oldestTrade.symbol,
          decision: 'Close position due to limit',
          reasoning: 'Maximum 2 positions enforced, closing oldest to open new trade',
          result: 'CLOSED'
        });
      }
    } catch (error: any) {
      logger.log(`Failed to close position: ${error.message}`, 'ERROR', aiNumber);
    }
  }
}

/**
 * Try to place an Asterdex leverage trade
 */
async function tryAsterdexTrade(aiNumber: number, status: AIAutomationStatus): Promise<void> {
  try {
    logger.log('Initiating Asterdex leverage trade analysis', 'INFO', aiNumber);
    
    // Clean up old stop orders first to prevent "max stop order limit" error
    await cleanupStopOrders(aiNumber);
    
    // Check and enforce position limit
    await enforcePositionLimit(aiNumber, status);
    
    const result = await runAITradingCycle(
      aiNumber,
      ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']
    );
    
    // If result has error indicating API not ready, skip this cycle
    if (result.error && result.error.includes('not ready')) {
      logger.log('API routes not ready, skipping cycle', 'WARN', aiNumber);
      return;
    }
    
    if (result.success && result.decision) {
      logger.log(`ASTERDEX_DECISION ${result.decision.action} ${result.decision.symbol} ${result.decision.leverage}x`, 'INFO', aiNumber);
      
      // Log decision to journal
      addJournalEntry(aiNumber, {
        type: result.decision.action === 'LONG' ? 'ASTER_LONG' : result.decision.action === 'SHORT' ? 'ASTER_SHORT' : 'DECISION',
        symbol: result.decision.symbol,
        decision: `${result.decision.action} ${result.decision.symbol}`,
        reasoning: result.decision.reasoning,
        amount: result.decision.usdAmount,
        leverage: result.decision.leverage,
        stopLoss: result.decision.stopLoss,
        takeProfit: result.decision.takeProfit,
        confidence: result.decision.confidence,
        result: result.result?.success ? 'EXECUTED' : 'FAILED'
      });
      
      if (result.decision.action !== 'HOLD') {
        const trade: AsterTrade = {
          aiNumber,
          aiName: status.aiName,
          symbol: result.decision.symbol,
          action: result.decision.action as 'LONG' | 'SHORT',
          leverage: result.decision.leverage,
          usdAmount: result.decision.usdAmount,
          orderId: result.result?.orderId,
          timestamp: Date.now(),
          entryPrice: result.result?.entryPrice,
          stopLoss: result.decision.stopLoss,
          takeProfit: result.decision.takeProfit,
          status: result.result?.success ? 'active' : 'failed'
        };
        
        status.asterTrades.push(trade);
        status.successCount++;
        status.lastAction = `${result.decision.action} ${result.decision.symbol} ${result.decision.leverage}x`;
        status.lastActionTime = Date.now();
        logger.log(`ASTERDEX_EXECUTED ${result.decision.action} ${result.decision.symbol}`, 'SUCCESS', aiNumber);
        
        // Add journal entry for executed trade
        addJournalEntry(aiNumber, {
          type: result.decision.action === 'LONG' ? 'ASTER_LONG' : 'ASTER_SHORT',
          symbol: result.decision.symbol,
          decision: `${result.decision.action} ${result.decision.symbol}`,
          reasoning: result.decision.reasoning,
          amount: result.decision.usdAmount,
          leverage: result.decision.leverage,
          stopLoss: result.decision.stopLoss,
          takeProfit: result.decision.takeProfit,
          confidence: result.decision.confidence,
          result: 'EXECUTED',
          orderId: result.result?.orderId?.toString()
        });
      } else {
        status.lastAction = 'HOLD - No Asterdex trade placed';
        status.lastActionTime = Date.now();
        logger.log('ASTERDEX_HOLD No trade opportunity detected', 'INFO', aiNumber);
        
        addJournalEntry(aiNumber, {
          type: 'DECISION',
          decision: 'HOLD',
          reasoning: result.decision.reasoning || 'No favorable trading opportunity',
          confidence: result.decision.confidence,
          result: 'HOLD'
        });
      }
    } else {
      logger.log(`ASTERDEX_FAILED ${result.error}`, 'ERROR', aiNumber);
      status.failureCount++;
      status.lastAction = `Asterdex failed: ${result.error}`;
      status.lastActionTime = Date.now();
      
      addJournalEntry(aiNumber, {
        type: 'ERROR',
        decision: 'Trade analysis failed',
        reasoning: result.error || 'Unknown error',
        result: 'ERROR'
      });
    }
  } catch (error: any) {
    logger.log(`ASTERDEX_ERROR ${error.message}`, 'ERROR', aiNumber);
    status.error = error.message;
  }
}

/**
 * Get trade journal for an AI
 */
export function getAIJournal(aiNumber: number) {
  const journal = getJournal();
  return journal.getEntries(aiNumber);
}

/**
 * Get all trade journals
 */
export function getAllJournals() {
  const journal = getJournal();
  const journals = journal.getAllEntries();
  
  // Ensure all 6 AIs have entries
  for (let i = 1; i <= 6; i++) {
    if (!journals[i]) {
      journals[i] = [];
    }
  }
  
  console.log('[DEBUG] getAllJournals called. Entry counts:', 
    Object.entries(journals).map(([ai, entries]) => `AI${ai}:${entries.length}`).join(', '));
  return journals;
}

/**
 * Start automation for a specific AI
 */
export async function startAIAutomation(aiNumber: number, intervalMinutes: number = 3): Promise<void> {
  // Stop existing automation if running
  stopAIAutomation(aiNumber);
  
  const status = automationState.get(aiNumber) || initializeAIStatus(aiNumber);
  status.isRunning = true;
  
  // Update wallet balances on startup
  await updateWalletBalances(aiNumber, status);
  automationState.set(aiNumber, status);
  
  logger.log(`AUTOMATION_STARTED interval=${intervalMinutes}min`, 'SUCCESS', aiNumber);
  
    // Add initial journal entry with actual balance
    addJournalEntry(aiNumber, {
      type: 'DECISION',
      decision: 'Automation started',
      reasoning: `Trading cycle set to ${intervalMinutes} minutes. Starting balance: $${status.totalBalance?.toFixed(2) || '1900'} (Binance: $${status.binanceBalance?.toFixed(2) || '1000'}, Asterdex: $${status.asterdexBalance?.toFixed(2) || '900'}). Target baseline: $1900.`,
      result: 'STARTED'
    });
  
  // Run immediately with error handling
  runAICycle(aiNumber).catch(err => {
    logger.log(`Initial cycle failed: ${err.message}`, 'ERROR', aiNumber);
  });
  
  // Then run on interval with error handling
  const interval = setInterval(() => {
    runAICycle(aiNumber).catch(err => {
      logger.log(`Cycle failed: ${err.message}`, 'ERROR', aiNumber);
    });
  }, intervalMinutes * 60 * 1000);
  
  runningIntervals.set(aiNumber, interval);
}

/**
 * Stop automation for a specific AI
 */
export function stopAIAutomation(aiNumber: number): void {
  const interval = runningIntervals.get(aiNumber);
  if (interval) {
    clearInterval(interval);
    runningIntervals.delete(aiNumber);
  }
  
  const status = automationState.get(aiNumber);
  if (status) {
    status.isRunning = false;
    automationState.set(aiNumber, status);
  }
  
  logger.log('AUTOMATION_STOPPED', 'INFO', aiNumber);
}

/**
 * Start automation for all AIs
 */
export async function startAllAIAutomation(intervalMinutes: number = 3): Promise<void> {
  console.log(`Starting automation for all 6 AIs...`);
  for (let i = 1; i <= 6; i++) {
    // Start with minimal stagger to avoid API rate limits
    setTimeout(async () => {
      await startAIAutomation(i, intervalMinutes);
    }, (i - 1) * 2000); // 2 second stagger instead of 10
  }
}

/**
 * Stop automation for all AIs
 */
export function stopAllAIAutomation(): void {
  console.log(`Stopping automation for all AIs...`);
  for (let i = 1; i <= 6; i++) {
    stopAIAutomation(i);
  }
}

/**
 * Get status for a specific AI
 */
export function getAIStatus(aiNumber: number): AIAutomationStatus {
  return automationState.get(aiNumber) || initializeAIStatus(aiNumber);
}

/**
 * Get status for all AIs
 */
// Track last balance update time globally
let lastBalanceUpdate = 0;

export async function getAllAIStatus(): Promise<AIAutomationStatus[]> {
  const statuses: AIAutomationStatus[] = [];
  
  // Check if enough time has passed since last balance update
  const now = Date.now();
  const shouldUpdateBalances = now - lastBalanceUpdate > 120000; // 2 minutes
  
  for (let i = 1; i <= 6; i++) {
    const status = getAIStatus(i);
    statuses.push(status);
  }
  
  // Only update balances if 2 minutes have passed
  if (shouldUpdateBalances) {
    console.log('[BALANCE] Updating balances (2 minute interval)');
    lastBalanceUpdate = now;
    
    const updatePromises: Promise<void>[] = [];
    for (let i = 1; i <= 6; i++) {
      const status = statuses[i - 1];
      updatePromises.push(
        updateWalletBalances(i, status).catch(err => {
          console.log(`Balance update failed for AI${i}:`, err.message);
        })
      );
    }
    
    // Wait for all balance updates to complete
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
  }
  
  // Return updated statuses
  return statuses.map(s => automationState.get(s.aiNumber) || s);
}

/**
 * Get aggregated statistics from provided statuses
 */
export function getAggregatedStats(allStatuses: AIAutomationStatus[]) {
  return {
    totalAIs: 6,
    runningAIs: allStatuses.filter(s => s.isRunning).length,
    totalBNBPositions: allStatuses.reduce((sum, s) => sum + s.bnbPositions.length, 0),
    activeBNBPositions: allStatuses.reduce(
      (sum, s) => sum + s.bnbPositions.filter(p => p.status === 'active').length,
      0
    ),
    totalAsterTrades: allStatuses.reduce((sum, s) => sum + s.asterTrades.length, 0),
    activeAsterTrades: allStatuses.reduce(
      (sum, s) => sum + s.asterTrades.filter(t => t.status === 'active').length,
      0
    ),
    totalBNBSpent: allStatuses.reduce((sum, s) => sum + s.totalBNBSpent, 0),
    totalBNBPnL: allStatuses.reduce((sum, s) => sum + s.totalBNBPnL, 0),
    totalAsterPnL: allStatuses.reduce((sum, s) => sum + s.totalAsterPnL, 0),
    totalSuccesses: allStatuses.reduce((sum, s) => sum + s.successCount, 0),
    totalFailures: allStatuses.reduce((sum, s) => sum + s.failureCount, 0),
  };
}

