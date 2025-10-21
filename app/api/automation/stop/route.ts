// API Route: Stop AI automation
import { NextRequest } from 'next/server';
import { stopAIAutomation, stopAllAIAutomation, getAIStatus } from '@/lib/ai-automation';
import { AsterdexTrader } from '@/lib/asterdex-trader';
import { logger } from '@/lib/automation-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aiNumber, stopAll = false, closePositions = false } = body;

    if (stopAll) {
      await stopAllAIAutomation();
      
      if (closePositions) {
        console.log('Closing all positions for all AIs...');
        
        // Import the closeAllPositions function dynamically to avoid circular deps
        const { closeAllPositions } = await import('@/lib/shutdown-handler');
        await closeAllPositions();
        
        return Response.json({
          success: true,
          message: 'Stopped automation and closed all positions for all AIs'
        });
      }
      
      return Response.json({
        success: true,
        message: 'Stopped automation for all AIs'
      });
    }

    if (!aiNumber || aiNumber < 1 || aiNumber > 6) {
      return Response.json(
        { success: false, error: 'Invalid AI number (must be 1-6)' },
        { status: 400 }
      );
    }

    stopAIAutomation(aiNumber);

    if (closePositions) {
      console.log(`Closing positions for AI${aiNumber}...`);
      
      const status = getAIStatus(aiNumber);
      const activeAsterTrades = status.asterTrades.filter(t => t.status === 'active');
      
      if (activeAsterTrades.length > 0) {
        const apiKey = process.env[`NEXT_PUBLIC_AI${aiNumber}_ASTERDEX_API_KEY`];
        const apiSecret = process.env[`NEXT_PUBLIC_AI${aiNumber}_ASTERDEX_API_SECRET`];
        
        if (apiKey && apiSecret) {
          const trader = new AsterdexTrader(apiKey, apiSecret);
          
          for (const trade of activeAsterTrades) {
            try {
              const result = await trader.closePosition(trade.symbol);
              console.log(`Closed ${trade.symbol} for AI${aiNumber}:`, result);
              logger.log(`MANUAL STOP: Closed ${trade.action} ${trade.symbol}`, 'INFO', aiNumber);
            } catch (error: any) {
              console.error(`Failed to close ${trade.symbol} for AI${aiNumber}:`, error);
              logger.log(`MANUAL STOP: Failed to close ${trade.symbol}: ${error.message}`, 'ERROR', aiNumber);
            }
          }
        }
      }
      
      return Response.json({
        success: true,
        message: `Stopped automation and closed positions for AI${aiNumber}`,
        aiNumber,
        positionsClosed: activeAsterTrades.length
      });
    }

    return Response.json({
      success: true,
      message: `Stopped automation for AI${aiNumber}`,
      aiNumber
    });

  } catch (error: any) {
    console.error('Stop automation error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

