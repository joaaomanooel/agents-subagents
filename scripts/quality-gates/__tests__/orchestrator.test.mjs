import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runQualityGate, formatGateReport, GATE_NAMES } from '../orchestrator.mjs';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FIXTURE = `---
name: foo
description: "Use when foo is needed for testing."
mode: subagent
capability: read-only
---
Foo body.`;

function setupFixture() {
  const root = join(tmpdir(), `qg-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(root, 'agents'), { recursive: true });
  writeFileSync(join(root, 'agents', 'foo.md'), FIXTURE);
  return root;
}

test('GATE_NAMES contains expected gates', () => {
  assert.ok(GATE_NAMES.includes('sync-drift'));
  assert.ok(GATE_NAMES.includes('secrets'));
  assert.ok(GATE_NAMES.includes('forbidden-fields'));
  assert.ok(GATE_NAMES.includes('big-o'));
  assert.ok(GATE_NAMES.includes('complexity'));
});

test('runs all gates on a clean fixture', async () => {
  const root = setupFixture();
  try {
    const result = await runQualityGate(root);
    assert.equal(typeof result.ok, 'boolean');
    assert.ok(result.gates['sync-drift']);
    assert.ok(result.gates['forbidden-fields']);
    assert.ok(result.gates.secrets);
    assert.ok(result.gates['big-o']);
    assert.ok(result.gates.complexity);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('flags drift when generated file is tampered', async () => {
  const root = setupFixture();
  try {
    const { syncAgents } = await import('../../sync-agents/index.mjs');
    await syncAgents({ root, dryRun: false });
    writeFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'tampered');
    const result = await runQualityGate(root);
    assert.equal(result.gates['sync-drift'].ok, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('flags secrets in agent body', async () => {
  const root = setupFixture();
  try {
    writeFileSync(
      join(root, 'agents', 'foo.md'),
      FIXTURE.replace('Foo body.', 'Uses key AKIAIOSFODNN7EXAMPLE'),
    );
    const result = await runQualityGate(root);
    assert.equal(result.gates.secrets.ok, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('flags forbidden model: field', async () => {
  const root = setupFixture();
  try {
    writeFileSync(join(root, 'agents', 'foo.md'), FIXTURE.replace('capability: read-only\n---', 'capability: read-only\nmodel: opus\n---'));
    const result = await runQualityGate(root);
    assert.equal(result.gates['forbidden-fields'].ok, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('formatGateReport produces human-readable text', async () => {
  const root = setupFixture();
  try {
    const result = await runQualityGate(root);
    const report = formatGateReport(result);
    assert.match(report, /Quality Gate Report/);
    assert.match(report, /sync-drift/);
    assert.match(report, /OVERALL/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
