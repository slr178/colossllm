// API Route: Check all positions
import { NextRequest } from 'next/server';
import { AsterdexTrader } from '@/lib/asterdex-trader';
import { models } from '@/data/models';

export async function GET(request: NextRequest) {
  try {
    const allPositions: any[] = [];
    
    for (let aiNumber = 1; aiNumber <= 6; aiNumber++) {
      const apiKey = process.env[`ASTERDEX_API_KEY_${aiNumber}`];
      const apiSecret = process.env[`ASTERDEX_API_SECRET_${aiNumber}`];
      
      if (!apiKey || !apiSecret) {
        continue;
      }
      
      try {
        const trader = new AsterdexTrader(apiKey, apiSecret);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const positions = await trader.getPositions();
        
        const activePositions = Array.isArray(positions) 
          ? positions.filter((p: any) => parseFloat(p.positionAmt) !== 0)
          : (positions && parseFloat(positions.positionAmt) !== 0 ? [positions] : []);
        
        if (activePositions.length > 0) {
          activePositions.forEach((pos: any) => {
            allPositions.push({
              aiNumber,
              aiName: models[aiNumber - 1].name,
              symbol: pos.symbol,
              side: parseFloat(pos.positionAmt) > 0 ? 'LONG' : 'SHORT',
              amount: Math.abs(parseFloat(pos.positionAmt)),
              entryPrice: parseFloat(pos.entryPrice),
              markPrice: parseFloat(pos.markPrice || pos.entryPrice),
              pnl: parseFloat(pos.unRealizedProfit || 0)
            });
          });
        }
      } catch (error: any) {
        console.error(`AI${aiNumber}: Error fetching positions:`, error.message);
      }
    }
    
    return Response.json({
      success: true,
      positions: allPositions,
      count: allPositions.length
    });
    
  } catch (error: any) {
    console.error('Check positions error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
