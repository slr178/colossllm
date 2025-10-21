'use client';

import { useState, useCallback } from 'react';
import { AsterdexTrader } from '@/lib/asterdex-trader';

export function useAsterdexTrader() {
  const [trader, setTrader] = useState<AsterdexTrader | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [positions, setPositions] = useState<any[]>([]);

  const initialize = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_ASTERDEX_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_ASTERDEX_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('❌ Asterdex API credentials not configured');
      return false;
    }

    try {
      const traderInstance = new AsterdexTrader(apiKey, apiSecret);
      await traderInstance.syncTime();
      
      const connected = await traderInstance.testConnectivity();
      if (!connected) {
        console.error('❌ Failed to connect to Asterdex');
        return false;
      }

      setTrader(traderInstance);
      setIsInitialized(true);
      
      // Fetch initial balance
      const balanceData = await traderInstance.getBalance('USDT');
      const availableBalance = typeof balanceData === 'object' 
        ? (balanceData.availableBalance || 0)
        : 0;
      setBalance(availableBalance);

      console.log('✅ Asterdex trader initialized');
      console.log(`💰 Available balance: ${availableBalance} USDT`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize trader:', error);
      return false;
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!trader) return;
    
    try {
      const balanceData = await trader.getBalance('USDT');
      const availableBalance = typeof balanceData === 'object' 
        ? (balanceData.availableBalance || 0)
        : 0;
      setBalance(availableBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [trader]);

  const refreshPositions = useCallback(async () => {
    if (!trader) return;
    
    try {
      const pos = await trader.getPositions();
      setPositions(pos.filter((p: any) => parseFloat(p.positionAmt) !== 0));
    } catch (error) {
      console.error('Failed to refresh positions:', error);
    }
  }, [trader]);

  return {
    trader,
    isInitialized,
    balance,
    positions,
    initialize,
    refreshBalance,
    refreshPositions,
  };
}

