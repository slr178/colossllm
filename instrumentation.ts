export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[STARTUP] Server starting, initializing AI automation...');
    
    // Only run on server startup, not during build
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
      // Delay startup to ensure server is ready
      setTimeout(async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          
          console.log('[STARTUP] Starting all AI traders...');
          
          // Start all AIs with 3 minute intervals
          const response = await fetch(`${baseUrl}/api/automation/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              startAll: true, 
              intervalMinutes: 3 
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[STARTUP] All AIs started successfully:', data);
          } else {
            console.error('[STARTUP] Failed to start AIs:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('[STARTUP] Error starting AIs:', error);
          // Retry after 10 seconds if initial attempt fails
          setTimeout(() => {
            console.log('[STARTUP] Retrying AI startup...');
            register();
          }, 10000);
        }
      }, 5000); // Wait 5 seconds for server to be fully ready
    }
  }
}
