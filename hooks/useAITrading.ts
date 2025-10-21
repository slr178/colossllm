'use client';

import { useEffect, useState } from 'react';
import { getAIManager } from '@/lib/ai-manager';
import type { AITrader } from '@/lib/ai-trader';

export function useAITrading(promisingTokens: any[] = []) {
  const [traders, setTraders] = useState<AITrader[]>([]);
  const [performances, setPerformances] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    const manager = getAIManager();
    
    // Initialize all traders
    manager.initializeAll().then(() => {
      setTraders(manager.getAllTraders());
      updatePerformances();
    });

    async function updatePerformances() {
      const perfs = await manager.getAllPerformances();
      setPerformances(perfs);
    }

    // Update performances every 10 seconds
    const perfInterval = setInterval(updatePerformances, 10000);

    return () => clearInterval(perfInterval);
  }, []);

  // Run trading cycle every 5 minutes
  useEffect(() => {
    if (traders.length === 0) return;

    const runCycle = async () => {
      setIsRunning(true);
      const manager = getAIManager();
      await manager.runTradingCycle(promisingTokens);
      setCycleCount((prev) => prev + 1);
      setIsRunning(false);

      // Update performances after trading
      const perfs = await manager.getAllPerformances();
      setPerformances(perfs);
    };

    // Run immediately
    runCycle();

    // Then every 5 minutes
    const interval = setInterval(runCycle, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [traders, promisingTokens]);

  return {
    traders,
    performances,
    isRunning,
    cycleCount,
  };
}

