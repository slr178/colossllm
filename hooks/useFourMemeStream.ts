'use client';

import { useEffect, useState } from 'react';
import type { FourMemeToken } from '@/lib/bitquery';

export function useFourMemeStream() {
  const [tokens, setTokens] = useState<FourMemeToken[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load mid-stage tokens (55%+ bonding progress) on mount
  useEffect(() => {
    async function loadMidStageTokens() {
      const BITQUERY_TOKEN = process.env.NEXT_PUBLIC_BITQUERY_TOKEN;
      
      console.log('🔍 Environment check:');
      console.log('Token exists:', !!BITQUERY_TOKEN);
      console.log('Token preview:', BITQUERY_TOKEN?.substring(0, 15) + '...');
      
      if (!BITQUERY_TOKEN && !USE_MOCK_DATA) {
        setError('Token not found in environment. Make sure .env.local exists and restart server.');
        setIsBackfilling(false);
        return;
      }

      setIsBackfilling(true);
      try {
        // Use mock data if enabled or quota exhausted
        if (USE_MOCK_DATA) {
          console.log('🎭 Using mock data (API quota mode)...');
          setTokens(mockMidStageTokens);
          console.log(`✅ Loaded ${mockMidStageTokens.length} mock tokens`);
          setIsBackfilling(false);
          return;
        }

        console.log('🎯 Loading mid-stage tokens (60%+ bonding progress)...');
        const midStageTokens = await fetchMidStageTokens();
        
        // Convert to FourMemeToken format
        const formattedTokens: FourMemeToken[] = midStageTokens.map((item: any) => {
          const balance = parseFloat(item.balance || '0');
          const progress = balance > 0 ? 100 - ((balance - 200_000_000) * 100 / 800_000_000) : 0;
          
          return {
            id: item.Currency.SmartContract + '-' + Date.now(),
            creator: '',
            token: item.Currency.SmartContract,
            name: item.Currency.Name || 'Unknown',
            symbol: item.Currency.Symbol || 'N/A',
            totalSupply: '1000000000',
            requestId: '0',
            launchTime: 0,
            launchFee: '0',
            txHash: '',
            blockTime: new Date().toISOString(),
            bondingProgress: progress,
          };
        });

        setTokens(formattedTokens);
        console.log(`✅ Loaded ${formattedTokens.length} mid-stage tokens (60-100% bonding progress)`);
        formattedTokens.forEach(t => {
          console.log(`   🪙 ${t.name} (${t.symbol}) - ${t.bondingProgress?.toFixed(1)}% progress`);
        });
      } catch (err: any) {
        console.error('❌ Failed to load mid-stage tokens:', err);
        console.error('Full error:', err);
        
        // Check if it's a quota issue
        if (err.message.includes('402') || err.message.includes('points limit')) {
          setError('⚠️ Bitquery API quota exceeded. Free tier has limited requests. Upgrade your plan or wait for reset.');
        } else {
          setError(`Failed to load tokens: ${err.message}`);
        }
      } finally {
        setIsBackfilling(false);
      }
    }

    loadMidStageTokens();
  }, []);

  // WebSocket disabled - using wallet tracking instead
  useEffect(() => {
    // Disabled to save WebSocket quota
    setIsConnected(false);
  }, []);

  return { tokens, isConnected, isBackfilling, error };
}

