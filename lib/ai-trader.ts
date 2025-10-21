// AI Trading Agent System
// Each AI can trade on both Asterdex (futures) and Binance blockchain (Four.meme tokens)

import { AsterdexTrader } from './asterdex-trader';
import type { FourMemeToken } from './bitquery';

export interface AIConfig {
  id: string;
  name: string;
  color: string;
  logo: string;
  asterdexApiKey: string;
  asterdexApiSecret: string;
  binanceWallet?: string;
  binancePrivateKey?: string;
}

export interface Trade {
  id: string;
  aiId: string;
  timestamp: number;
  platform: 'asterdex' | 'binance';
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  pnl?: number;
  status: 'open' | 'closed' | 'failed';
}

export interface AIPerformance {
  aiId: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  asterdexPnL: number;
  binancePnL: number;
  winRate: number;
  currentEquity: number;
}

export class AITrader {
  public id: string;
  public name: string;
  public color: string;
  public logo: string;
  private asterdexTrader: AsterdexTrader;
  private binanceWallet?: string;
  private binancePrivateKey?: string;
  private trades: Trade[] = [];
  private startingCapital: number = 2000; // Starting capital $2,000

  constructor(config: AIConfig) {
    this.id = config.id;
    this.name = config.name;
    this.color = config.color;
    this.logo = config.logo;
    this.binanceWallet = config.binanceWallet;
    this.binancePrivateKey = config.binancePrivateKey;

    // Initialize Asterdex trader
    this.asterdexTrader = new AsterdexTrader(
      config.asterdexApiKey,
      config.asterdexApiSecret
    );
  }

