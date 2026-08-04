import { test } from 'node:test';
import assert from 'node:assert/strict';
import { watchAgents, stopWatch, pruneOrphans } from '../watch.mjs';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncAgents } from '../../../index.mjs';

const FIXTURE = `---
name: foo
description: "Use when foo is needed for testing."
mode: subagent
capability: read-only
---
Foo body.`;

function setupFixture() {
  const root = join(tmpdir(), `watch-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(root, 'agents'), { recursive: true });
  writeFileSync(join(root, 'agents', 'foo.md'), FIXTURE);
  return root;
}

test('pruneOrphans removes files without canonical', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: false });
    writeFileSync(join(root, '.opencode', 'agents', 'orphan.md'), 'orphan');
    writeFileSync(join(root, '.claude', 'agents', 'orphan.md'), 'orphan');

    const removed = pruneOrphans({ root, dryRun: false });
    assert.equal(removed.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('pruneOrphans dryRun does not delete files', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: false });
    writeFileSync(join(root, '.opencode', 'agents', 'orphan.md'), 'orphan');

    pruneOrphans({ root, dryRun: true });
    assert.ok(existsSync(join(root, '.opencode', 'agents', 'orphan.md')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('pruneOrphans skips when output dir does not exist', async () => {
  const root = setupFixture();
  try {
    const removed = pruneOrphans({ root, dryRun: false });
    assert.equal(removed.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('stopWatch is safe when no watcher started', () => {
  stopWatch();
  assert.equal(true, true);
});

test('watchAgents is no-op when agents dir missing', () => {
  const root = join(tmpdir(), `no-agents-${Date.now()}`);
  mkdirSync(root, { recursive: true });
  watchAgents({ root, debounce: 50, onChange: () => {} });
  rmSync(root, { recursive: true, force: true });
});

