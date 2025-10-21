#!/usr/bin/env node

// Test different leverage values to see what Asterdex supports

async function testLeverage() {
  const leveragesToTest = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  
  console.log('Testing Asterdex leverage values...');
  console.log('=====================================');
  
  for (const leverage of leveragesToTest) {
    try {
      const response = await fetch('http://localhost:3000/api/automation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiNumber: 1,
          intervalMinutes: 999, // Set high to avoid actual trading
          testLeverage: leverage
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✓ ${leverage}x - SUPPORTED`);
      } else {
        console.log(`✗ ${leverage}x - NOT SUPPORTED`);
      }
    } catch (error) {
      console.log(`? ${leverage}x - Error testing: ${error.message}`);
    }
  }
  
  console.log('\nNote: This is a quick test. Actual results may vary by trading pair.');
}

// Run the test
testLeverage().catch(console.error);
