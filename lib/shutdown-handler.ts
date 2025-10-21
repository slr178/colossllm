import { stopAllAIAutomation, getAllAIStatus } from './ai-automation';
import { AsterdexTrader } from './asterdex-trader';
import { logger } from './automation-logger';

let isShuttingDown = false;

async function closeAllPositions() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n⚠️  SERVER SHUTDOWN DETECTED - Closing all positions...\n');
  logger.log('EMERGENCY: Server shutdown - closing all positions', 'ERROR', 0);

  try {
    // First, stop all AI automation to prevent new trades
    await stopAllAIAutomation();
    console.log('✅ Stopped all AI automation');

    // Get all AI statuses to find active positions
    const allStatuses = await getAllAIStatus();
    
    for (const status of allStatuses) {
      const aiNumber = status.aiNumber;
      const activeAsterTrades = status.asterTrades.filter(t => t.status === 'active');
      
      if (activeAsterTrades.length === 0) {
        console.log(`AI${aiNumber}: No active positions to close`);
        continue;
      }

      // Get API credentials for this AI
      const apiKey = process.env[`NEXT_PUBLIC_AI${aiNumber}_ASTERDEX_API_KEY`];
      const apiSecret = process.env[`NEXT_PUBLIC_AI${aiNumber}_ASTERDEX_API_SECRET`];

      if (!apiKey || !apiSecret) {
        console.error(`AI${aiNumber}: Missing Asterdex credentials - cannot close positions!`);
        logger.log(`Missing credentials - ${activeAsterTrades.length} positions left open!`, 'ERROR', aiNumber);
        continue;
      }

      // Initialize trader for this AI
      const trader = new AsterdexTrader(apiKey, apiSecret);

      // Close each active position
      for (const trade of activeAsterTrades) {
        try {
          console.log(`AI${aiNumber}: Closing ${trade.action} ${trade.symbol} position...`);
          
          const result = await trader.closePosition(trade.symbol);
          
          if (result.orderId) {
            console.log(`✅ AI${aiNumber}: Closed ${trade.symbol} - Order ID: ${result.orderId}`);
            logger.log(`SHUTDOWN: Closed ${trade.action} ${trade.symbol} position`, 'INFO', aiNumber);
          } else {
            console.error(`❌ AI${aiNumber}: Failed to close ${trade.symbol}:`, result);
            logger.log(`SHUTDOWN: Failed to close ${trade.symbol}: ${JSON.stringify(result)}`, 'ERROR', aiNumber);
          }
        } catch (error: any) {
          console.error(`❌ AI${aiNumber}: Error closing ${trade.symbol}:`, error.message);
          logger.log(`SHUTDOWN: Error closing ${trade.symbol}: ${error.message}`, 'ERROR', aiNumber);
        }
      }
    }

    console.log('\n✅ Shutdown process complete\n');
    logger.log('SHUTDOWN: All positions closed successfully', 'INFO', 0);

  } catch (error: any) {
    console.error('❌ Error during shutdown:', error);
    logger.log(`SHUTDOWN ERROR: ${error.message}`, 'ERROR', 0);
  }

  // Give some time for orders to be processed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  process.exit(0);
}

// Register shutdown handlers
export function registerShutdownHandlers() {
  // Handle Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n\nReceived SIGINT (Ctrl+C)');
    await closeAllPositions();
  });

  // Handle termination signal
  process.on('SIGTERM', async () => {
    console.log('\n\nReceived SIGTERM');
    await closeAllPositions();
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    logger.log(`UNCAUGHT EXCEPTION: ${error.message}`, 'ERROR', 0);
    await closeAllPositions();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logger.log(`UNHANDLED REJECTION: ${reason}`, 'ERROR', 0);
    // Don't close positions for unhandled rejections - they might be recoverable
  });

  console.log('🛡️  Shutdown handlers registered - positions will be closed on exit');
}

// Export for manual triggering if needed
export { closeAllPositions };
