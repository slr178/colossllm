// Simple script to check and close positions
const path = require('path');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const { AsterdexTrader } = require('../lib/asterdex-trader');
const { models } = require('../data/models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getActivePositions() {
  console.log('\n📊 Checking active positions across all AIs...\n');
  
  const allPositions = [];
  
  for (let aiNumber = 1; aiNumber <= 6; aiNumber++) {
    const apiKey = process.env[`ASTERDEX_API_KEY_${aiNumber}`];
    const apiSecret = process.env[`ASTERDEX_API_SECRET_${aiNumber}`];
    
    if (!apiKey || !apiSecret) {
      console.log(`❌ AI${aiNumber}: Missing API credentials`);
      continue;
    }
    
    try {
      const trader = new AsterdexTrader(apiKey, apiSecret);
      // Wait a bit for time sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const positions = await trader.getPositions();
      
      const activePositions = Array.isArray(positions) 
        ? positions.filter(p => parseFloat(p.positionAmt) !== 0)
        : (positions && parseFloat(positions.positionAmt) !== 0 ? [positions] : []);
      
      if (activePositions.length > 0) {
        activePositions.forEach(pos => {
          allPositions.push({
            aiNumber,
            aiName: models[aiNumber - 1].name,
            symbol: pos.symbol,
            side: parseFloat(pos.positionAmt) > 0 ? 'LONG' : 'SHORT',
            amount: Math.abs(parseFloat(pos.positionAmt)),
            entryPrice: parseFloat(pos.entryPrice),
            markPrice: parseFloat(pos.markPrice || pos.entryPrice),
            pnl: parseFloat(pos.unRealizedProfit || 0),
            trader
          });
        });
      } else {
        console.log(`AI${aiNumber} (${models[aiNumber - 1].name}): No open positions`);
      }
    } catch (error) {
      console.error(`❌ AI${aiNumber}: Error fetching positions:`, error.message);
    }
  }
  
  return allPositions;
}

async function main() {
  console.log('\n🎯 POSITION MANAGEMENT TOOL\n');
  
  const positions = await getActivePositions();
  
  if (positions.length === 0) {
    console.log('\n✨ No open positions found across any AI!\n');
    rl.close();
    process.exit(0);
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
    console.log(`   Current: $${pos.markPrice.toFixed(2)}`);
    console.log(`   PnL: ${pnlColor}$${pos.pnl.toFixed(2)}${resetColor}`);
    console.log('');
  });
  
  rl.question('Enter position number to close (or "q" to quit): ', async (answer) => {
    if (answer.toLowerCase() === 'q' || answer.toLowerCase() === 'quit') {
      console.log('\n👋 Goodbye!\n');
      rl.close();
      process.exit(0);
    }
    
    const posIndex = parseInt(answer) - 1;
    if (isNaN(posIndex) || posIndex < 0 || posIndex >= positions.length) {
      console.log('\n❌ Invalid position number\n');
      rl.close();
      process.exit(1);
    }
    
    const selectedPos = positions[posIndex];
    console.log(`\n⚠️  Closing position: AI${selectedPos.aiNumber} ${selectedPos.side} ${selectedPos.symbol}`);
    console.log('Executing in 3 seconds... (Press Ctrl+C to cancel)\n');
    
    setTimeout(async () => {
      try {
        console.log('Closing position...');
        const result = await selectedPos.trader.closePosition(selectedPos.symbol);
        
        if (result && result.orderId) {
          console.log(`\n✅ Position closed successfully!`);
          console.log(`   Order ID: ${result.orderId}`);
          console.log(`   Final PnL: $${selectedPos.pnl.toFixed(2)}\n`);
        } else {
          console.error('\n❌ Failed to close position:', result);
        }
      } catch (error) {
        console.error('\n❌ Error closing position:', error.message);
      }
      
      rl.close();
      process.exit(0);
    }, 3000);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
