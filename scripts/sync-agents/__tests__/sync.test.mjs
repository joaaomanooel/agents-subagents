import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { syncAgents, diffAgents, auditAgents, listAgents } from '../index.mjs';

// readFileSync imported via node:fs at top

// readFileSync imported via node:fs at top

const FIXTURE = `---
name: foo
description: "Use when foo is needed for testing."
mode: subagent
capability: read-only
---
Foo body.`;

function setupFixture() {
  const root = join(tmpdir(), `sync-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(root, 'agents'), { recursive: true });
  writeFileSync(join(root, 'agents', 'foo.md'), FIXTURE);
  return root;
}

test('syncAgents emits to both registered platforms', async () => {
  const root = setupFixture();
  try {
    const result = await syncAgents({ root, dryRun: false });
    assert.equal(result.ok, true);
    const opencodeOut = readFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'utf8');
    const claudeOut = readFileSync(join(root, '.claude', 'agents', 'foo.md'), 'utf8');
    assert.match(opencodeOut, /edit: deny/);
    assert.match(claudeOut, /^name: foo$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('syncAgents is idempotent', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: false });
    const first = readFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'utf8');
    await syncAgents({ root, dryRun: false });
    const second = readFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'utf8');
    assert.equal(first, second);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('syncAgents detects drift in check mode', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: false });
    writeFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'tampered');
    const result = await syncAgents({ root, dryRun: false, checkOnly: true });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'drift');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('syncAgents skips write under dryRun', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: true });
    let exists = true;
    try { readFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'utf8'); } catch { exists = false; }
    assert.equal(exists, false, 'should NOT write files under dryRun');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('listAgents returns array of agents', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: false });
    const rows = listAgents({ root });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'foo');
    assert.equal(rows[0].mode, 'subagent');
    assert.equal(rows[0].capability, 'read-only');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('auditAgents returns declared/inferred sources', async () => {
  const root = join(tmpdir(), `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(root, 'agents'), { recursive: true });
  writeFileSync(join(root, 'agents', 'no-cap.md'), `---
name: no-cap
description: "Use when testing audit and capability is inferred from name."
mode: subagent
---
body.`);

  try {
    const rows = auditAgents({ root });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].capability, 'code-edit');
    assert.match(rows[0].capabilitySource, /inferred/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('diffAgents produces unified output on first run', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: true });
    const diff = diffAgents({ root });
    assert.match(diff, /\+\+\+ b\//);
    assert.match(diff, /\bopencode\b/);
    assert.match(diff, /\bclaude\b/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('diffAgents is empty when synced', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: false });
    const diff = diffAgents({ root });
    assert.equal(diff, '');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
