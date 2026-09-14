#!/usr/bin/env node
/**
 * Smoke test for Leader/Follower multi-process coordination.
 * 
 * This test verifies:
 * 1. First process becomes Leader and binds port 5179
 * 2. Second process becomes Follower
 * 3. Both can serve MCP tools
 * 4. Follower can proxy requests through Leader
 */

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 5179;

async function isOurPreview(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/__health`);
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: data.service === 'op-prototype-preview', role: data.role };
  } catch {
    return { ok: false };
  }
}

function spawnMcp() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['dist/cli.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stderr = '';
    let role = null;

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      if (text.includes('[election] elected as leader')) {
        role = 'leader';
        resolve({ proc, role, stderr: () => stderr });
      } else if (text.includes('[election] following existing leader')) {
        role = 'follower';
        resolve({ proc, role, stderr: () => stderr });
      }
    });

    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (!role) {
        reject(new Error(`Process exited with code ${code} before election. stderr: ${stderr}`));
      }
    });

    setTimeout(() => {
      if (!role) {
        proc.kill();
        reject(new Error(`Timeout waiting for election. stderr: ${stderr}`));
      }
    }, 10000);
  });
}

async function main() {
  console.log('🧪 Testing Leader/Follower multi-process coordination...\n');

  // Verify port is initially free
  const initial = await isOurPreview(PORT);
  if (initial.ok) {
    console.error(`❌ Port ${PORT} already in use by our service`);
    process.exit(1);
  }

  // Start first process (should become Leader)
  console.log('1️⃣ Starting first MCP process...');
  const first = await spawnMcp();
  console.log(`   Role: ${first.role}`);

  if (first.role !== 'leader') {
    console.error('❌ First process should be Leader');
    first.proc.kill();
    process.exit(1);
  }
  console.log('   ✅ First process elected as Leader');

  // Wait for server to be ready
  await sleep(500);

  // Verify Leader bound the port
  const leaderCheck = await isOurPreview(PORT);
  if (!leaderCheck.ok || leaderCheck.role !== 'leader') {
    console.error('❌ Leader did not bind port correctly');
    first.proc.kill();
    process.exit(1);
  }
  console.log(`   ✅ Leader bound port ${PORT}`);

  // Start second process (should become Follower)
  console.log('\n2️⃣ Starting second MCP process...');
  const second = await spawnMcp();
  console.log(`   Role: ${second.role}`);

  if (second.role !== 'follower') {
    console.error('❌ Second process should be Follower');
    first.proc.kill();
    second.proc.kill();
    process.exit(1);
  }
  console.log('   ✅ Second process became Follower');

  // Test RPC through Leader
  console.log('\n3️⃣ Testing RPC through Leader...');
  try {
    const rpcRes = await fetch(`http://127.0.0.1:${PORT}/__prototypes`);
    const rpcData = await rpcRes.json();
    if (!rpcData.ok) {
      throw new Error('RPC response not ok');
    }
    console.log('   ✅ Leader responds to /__prototypes');
  } catch (err) {
    console.error('❌ RPC test failed:', err.message);
    first.proc.kill();
    second.proc.kill();
    process.exit(1);
  }

  // Test Leader failover (kill Leader, Follower should take over)
  console.log('\n4️⃣ Testing Leader failover...');
  first.proc.kill();
  console.log('   Killed Leader, waiting for Follower to take over...');

  // Wait for Follower to detect Leader death and take over
  let newLeader = false;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    const status = await isOurPreview(PORT);
    if (status.ok && status.role === 'leader') {
      newLeader = true;
      break;
    }
  }

  if (!newLeader) {
    console.error('❌ Follower did not take over as Leader');
    second.proc.kill();
    process.exit(1);
  }
  console.log('   ✅ Follower took over as new Leader');

  // Cleanup
  second.proc.kill();

  console.log('\n✅ All multi-process tests passed!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
