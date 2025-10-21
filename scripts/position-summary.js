// Quick position summary script
const http = require('http');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function checkPositions() {
  console.log('\n📊 POSITION SUMMARY\n');
  
  try {
    const data = await fetchJSON('http://localhost:3000/api/automation/status');
    
    if (data.success) {
      console.log('AI Status Overview:');
      console.log('─────────────────────────────────────────');
      
      let hasActivePositions = false;
      
      data.statuses.forEach((status, idx) => {
        const activeAsterTrades = (status.asterTrades || []).filter(t => t.status === 'active');
        const activeBNBPositions = (status.bnbPositions || []).filter(p => p.status === 'active');
        
        console.log(`\nAI${status.aiNumber} (${status.aiName}):`);
        console.log(`  Status: ${status.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}`);
        console.log(`  Balance: $${(status.totalBalance || 0).toFixed(2)}`);
        console.log(`  Aster Positions: ${activeAsterTrades.length}`);
        console.log(`  BNB Positions: ${activeBNBPositions.length}`);
        
        if (activeAsterTrades.length > 0 || activeBNBPositions.length > 0) {
          hasActivePositions = true;
        }
      });
      
      console.log('\n─────────────────────────────────────────');
      console.log(`\nSummary: ${data.aggregated.runningAIs} of ${data.aggregated.totalAIs} AIs running`);
      console.log(`Active positions: ${data.aggregated.activeAsterTrades} Aster, ${data.aggregated.activeBNBPositions} BNB`);
      
      if (!hasActivePositions) {
        console.log('\n⚠️  No active positions found!');
        console.log('\nTo create positions for testing:');
        console.log('1. Start the AIs from the AI Arena page');
        console.log('2. Wait for them to make trades (3 minute intervals)');
        console.log('3. Then you can test closing positions');
      }
    }
  } catch (error) {
    console.error('Error fetching status:', error.message);
  }
}

checkPositions();
