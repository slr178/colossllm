#!/usr/bin/env ts-node

/**
 * Script to close a single position for testing
 * Run with: npx ts-node scripts/close-single-position.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { AsterdexTrader } from '../lib/asterdex-trader';
import { models } from '../data/models';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getActivePositions() {
  console.log('\n📊 Checking active positions across all AIs...\n');
  
  const allPositions: any[] = [];
  
  for (let aiNumber = 1; aiNumber <= 6; aiNumber++) {
    const apiKey = process.env[`ASTERDEX_API_KEY_${aiNumber}`];
    const apiSecret = process.env[`ASTERDEX_API_SECRET_${aiNumber}`];
    
    if (!apiKey || !apiSecret) {
      console.log(`❌ AI${aiNumber}: Missing API credentials`);
      continue;
    }
    
    try {
      const trader = new AsterdexTrader(apiKey, apiSecret);
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
            markPrice: parseFloat(pos.markPrice),
            pnl: parseFloat(pos.unRealizedProfit),
            trader
          });
        });
      } else {
        console.log(`AI${aiNumber} (${models[aiNumber - 1].name}): No open positions`);
      }
    } catch (error: any) {
      console.error(`❌ AI${aiNumber}: Error fetching positions:`, error.message);
    }
  }
  
  return allPositions;
}

async function main() {
  console.log('\n🎯 SINGLE POSITION CLOSURE TOOL\n');
  
  const positions = await getActivePositions();
  
  if (positions.length === 0) {
    console.log('\n✨ No open positions found across any AI!\n');
    rl.close();
    return;
  }
  
  console.log('\n📋 Active Positions:\n');
  positions.forEach((pos, index) => {
    const pnlColor = pos.pnl >= 0 ? '\x1b[32m' : '\x1b[31m'; // Green or Red
    const resetColor = '\x1b[0m';
    
    console.log(`${index + 1}. AI${pos.aiNumber} (${pos.aiName})`);
    console.log(`   Symbol: ${pos.symbol}`);
    console.log(`   Side: ${pos.side}`);
    console.log(`   Amount: ${pos.amount}`);
    console.log(`   Entry: $${pos.entryPrice.toFixed(2)}`);
    console.log(`   Mark: $${pos.markPrice.toFixed(2)}`);
    console.log(`   PnL: ${pnlColor}$${pos.pnl.toFixed(2)}${resetColor}`);
    console.log('');
  });
  
  rl.question('Enter position number to close (or "cancel" to exit): ', async (answer) => {
    if (answer.toLowerCase() === 'cancel') {
      console.log('\n❌ Cancelled\n');
      rl.close();
      return;
    }
    
    const posIndex = parseInt(answer) - 1;
    if (isNaN(posIndex) || posIndex < 0 || posIndex >= positions.length) {
      console.log('\n❌ Invalid position number\n');
      rl.close();
      return;
    }
    
    const selectedPos = positions[posIndex];
    console.log(`\n⚠️  Closing position: AI${selectedPos.aiNumber} ${selectedPos.side} ${selectedPos.symbol}`);
    console.log('Press Ctrl+C to cancel...\n');
    
    setTimeout(async () => {
      try {
        console.log('Closing position...');
        const result = await selectedPos.trader.closePosition(selectedPos.symbol);
        
        if (result.orderId) {
          console.log(`\n✅ Position closed successfully!`);
          console.log(`   Order ID: ${result.orderId}`);
          console.log(`   Final PnL: $${selectedPos.pnl.toFixed(2)}\n`);
        } else {
          console.error('\n❌ Failed to close position:', result);
        }
      } catch (error: any) {
        console.error('\n❌ Error closing position:', error.message);
      }
      
      rl.close();
    }, 3000);
  });
}

main().catch(console.error);
