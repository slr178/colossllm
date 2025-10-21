#!/usr/bin/env ts-node

/**
 * Emergency script to close all open positions
 * Run with: npx ts-node scripts/close-all-positions.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { closeAllPositions } from '../lib/shutdown-handler';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('\n🚨 EMERGENCY POSITION CLOSURE 🚨\n');
console.log('This will close ALL open positions for ALL AIs.');
console.log('Press Ctrl+C in the next 5 seconds to cancel...\n');

setTimeout(async () => {
  console.log('Starting position closure...\n');
  await closeAllPositions();
}, 5000);
