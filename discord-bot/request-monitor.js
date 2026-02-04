#!/usr/bin/env node
/**
 * UserVault API Request Monitor
 * ==============================
 * Tests all minigame API endpoints and displays results.
 * 
 * Usage:
 *   node request-monitor.js
 *   node request-monitor.js --watch (continuous monitoring)
 */

const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'https://api.uservault.cc/functions/v1';
const GAME_API = `${API_URL}/minigame-data`;
const REWARD_API = `${API_URL}/minigame-reward`;

const WEBHOOK_SECRET = process.env.DISCORD_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;
const TEST_DISCORD_ID = '123456789012345678'; // Fake ID for testing

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSignature(payload) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET || 'test-secret')
    .update(message)
    .digest('hex');
  return { signature, timestamp };
}

async function testEndpoint(name, url, payload, signed = false) {
  const startTime = Date.now();
  
  try {
    const headers = { 'Content-Type': 'application/json' };
    
    if (signed && WEBHOOK_SECRET) {
      const { signature, timestamp } = generateSignature(payload);
      headers['x-webhook-signature'] = signature;
      headers['x-webhook-timestamp'] = timestamp;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    const statusColor = response.ok ? 'green' : 'red';
    
    log(`\n${status} ${name}`, statusColor);
    log(`   URL: ${url}`, 'dim');
    log(`   Status: ${response.status} ${response.statusText}`, 'dim');
    log(`   Duration: ${duration}ms`, 'dim');
    
    if (!response.ok || data.error) {
      log(`   Error: ${data.error || 'Unknown error'}`, 'red');
    } else {
      // Show relevant response data
      const preview = JSON.stringify(data).substring(0, 100);
      log(`   Response: ${preview}${preview.length >= 100 ? '...' : ''}`, 'dim');
    }

    return { success: response.ok && !data.error, duration, status: response.status };
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`\n❌ ${name}`, 'red');
    log(`   URL: ${url}`, 'dim');
    log(`   Error: ${error.message}`, 'red');
    log(`   Duration: ${duration}ms`, 'dim');
    return { success: false, duration, error: error.message };
  }
}

async function runTests() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          UserVault API Request Monitor                     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`\nTimestamp: ${new Date().toISOString()}`, 'dim');
  log(`Webhook Secret: ${WEBHOOK_SECRET ? '✅ Configured' : '⚠️  Not configured (reward tests will fail)'}`, WEBHOOK_SECRET ? 'green' : 'yellow');

  const results = [];

  // ============ GAME API TESTS ============
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim');
  log('📊 GAME API (minigame-data)', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim');

  results.push(await testEndpoint(
    'Get Available Games',
    GAME_API,
    { action: 'get_games' }
  ));

  results.push(await testEndpoint(
    'Get Config',
    GAME_API,
    { action: 'get_config' }
  ));

  results.push(await testEndpoint(
    'Get Trivia Question',
    GAME_API,
    { action: 'get_trivia' }
  ));

  results.push(await testEndpoint(
    'Spin Slots',
    GAME_API,
    { action: 'spin_slots' }
  ));

  results.push(await testEndpoint(
    'Coin Flip',
    GAME_API,
    { action: 'coin_flip' }
  ));

  results.push(await testEndpoint(
    'Play RPS (Rock)',
    GAME_API,
    { action: 'play_rps', choice: 'rock' }
  ));

  results.push(await testEndpoint(
    'Generate Number (Guess Game)',
    GAME_API,
    { action: 'generate_number' }
  ));

  results.push(await testEndpoint(
    'Start Blackjack',
    GAME_API,
    { action: 'start_blackjack', bet: 50 }
  ));

  // ============ REWARD API TESTS ============
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim');
  log('💰 REWARD API (minigame-reward) - Requires WEBHOOK_SECRET', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim');

  if (WEBHOOK_SECRET) {
    results.push(await testEndpoint(
      'Get Balance (Fake User)',
      REWARD_API,
      { action: 'get_balance', discordUserId: TEST_DISCORD_ID },
      true
    ));

    // Note: We don't test add_uv or daily_reward as they modify data
    log('\n   ⚠️  Skipping add_uv and daily_reward (modifies data)', 'yellow');
  } else {
    log('\n   ⚠️  Skipping reward tests - no WEBHOOK_SECRET configured', 'yellow');
  }

  // ============ SUMMARY ============
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim');
  log('📈 SUMMARY', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = Math.round(results.reduce((a, b) => a + b.duration, 0) / results.length);

  log(`\n   Total Tests: ${results.length}`, 'dim');
  log(`   ✅ Passed: ${passed}`, passed > 0 ? 'green' : 'dim');
  log(`   ❌ Failed: ${failed}`, failed > 0 ? 'red' : 'dim');
  log(`   ⏱️  Avg Response: ${avgDuration}ms`, 'dim');

  if (failed === 0) {
    log('\n   🎉 All tests passed!', 'green');
  } else {
    log(`\n   ⚠️  ${failed} test(s) failed - check details above`, 'yellow');
  }

  return { passed, failed, avgDuration };
}

async function watchMode() {
  const interval = 30000; // 30 seconds
  
  log('\n🔄 Watch mode enabled - refreshing every 30 seconds', 'cyan');
  log('   Press Ctrl+C to stop\n', 'dim');
  
  while (true) {
    await runTests();
    log(`\n⏳ Next check in ${interval / 1000} seconds...`, 'dim');
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// Main
(async () => {
  const watchArg = process.argv.includes('--watch') || process.argv.includes('-w');
  
  if (watchArg) {
    await watchMode();
  } else {
    await runTests();
    log('\n💡 Tip: Use --watch for continuous monitoring\n', 'dim');
  }
})();
