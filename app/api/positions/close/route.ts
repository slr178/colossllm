// API Route: Close a specific position
import { NextRequest } from 'next/server';
import { AsterdexTrader } from '@/lib/asterdex-trader';

export async function POST(request: NextRequest) {
  try {
    const { aiNumber, symbol } = await request.json();
    
    if (!aiNumber || !symbol) {
      return Response.json(
        { success: false, error: 'Missing required fields: aiNumber, symbol' },
        { status: 400 }
      );
    }
    
    const apiKey = process.env[`ASTERDEX_API_KEY_${aiNumber}`];
    const apiSecret = process.env[`ASTERDEX_API_SECRET_${aiNumber}`];
    
    if (!apiKey || !apiSecret) {
      return Response.json(
        { success: false, error: `No API credentials for AI${aiNumber}` },
        { status: 400 }
      );
    }
    
    const trader = new AsterdexTrader(apiKey, apiSecret);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Closing position for AI${aiNumber}: ${symbol}`);
    const result = await trader.closePosition(symbol);
    
    if (result && result.orderId) {
      console.log(`✅ Position closed - Order ID: ${result.orderId}`);
      return Response.json({
        success: true,
        orderId: result.orderId,
        message: `Position closed successfully for ${symbol}`
      });
    } else {
      console.error('Failed to close position:', result);
      return Response.json(
        { success: false, error: 'Failed to close position', details: result },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Close position error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
