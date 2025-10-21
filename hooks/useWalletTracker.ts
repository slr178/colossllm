'use client';

import { useEffect, useState } from 'react';
import { fetchSmartWalletBuys, fetchTokenPrice, type WalletBuy } from '@/lib/wallet-tracker';

export interface TrackedToken extends WalletBuy {
  price?: number;
  marketCap?: number;
  volume24h?: number;
  score?: number;
}

export function useWalletTracker() {
  const [trackedTokens, setTrackedTokens] = useState<TrackedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function trackWallets() {
      setIsLoading(true);
      
      try {
        console.log('\n👀 === WALLET TRACKER UPDATE ===');
        console.log('Time:', new Date().toLocaleTimeString());
        console.log('Checking 67 wallets for buys in last 30 minutes...\n');
        
        // Fetch recent buys
        const buys = await fetchSmartWalletBuys();
        
        if (buys.length === 0) {
          console.log('❌ NO RECENT BUYS DETECTED');
          console.log('Either:');
          console.log('  1. No wallet activity in last 15 min');
          console.log('  2. Bitquery quota issue (check for 402 errors above)');
          console.log('  3. All buys filtered out (BNB, invalid tokens)\n');
          setTrackedTokens([]);
          setIsLoading(false);
          return;
        }

        console.log(`🎯 Found ${buys.length} unique tokens!\n`);

        // Show top trending (most wallets buying + most recent)
        console.log(`\n🔥 TRENDING TOKENS (sorted by activity):\n`);

        // Enrich with current price/market cap (only top 10 to save quota)
        const enriched: TrackedToken[] = [];

        for (const buy of buys.slice(0, 10)) {
          const age = (Date.now() - new Date(buy.timestamp).getTime()) / 60000;
          console.log(`${buy.walletCount}x 👀 ${buy.tokenName} (${buy.tokenSymbol}) - ${age.toFixed(1)}min ago`);
          
          const priceData = await fetchTokenPrice(buy.tokenContract);
          
          if (priceData) {
            enriched.push({
              ...buy,
              ...priceData,
            });
            
            console.log(`      💰 Cap: $${(priceData.marketCap / 1000).toFixed(1)}K | Vol: $${priceData.volume24h.toFixed(0)}`);
          }

          await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit
        }

        // Already sorted by trending (wallet count + recency)
        setTrackedTokens(enriched);
        
        if (enriched.length > 0) {
          console.log(`\n🎯 TOP PICK: ${enriched[0].tokenName} (${enriched[0].walletCount}x wallets, ${((Date.now() - new Date(enriched[0].timestamp).getTime()) / 60000).toFixed(1)}min ago)\n`);
        }
        
      } catch (err: any) {
        console.error('❌ Wallet tracking failed:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    // Track immediately
    trackWallets();

    // Re-track every 2 minutes (to catch fresh buys faster)
    const interval = setInterval(trackWallets, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    trackedTokens,
    isLoading,
    error,
  };
}

