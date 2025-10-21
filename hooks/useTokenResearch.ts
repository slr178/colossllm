'use client';

import { useEffect, useState, useRef } from 'react';
import { useFourMemeStream } from './useFourMemeStream';
import { fetchTokenMetrics, isPromisingToken, getTokenScore, DEFAULT_CRITERIA, type FilterCriteria } from '@/lib/token-metrics';
import { checkHoneypot } from '@/lib/advanced-filtering';
import type { FourMemeToken } from '@/lib/bitquery';

export interface EnrichedToken extends FourMemeToken {
  score?: number;
  lastUpdated?: number;
}

const ANALYSIS_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function useTokenResearch(criteria: FilterCriteria = DEFAULT_CRITERIA) {
  const { tokens: rawTokens, isConnected, isBackfilling, error } = useFourMemeStream();
  const [enrichedTokens, setEnrichedTokens] = useState<EnrichedToken[]>([]);
  const [promisingTokens, setPromisingTokens] = useState<EnrichedToken[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nextAnalysis, setNextAnalysis] = useState<number>(Date.now() + ANALYSIS_INTERVAL);
  const lastAnalysisRef = useRef<number>(0);

  // Batch analysis every 2 minutes
  useEffect(() => {
    if (isBackfilling) return;

    const runBatchAnalysis = async () => {
      if (rawTokens.length === 0) {
        console.log('⏭️ No tokens to analyze yet');
        return;
      }

      const now = Date.now();
      const timeSinceLastAnalysis = now - lastAnalysisRef.current;

      // Skip if analyzed recently (within 1.5 minutes)
      if (timeSinceLastAnalysis < ANALYSIS_INTERVAL - 30000 && lastAnalysisRef.current > 0) {
        return;
      }

      setIsAnalyzing(true);
      lastAnalysisRef.current = now;
      setNextAnalysis(now + ANALYSIS_INTERVAL);

      console.log(`\n🔬 === SEARCHING FOR BEST TOKEN ===`);
      console.log(`Sifting through ${rawTokens.length} tokens...`);
      console.log(`Looking for: 60%+ bonding, $4K+ volume, <15 min old, no honeypot\n`);

      const enriched: EnrichedToken[] = [];
      let bestToken: EnrichedToken | null = null;
      let bestScore = 0;

      // Analyze all tokens to find THE BEST ONE
      for (const token of rawTokens) {
        try {
          // Silent analysis - only log the winner
          const metrics = await fetchTokenMetrics(token.token);

          if (!metrics) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            continue;
          }

          // Check for honeypot
          const honeypotCheck = await checkHoneypot(token.token);

          // Calculate token age
          const tokenAge = token.blockTime ? Date.now() - new Date(token.blockTime).getTime() : undefined;

          // Apply strict filtering
          const promising = isPromisingToken(metrics, honeypotCheck, criteria, tokenAge);
          const score = getTokenScore(metrics);

          const enrichedToken = {
            ...token,
            ...metrics,
            isPromising: promising,
            score,
            lastUpdated: Date.now(),
          };

          enriched.push(enrichedToken);

          // Track the best promising token
          if (promising && score > bestScore) {
            bestScore = score;
            bestToken = enrichedToken;
          }

          // Small delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (err) {
          // Silent fail - keep searching
        }
      }

      // Display result - ONLY THE BEST TOKEN
      console.log(`\n✅ === SEARCH COMPLETE ===`);
      console.log(`Analyzed: ${enriched.length} tokens`);
      
      if (bestToken) {
        const age = bestToken.blockTime ? (Date.now() - new Date(bestToken.blockTime).getTime()) / 60000 : 0;
        
        console.log(`\n🎯 *** FOUND BEST TOKEN ***`);
        console.log(`Name: ${bestToken.name} (${bestToken.symbol})`);
        console.log(`Contract: ${bestToken.token}`);
        console.log(`Score: ${bestToken.score}/100`);
        console.log(`Market Cap: $${(bestToken.marketCap! / 1000).toFixed(1)}K`);
        console.log(`24h Volume: $${bestToken.volume24h!.toFixed(0)}`);
        console.log(`1h Volume: $${bestToken.volume1h!.toFixed(0)}`);
        console.log(`5min Volume: $${bestToken.volume5m!.toFixed(0)}`);
        console.log(`Bonding Progress: ${bestToken.bondingProgress!.toFixed(1)}%`);
        console.log(`Holders: ${bestToken.holders}`);
        console.log(`Age: ${age.toFixed(1)} minutes`);
        console.log(`\n💎 This is THE token to buy!\n`);
      } else {
        console.log(`\n❌ NO QUALIFYING TOKEN FOUND`);
        console.log(`None met strict criteria: 60%+ bonding, $4K+ volume, <15min old, no honeypot\n`);
      }
      
      console.log(`Next search: ${new Date(now + ANALYSIS_INTERVAL).toLocaleTimeString()}\n`);

      // Only show the BEST token if found
      const promising = bestToken ? [bestToken] : [];
      
      setEnrichedTokens(enriched);
      setPromisingTokens(promising);
      setIsAnalyzing(false);
    };

    // Run immediately if we haven't analyzed yet
    if (lastAnalysisRef.current === 0 && rawTokens.length > 0) {
      runBatchAnalysis();
    }

    // Set up interval for every 2 minutes
    const interval = setInterval(() => {
      runBatchAnalysis();
    }, ANALYSIS_INTERVAL);

    return () => clearInterval(interval);
  }, [rawTokens, isBackfilling, criteria]);

  const secondsUntilNext = Math.max(0, Math.floor((nextAnalysis - Date.now()) / 1000));

  return {
    allTokens: enrichedTokens,
    promisingTokens,
    isConnected,
    isBackfilling,
    isAnalyzing,
    error,
    secondsUntilNext,
  };
}

