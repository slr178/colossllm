// Script to start all AIs
const http = require('http');

function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function startAllAIs() {
  console.log('\n🚀 Starting all AI traders with 40x leverage...\n');
  console.log('⚠️  WARNING: 40x leverage is EXTREMELY HIGH RISK!');
  console.log('   - Small price movements can liquidate positions');
  console.log('   - Use very tight stop losses');
  console.log('   - Monitor positions closely\n');
  
  try {
    const result = await postJSON('/api/automation/start', {
      startAll: true,
      intervalMinutes: 3
    });
    
    if (result.success) {
      console.log('✅ All AIs started successfully!');
      console.log('\nAIs will now:');
      console.log('- Analyze markets every 3 minutes');
      console.log('- Trade with 40x leverage');
      console.log('- Manage positions autonomously');
      console.log('\nMonitor at: http://localhost:3000/automation');
    } else {
      console.error('❌ Failed to start AIs:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Countdown before starting
console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)');
setTimeout(startAllAIs, 3000);
