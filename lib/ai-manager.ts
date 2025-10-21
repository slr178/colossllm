// AI Trading Manager - Coordinates all 5 AI traders

import { AITrader, type AIConfig } from './ai-trader';
import { models } from '@/data/models';

export class AITradingManager {
  private traders: Map<string, AITrader> = new Map();

  constructor() {
    this.initializeTraders();
  }

  private initializeTraders() {
    // Create AI trader instances from environment variables
    const aiConfigs = this.loadAIConfigs();
    
    aiConfigs.forEach((config) => {
      const trader = new AITrader(config);
      this.traders.set(config.id, trader);
    });

    console.log(`🤖 Initialized ${this.traders.size} AI traders`);
  }

  private loadAIConfigs(): AIConfig[] {
    // Load from environment variables
    const configs: AIConfig[] = [];

    // Map models to AI configs
    models.forEach((model, index) => {
      const num = index + 1;
      const apiKey = process.env[`NEXT_PUBLIC_AI${num}_ASTERDEX_API_KEY`];
      const apiSecret = process.env[`NEXT_PUBLIC_AI${num}_ASTERDEX_API_SECRET`];
      const wallet = process.env[`NEXT_PUBLIC_AI${num}_BINANCE_WALLET`];
      const privateKey = process.env[`NEXT_PUBLIC_AI${num}_BINANCE_PRIVATE_KEY`];

      if (apiKey && apiSecret) {
        configs.push({
          id: model.id,
          name: model.name,
          color: model.color,
          logo: model.logo,
          asterdexApiKey: apiKey,
          asterdexApiSecret: apiSecret,
          binanceWallet: wallet,
          binancePrivateKey: privateKey,
        });
      } else {
        console.warn(`⚠️ Missing credentials for AI ${num} (${model.name})`);
      }
    });

    return configs;
  }

  async initializeAll(): Promise<void> {
    console.log('🚀 Initializing all AI traders...');
    
    const promises = Array.from(this.traders.values()).map((trader) =>
      trader.initialize()
    );

    await Promise.all(promises);
    console.log('✅ All AI traders initialized');
  }

  getTrader(aiId: string): AITrader | undefined {
    return this.traders.get(aiId);
  }

  getAllTraders(): AITrader[] {
    return Array.from(this.traders.values());
  }

  async getAllPerformances() {
    const traders = this.getAllTraders();
    return traders.map((trader) => ({
      trader: {
        id: trader.id,
        name: trader.name,
        color: trader.color,
        logo: trader.logo,
      },
      performance: trader.getPerformance(),
    }));
  }

  /**
   * Run trading cycle for all AIs
   * This is called periodically to let AIs make trading decisions
   */
  async runTradingCycle(promisingTokens: any[] = []): Promise<void> {
    console.log('\n💼 === AI TRADING CYCLE ===');
    console.log(`Running cycle for ${this.traders.size} AIs`);
    console.log(`Promising tokens available: ${promisingTokens.length}`);

    for (const trader of this.traders.values()) {
      console.log(`\n🤖 ${trader.name} evaluating opportunities...`);

      // 1. Check Asterdex opportunities
      const asterdexDecision = await trader.shouldTradeAsterdex();
      if (asterdexDecision.trade && asterdexDecision.symbol && asterdexDecision.side) {
        console.log(`   💹 ${trader.name} wants to trade ${asterdexDecision.symbol} ${asterdexDecision.side}`);
        await trader.tradeAsterdex(asterdexDecision.symbol, asterdexDecision.side, 100);
      }

      // 2. Check Binance token opportunities
      for (const token of promisingTokens.slice(0, 3)) {
        const binanceDecision = await trader.shouldTradeBinanceToken(token);
        if (binanceDecision.trade && binanceDecision.action) {
          console.log(`   🪙 ${trader.name} wants to ${binanceDecision.action} ${token.name}`);
          await trader.tradeBinanceToken(token, binanceDecision.action, 100);
          break; // Only one token per cycle
        }
      }

      // Small delay between AIs
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('✅ Trading cycle complete\n');
  }
}

// Singleton instance
let managerInstance: AITradingManager | null = null;

export function getAIManager(): AITradingManager {
  if (!managerInstance) {
    managerInstance = new AITradingManager();
  }
  return managerInstance;
}

