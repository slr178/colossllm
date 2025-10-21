// AI-Powered Asterdex Trading System
// Each AI analyzes markets and executes leveraged trades

import { AsterdexTrader, Position } from './asterdex-trader';

export interface AITradeDecision {
  symbol: string;
  action: 'LONG' | 'SHORT' | 'CLOSE' | 'HOLD';
  leverage: number;
  usdAmount: number;
  confidence: number;
  reasoning: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface AITraderConfig {
  aiNumber: number;
  aiName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Get AI Asterdex credentials from environment
 */
function getAIAsterdexCredentials(aiNumber: number): { apiKey?: string; apiSecret?: string } {
  switch (aiNumber) {
    case 1:
      return {
        apiKey: process.env.NEXT_PUBLIC_AI1_ASTERDEX_API_KEY,
        apiSecret: process.env.NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET
      };
    case 2:
      return {
        apiKey: process.env.NEXT_PUBLIC_AI2_ASTERDEX_API_KEY,
        apiSecret: process.env.NEXT_PUBLIC_AI2_ASTERDEX_API_SECRET
      };
    case 3:
      return {
        apiKey: process.env.NEXT_PUBLIC_AI3_ASTERDEX_API_KEY,
        apiSecret: process.env.NEXT_PUBLIC_AI3_ASTERDEX_API_SECRET
      };
    case 4:
      return {
        apiKey: process.env.NEXT_PUBLIC_AI4_ASTERDEX_API_KEY,
        apiSecret: process.env.NEXT_PUBLIC_AI4_ASTERDEX_API_SECRET
      };
    case 5:
      return {
        apiKey: process.env.NEXT_PUBLIC_AI5_ASTERDEX_API_KEY,
        apiSecret: process.env.NEXT_PUBLIC_AI5_ASTERDEX_API_SECRET
      };
    case 6:
      return {
        apiKey: process.env.NEXT_PUBLIC_AI6_ASTERDEX_API_KEY,
        apiSecret: process.env.NEXT_PUBLIC_AI6_ASTERDEX_API_SECRET
      };
    default:
      return { apiKey: undefined, apiSecret: undefined };
  }
}

/**
 * Get AI model API credentials
 */
function getAIModelCredentials(aiNumber: number): { provider: string; apiKey?: string } {
  switch (aiNumber) {
    case 1: // DeepSeek MAX
      return { provider: 'deepseek', apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY };
    case 2: // GPT-5
      return { provider: 'openai', apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY };
    case 3: // GROK-4
      return { provider: 'xai', apiKey: process.env.NEXT_PUBLIC_XAI_API_KEY };
    case 4: // Qwen 3 Max (via OpenRouter)
      return { provider: 'qwen', apiKey: process.env.NEXT_PUBLIC_QWEN_API_KEY };
    case 5: // Gemini 2.5 Pro
      return { provider: 'google', apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY };
    case 6: // Claude 3.5 Sonnet
      return { provider: 'anthropic', apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY };
    default:
      return { provider: 'unknown', apiKey: undefined };
  }
}

/**
 * Get market data for AI analysis
 */
async function getMarketData(trader: AsterdexTrader, symbols: string[]): Promise<any[]> {
  const marketData = [];
  
  for (const symbol of symbols) {
    try {
      const ticker = await trader.getTicker(symbol);
      const price = await trader.getLastPrice(symbol);
      
      marketData.push({
        symbol,
        price,
        priceChange: ticker.priceChange,
        priceChangePercent: ticker.priceChangePercent,
        volume: ticker.volume,
        high24h: ticker.highPrice,
        low24h: ticker.lowPrice,
      });
    } catch (error) {
      console.error(`Failed to get data for ${symbol}:`, error);
    }
  }
  
  return marketData;
}

/**
 * Extract JSON from AI response (handles various formats)
 */
function extractJSON(content: string): string {
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\n?/g, '').replace(/\n?```/g, '');
  
  // Try to find JSON object in the text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }
  
  return cleaned.trim();
}

/**
 * Get base URL for API calls (handles both client and server-side)
 */
function getBaseUrl(): string {
  // Server-side
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
  // Client-side
  return '';
}

/**
 * Ask AI for trading decision
 */
async function getAITradeDecision(
  aiNumber: number,
  marketData: any[],
  currentPositions: Position[],
  balance: number
): Promise<AITradeDecision> {
  const { provider, apiKey } = getAIModelCredentials(aiNumber);
  
  if (!apiKey) {
    throw new Error(`AI model API key not configured for AI${aiNumber}`);
  }
  
  const baseUrl = getBaseUrl();

  const prompt = `You are a professional crypto futures trader. Find trading opportunities and execute with proper risk management. Return ONLY valid JSON.

MARKET DATA:
${JSON.stringify(marketData, null, 2)}

BALANCE: $${balance.toFixed(2)} USDT
ACTIVE POSITIONS: ${currentPositions.length}

REQUIRED JSON FORMAT (ALL FIELDS MANDATORY):
{
  "symbol": "BTCUSDT",
  "action": "LONG|SHORT|CLOSE|HOLD",
  "leverage": 20,
  "usdAmount": 100-300,
  "confidence": 0-100,
  "reasoning": "detailed explanation",
  "stopLoss": number (REQUIRED - specific price),
  "takeProfit": number (REQUIRED - specific price)
}

TRADING RULES:
1. ALWAYS set stopLoss and takeProfit (MANDATORY)
2. Position sizes: $100-$300 (scale with confidence)
3. Leverage: ALWAYS use 20x leverage for all trades
4. Stop loss: 2-3% from entry (CRITICAL with 20x leverage - 5% move = liquidation!)
5. Take profit: 4-8% from entry (2:1 risk/reward minimum)
6. Bearish market = SHORT opportunity with tight stops
7. Bullish market = LONG opportunity
8. High volume + trend = higher confidence

EXAMPLES:
- Downtrend -3%: SHORT at $107,000, SL $109,250 (2.1%), TP $102,750 (4.2%), 20x leverage, $200
- Uptrend +2%: LONG at $108,000, SL $105,500 (2.3%), TP $112,500 (4.2%), 20x leverage, $150

WARNING: Using 20x leverage! A 5% move against position = LIQUIDATION. Set tight stop losses!

BE DECISIVE. Markets always have opportunities. RESPOND WITH VALID JSON ONLY.`;

  try {
    let decision: AITradeDecision;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      console.log('Raw AI response (first 300 chars):', content.substring(0, 300));
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      const cleanContent = extractJSON(content);
      console.log('Cleaned JSON:', cleanContent.substring(0, 200));
      
      try {
        decision = JSON.parse(cleanContent);
      } catch (parseError: any) {
        console.error('JSON parse failed. Full content:', content);
        throw new Error(`Invalid JSON from AI: ${parseError.message}`);
      }
      
    } else if (provider === 'deepseek') {
      console.log('Calling DeepSeek API...');
      console.log('   API Key length:', apiKey?.length || 0);
      console.log('   Prompt preview:', prompt.substring(0, 150) + '...');
      
      const response = await fetch(`${baseUrl}/api/ai/deepseek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          apiKey: apiKey
        })
      });

      // Check if response is JSON or HTML (404 error)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(`API route returned non-JSON (${response.status}). Server may be restarting.`);
      }

      const data = await response.json();
      console.log('DeepSeek API response:', JSON.stringify(data).substring(0, 300));
      
      if (data.error) {
        throw new Error(`DeepSeek API error: ${data.error}`);
      }
      
      const content = data.content || '';
      
      console.log('Raw AI response (first 300 chars):', content.substring(0, 300));
      
      if (!content) {
        throw new Error('Empty response from DeepSeek');
      }
      
      const cleanContent = extractJSON(content);
      console.log('Cleaned JSON:', cleanContent.substring(0, 200));
      
      try {
        decision = JSON.parse(cleanContent);
      } catch (parseError: any) {
        console.error('JSON parse failed. Full content:', content);
        throw new Error(`Invalid JSON from DeepSeek: ${parseError.message}`);
      }
      
    } else if (provider === 'xai') {
      console.log('Calling xAI/Grok API...');
      console.log('   API Key length:', apiKey?.length || 0);
      console.log('   Prompt preview:', prompt.substring(0, 150) + '...');
      
      const response = await fetch(`${baseUrl}/api/ai/xai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          apiKey: apiKey
        })
      });

      const data = await response.json();
      console.log('xAI API response:', JSON.stringify(data).substring(0, 300));
      
      if (data.error) {
        throw new Error(`xAI API error: ${data.error}`);
      }
      
      const content = data.content || '';
      
      console.log('Raw AI response (first 300 chars):', content.substring(0, 300));
      
      if (!content) {
        throw new Error('Empty response from xAI');
      }
      
      const cleanContent = extractJSON(content);
      
      try {
        decision = JSON.parse(cleanContent);
      } catch (parseError: any) {
        console.error('JSON parse failed. Full content:', content);
        throw new Error(`Invalid JSON from xAI: ${parseError.message}`);
      }
      
    } else if (provider === 'qwen') {
      console.log('Calling Qwen API...');
      console.log('   API Key length:', apiKey?.length || 0);
      console.log('   Prompt preview:', prompt.substring(0, 150) + '...');
      
      const response = await fetch(`${baseUrl}/api/ai/qwen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          apiKey: apiKey
        })
      });

      const data = await response.json();
      console.log('Qwen API response:', JSON.stringify(data).substring(0, 300));
      
      if (data.error) {
        throw new Error(`Qwen API error: ${data.error}`);
      }
      
      const content = data.content || '';
      
      console.log('Raw AI response (first 300 chars):', content.substring(0, 300));
      
      if (!content) {
        throw new Error('Empty response from Qwen');
      }
      
      const cleanContent = extractJSON(content);
      
      try {
        decision = JSON.parse(cleanContent);
      } catch (parseError: any) {
        console.error('JSON parse failed. Full content:', content);
        throw new Error(`Invalid JSON from Qwen: ${parseError.message}`);
      }
      
    } else if (provider === 'google') {
      const response = await fetch(`${baseUrl}/api/ai/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          apiKey: apiKey
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Google API error: ${data.error}`);
      }
      
      const content = data.content || '';
      
      console.log('Raw AI response (first 300 chars):', content.substring(0, 300));
      
      if (!content) {
        throw new Error('Empty response from Google');
      }
      
      const cleanContent = extractJSON(content);
      
      try {
        decision = JSON.parse(cleanContent);
      } catch (parseError: any) {
        console.error('JSON parse failed. Full content:', content);
        throw new Error(`Invalid JSON from Google: ${parseError.message}`);
      }
      
    } else if (provider === 'anthropic') {
      console.log('Calling Anthropic/Claude API...');
      console.log('   API Key length:', apiKey?.length || 0);
      console.log('   Prompt preview:', prompt.substring(0, 150) + '...');
      
      const response = await fetch(`${baseUrl}/api/ai/anthropic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          apiKey: apiKey
        })
      });

      const data = await response.json();
      console.log('Anthropic API response:', JSON.stringify(data).substring(0, 300));
      
      if (data.error) {
        throw new Error(`Anthropic API error: ${data.error}`);
      }
      
      const content = data.content || '';
      
      console.log('Raw AI response (first 300 chars):', content.substring(0, 300));
      
      if (!content) {
        throw new Error('Empty response from Anthropic');
      }
      
      const cleanContent = extractJSON(content);
      
      try {
        decision = JSON.parse(cleanContent);
      } catch (parseError: any) {
        console.error('JSON parse failed. Full content:', content);
        throw new Error(`Invalid JSON from Anthropic: ${parseError.message}`);
      }
      
    } else {
      throw new Error(`Unknown AI provider: ${provider}`);
    }

    return decision;
    
  } catch (error: any) {
    console.error(`Failed to get AI decision:`, error.message);
    
    // If API route not ready (404), throw error to retry later
    if (error.message.includes('non-JSON') || error.message.includes('404')) {
      throw new Error('API routes not ready, will retry next cycle');
    }
    
    // Return HOLD decision on other errors
    return {
      symbol: 'BTCUSDT',
      action: 'HOLD',
      leverage: 1,
      usdAmount: 0,
      confidence: 0,
      reasoning: `Error: ${error.message}`
    };
  }
}

/**
 * Get price precision and tick size for a symbol
 */
function getSymbolPrecision(symbol: string): { pricePrecision: number; tickSize: number } {
  // Common symbol precisions for Asterdex
  const precisions: Record<string, { pricePrecision: number; tickSize: number }> = {
    'BTCUSDT': { pricePrecision: 1, tickSize: 0.1 },
    'ETHUSDT': { pricePrecision: 2, tickSize: 0.01 },
    'BNBUSDT': { pricePrecision: 2, tickSize: 0.01 },
    'SOLUSDT': { pricePrecision: 2, tickSize: 0.01 },
    'XRPUSDT': { pricePrecision: 4, tickSize: 0.0001 },
    'DOGEUSDT': { pricePrecision: 5, tickSize: 0.00001 },
    'ADAUSDT': { pricePrecision: 4, tickSize: 0.0001 },
    'AVAXUSDT': { pricePrecision: 3, tickSize: 0.001 },
    'DOTUSDT': { pricePrecision: 3, tickSize: 0.001 },
    'MATICUSDT': { pricePrecision: 4, tickSize: 0.0001 },
  };
  
  return precisions[symbol] || { pricePrecision: 2, tickSize: 0.01 };
}

/**
 * Round price to valid tick size
 */
function roundToTickSize(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize;
}

/**
 * Execute trade based on AI decision
 */
async function executeTrade(
  trader: AsterdexTrader,
  decision: AITradeDecision,
  aiNumber: number
): Promise<{ success: boolean; message: string; orderId?: string; entryPrice?: number }> {
  try {
    console.log(`\nAI${aiNumber} Trade Decision:`);
    console.log(`   Symbol: ${decision.symbol}`);
    console.log(`   Action: ${decision.action}`);
    console.log(`   Leverage: ${decision.leverage}x`);
    console.log(`   Amount: $${decision.usdAmount}`);
    console.log(`   Confidence: ${decision.confidence}%`);
    console.log(`   Stop Loss: ${decision.stopLoss ? `$${decision.stopLoss}` : 'NOT SET'}`);
    console.log(`   Take Profit: ${decision.takeProfit ? `$${decision.takeProfit}` : 'NOT SET'}`);
    console.log(`   Reasoning: ${decision.reasoning}`);
    
    // Safety check: Convert any unsupported leverage to 20x
    if (decision.leverage > 20 || decision.leverage === 30) {
      console.log(`   ⚠️ Converting ${decision.leverage}x to 20x (maximum safe leverage)`);
      decision.leverage = 20;
    }

    // Don't trade if confidence is too low
    // NOTE: Lowered to 40% for testing - increase to 70% for production
    if (decision.confidence < 40) {
      return { 
        success: false, 
        message: `Confidence too low (${decision.confidence}%), skipping trade` 
      };
    }

    // HOLD - do nothing
    if (decision.action === 'HOLD') {
      return { success: true, message: 'Holding position, no action taken' };
    }

    // Validate stop loss and take profit are set
    if (!decision.stopLoss || !decision.takeProfit) {
      console.error('AI failed to set stop loss or take profit!');
      return {
        success: false,
        message: 'Invalid decision: Stop loss and take profit are mandatory'
      };
    }

    // CLOSE - close existing position
    if (decision.action === 'CLOSE') {
      const result = await trader.closePosition(decision.symbol);
      return { 
        success: true, 
        message: `Position closed for ${decision.symbol}`,
        orderId: result.orderId
      };
    }

    // LONG or SHORT - open new position
    const currentPrice = await trader.getLastPrice(decision.symbol);
    
    // Get symbol precision and round prices
    const { pricePrecision, tickSize } = getSymbolPrecision(decision.symbol);
    decision.stopLoss = parseFloat(roundToTickSize(decision.stopLoss, tickSize).toFixed(pricePrecision));
    decision.takeProfit = parseFloat(roundToTickSize(decision.takeProfit, tickSize).toFixed(pricePrecision));
    
    // Validate stop loss makes sense for the trade direction
    if (decision.action === 'LONG' && decision.stopLoss >= currentPrice) {
      console.error('Invalid stop loss for LONG position (should be below entry)');
      return { success: false, message: 'Invalid stop loss placement for LONG' };
    }
    if (decision.action === 'SHORT' && decision.stopLoss <= currentPrice) {
      console.error('Invalid stop loss for SHORT position (should be above entry)');
      return { success: false, message: 'Invalid stop loss placement for SHORT' };
    }
    
    // Set leverage
    await trader.setLeverage(decision.symbol, decision.leverage);
    
    // Calculate quantity
    const quantity = await trader.calculateQuantity(
      decision.symbol,
      decision.usdAmount,
      currentPrice
    );

    // Place market order
    const side = decision.action === 'LONG' ? 'BUY' : 'SELL';
    const order = await trader.placeOrder({
      symbol: decision.symbol,
      side,
      type: 'MARKET',
      quantity
    });

    console.log(`Order placed: ${order.orderId}`);
    console.log(`   Entry Price: $${currentPrice.toFixed(2)}`);
    console.log(`   Position Size: ${quantity} contracts`);
    console.log(`   Notional Value: $${(decision.usdAmount * decision.leverage).toFixed(2)} (${decision.leverage}x leveraged)`);

    // Set stop loss (MANDATORY)
    try {
      await trader.setStopLoss(decision.symbol, decision.stopLoss!, quantity);
      const slDistance = Math.abs(((decision.stopLoss! - currentPrice) / currentPrice) * 100);
      console.log(`Stop Loss set at $${decision.stopLoss!.toFixed(2)} (-${slDistance.toFixed(2)}% from entry)`);
    } catch (error: any) {
      console.error('Failed to set stop loss:', error.message);
    }

    // Set take profit (MANDATORY)
    try {
      await trader.setTakeProfit(decision.symbol, decision.takeProfit!, quantity);
      const tpDistance = Math.abs(((decision.takeProfit! - currentPrice) / currentPrice) * 100);
      console.log(`Take Profit set at $${decision.takeProfit!.toFixed(2)} (+${tpDistance.toFixed(2)}% from entry)`);
    } catch (error: any) {
      console.error('Failed to set take profit:', error.message);
    }

    // Calculate risk/reward ratio
    const riskAmount = Math.abs(currentPrice - decision.stopLoss!) * quantity;
    const rewardAmount = Math.abs(decision.takeProfit! - currentPrice) * quantity;
    const rrRatio = rewardAmount / riskAmount;
    console.log(`Risk/Reward Ratio: 1:${rrRatio.toFixed(2)}`);
    console.log(`   Risk: $${riskAmount.toFixed(2)} | Reward: $${rewardAmount.toFixed(2)}`);


    return {
      success: true,
      message: `${decision.action} position opened for ${decision.symbol}`,
      orderId: order.orderId,
      entryPrice: currentPrice
    };

  } catch (error: any) {
    console.error(`Trade execution failed:`, error);
    return {
      success: false,
      message: `Trade failed: ${error.message}`
    };
  }
}

/**
 * Main AI trading cycle
 */
export async function runAITradingCycle(
  aiNumber: number,
  symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']
): Promise<{
  success: boolean;
  decision?: AITradeDecision;
  result?: { success: boolean; message: string; orderId?: string; entryPrice?: number };
  error?: string;
}> {
  try {
    console.log(`\nStarting AI${aiNumber} trading cycle...`);

    // Get Asterdex credentials
    const { apiKey, apiSecret } = getAIAsterdexCredentials(aiNumber);
    
    if (!apiKey || !apiSecret) {
      return { 
        success: false, 
        error: `Asterdex API credentials not configured for AI${aiNumber}` 
      };
    }

    // Initialize trader
    const trader = new AsterdexTrader(apiKey, apiSecret);
    await trader.syncTime();

    // Test connectivity
    const connected = await trader.testConnectivity();
    if (!connected) {
      return { success: false, error: 'Failed to connect to Asterdex' };
    }

    // Get current balance
    const balanceData = await trader.getBalance('USDT');
    const balanceValue = typeof balanceData === 'object' 
      ? (balanceData.availableBalance || 0)
      : 0;
    
    // Ensure balance is a number
    const balance = typeof balanceValue === 'string' 
      ? parseFloat(balanceValue) 
      : Number(balanceValue || 0);
    
    console.log(`Available balance: $${balance.toFixed(2)} USDT`);

    if (balance < 100) {
      return { success: false, error: 'Insufficient balance (minimum $100 required for trading)' };
    }

    // Get current positions
    const positions = await trader.getPositions();
    const activePositions = positions.filter(p => parseFloat(String(p.positionAmt)) !== 0);
    
    console.log(`Active positions: ${activePositions.length}`);

    // Get market data
    console.log(`Fetching market data for ${symbols.length} symbols...`);
    const marketData = await getMarketData(trader, symbols);

    // Get AI decision
    console.log(`Asking AI for trading decision...`);
    const decision = await getAITradeDecision(aiNumber, marketData, activePositions, balance);

    // Execute trade
    const result = await executeTrade(trader, decision, aiNumber);

    return {
      success: true,
      decision,
      result
    };

  } catch (error: any) {
    console.error(`AI trading cycle failed:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Initialize AI trader and get status
 */
export async function initializeAITrader(aiNumber: number): Promise<{
  success: boolean;
  balance?: number;
  positions?: Position[];
  error?: string;
}> {
  try {
    const { apiKey, apiSecret } = getAIAsterdexCredentials(aiNumber);
    
    if (!apiKey || !apiSecret) {
      return { 
        success: false, 
        error: `Asterdex credentials not configured for AI${aiNumber}` 
      };
    }

    const trader = new AsterdexTrader(apiKey, apiSecret);
    await trader.syncTime();

    const connected = await trader.testConnectivity();
    if (!connected) {
      return { success: false, error: 'Connection failed' };
    }

    const balanceData = await trader.getBalance('USDT');
    const balanceValue = typeof balanceData === 'object' 
      ? (balanceData.availableBalance || 0)
      : 0;
    
    // Ensure balance is a number
    const balance = typeof balanceValue === 'string' 
      ? parseFloat(balanceValue) 
      : Number(balanceValue || 0);

    const positions = await trader.getPositions();
    const activePositions = positions.filter(p => parseFloat(String(p.positionAmt)) !== 0);

    return {
      success: true,
      balance,
      positions: activePositions
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