  async initialize(): Promise<boolean> {
    try {
      console.log(`🤖 Initializing ${this.name}...`);
      await this.asterdexTrader.syncTime();
      const connected = await this.asterdexTrader.testConnectivity();
      
      if (connected) {
        console.log(`✅ ${this.name} connected to Asterdex`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ ${this.name} failed to initialize:`, error);
      return false;
    }
  }

  // ========== ASTERDEX TRADING ==========

  async tradeAsterdex(
    symbol: string,
    side: 'BUY' | 'SELL',
    usdAmount: number
  ): Promise<Trade | null> {
    try {
      console.log(`\n🤖 ${this.name} trading ${symbol} on Asterdex`);
      
      // Get current price
      const price = await this.asterdexTrader.getLastPrice(symbol);
      
      // Calculate quantity with proper precision
      const quantity = await this.asterdexTrader.calculateQuantity(symbol, usdAmount, price);
      
      // Set leverage
      await this.asterdexTrader.setLeverage(symbol, 10);
      
      // Place order
      const order = side === 'BUY'
        ? await this.asterdexTrader.marketBuy(symbol, quantity)
        : await this.asterdexTrader.marketSell(symbol, quantity);

      // Auto set stop loss and take profit
      const slDistance = price * 0.02; // 2%
      const tpDistance = price * 0.04; // 4%
      const stopLoss = side === 'BUY' ? price - slDistance : price + slDistance;
      const takeProfit = side === 'BUY' ? price + tpDistance : price - tpDistance;

      setTimeout(async () => {
        try {
          await this.asterdexTrader.setStopLoss(symbol, stopLoss);
          await this.asterdexTrader.setTakeProfit(symbol, takeProfit);
        } catch (err) {
          console.error('Failed to set SL/TP:', err);
        }
      }, 1000);

      const trade: Trade = {
        id: `${this.id}-${Date.now()}`,
        aiId: this.id,
        timestamp: Date.now(),
        platform: 'asterdex',
        symbol,
        side,
        quantity,
        price,
        status: 'open',
      };

      this.trades.push(trade);
      console.log(`✅ ${this.name} executed Asterdex trade:`, trade);
      
      return trade;
    } catch (error) {
      console.error(`❌ ${this.name} Asterdex trade failed:`, error);
      return null;
    }
  }

  // ========== BINANCE BLOCKCHAIN TRADING (FOUR.MEME) ==========

  async tradeBinanceToken(
    token: FourMemeToken,
    action: 'BUY' | 'SELL',
    usdAmount: number
  ): Promise<Trade | null> {
    try {
      console.log(`\n🤖 ${this.name} trading ${token.name} on Binance blockchain`);
      
      if (!this.binanceWallet || !this.binancePrivateKey) {
        console.error(`❌ ${this.name} has no Binance wallet configured`);
        return null;
      }

      // This is where you'll plug in your Binance blockchain buying logic
      // For now, this is a placeholder that will be replaced
      console.log(`🔄 [PLACEHOLDER] Binance blockchain trade would execute here`);
      console.log(`   Token: ${token.name} (${token.symbol})`);
      console.log(`   Contract: ${token.token}`);
      console.log(`   Action: ${action}`);
      console.log(`   Amount: $${usdAmount}`);
      console.log(`   Wallet: ${this.binanceWallet}`);

      const trade: Trade = {
        id: `${this.id}-${Date.now()}`,
        aiId: this.id,
        timestamp: Date.now(),
        platform: 'binance',
        symbol: token.symbol,
        side: action,
        quantity: 0, // Will be calculated from your logic
        price: token.price || 0,
        status: 'open',
      };

      this.trades.push(trade);
      return trade;
    } catch (error) {
      console.error(`❌ ${this.name} Binance trade failed:`, error);
      return null;
    }
  }

  // ========== AI DECISION MAKING ==========

  /**
   * AI decides whether to trade on Asterdex
   * Override this with your AI's logic
   */
  async shouldTradeAsterdex(): Promise<{ trade: boolean; symbol?: string; side?: 'BUY' | 'SELL' }> {
    // Random decision for now - replace with AI logic
    if (Math.random() > 0.7) {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
      return { trade: true, symbol, side };
    }
    return { trade: false };
  }

  /**
   * AI decides whether to trade a Four.meme token
   * Override this with your AI's logic
   */
  async shouldTradeBinanceToken(token: FourMemeToken): Promise<{ trade: boolean; action?: 'BUY' | 'SELL' }> {
    // Basic logic: buy promising tokens
    if (token.isPromising && token.bondingProgress && token.bondingProgress > 55 && token.bondingProgress < 85) {
      return { trade: true, action: 'BUY' };
    }
    return { trade: false };
  }

  // ========== PERFORMANCE TRACKING ==========

  getPerformance(): AIPerformance {
    const asterdexTrades = this.trades.filter(t => t.platform === 'asterdex');
    const binanceTrades = this.trades.filter(t => t.platform === 'binance');

    const asterdexPnL = asterdexTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const binancePnL = binanceTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalPnL = asterdexPnL + binancePnL;

    const winningTrades = this.trades.filter(t => t.pnl && t.pnl > 0).length;
    const losingTrades = this.trades.filter(t => t.pnl && t.pnl < 0).length;

    return {
      aiId: this.id,
      totalTrades: this.trades.length,
      winningTrades,
      losingTrades,
      totalPnL,
      asterdexPnL,
      binancePnL,
      winRate: this.trades.length > 0 ? (winningTrades / this.trades.length) * 100 : 0,
      currentEquity: this.startingCapital + totalPnL,
    };
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  async getAsterdexBalance(): Promise<number> {
    try {
      const balance = await this.asterdexTrader.getBalance('USDT');
      return typeof balance === 'object' ? (balance.availableBalance || 0) : 0;
    } catch (error) {
      return 0;
    }
  }

  async getAsterdexPositions(): Promise<any[]> {
    try {
      const positions = await this.asterdexTrader.getPositions();
      return Array.isArray(positions) 
        ? positions.filter((p: any) => parseFloat(p.positionAmt) !== 0)
        : [];
    } catch (error) {
      return [];
    }
  }
}

