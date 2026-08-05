import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createContext, readContext, updatePhase, recordOutput, markPhaseDone,
} from '../context.mjs';

function tmpRoot() {
  return join(tmpdir(), `ctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

test('createContext writes a context file', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    const result = createContext({
      root,
      feature: 'user-auth',
      goal: 'Add login',
      team: 'feature-team-pilot',
    });
    assert.equal(result.ok, true);
    const path = join(root, '.docs', 'active', 'user-auth.md');
    assert.ok(existsSync(path));
    const content = readFileSync(path, 'utf8');
    assert.match(content, /feature: user-auth/);
    assert.match(content, /team: feature-team-pilot/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('readContext returns parsed context', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    createContext({ root, feature: 'feature-x', goal: 'Test', team: 'feature-team-pilot' });
    const ctx = readContext({ root, feature: 'feature-x' });
    assert.equal(ctx.ok, true);
    assert.equal(ctx.value.data.team, 'feature-team-pilot');
    assert.equal(ctx.value.data.phase, '1-plan');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('updatePhase changes phase', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    createContext({ root, feature: 'f', goal: 'g', team: 't' });
    updatePhase({ root, feature: 'f', phase: '2-impl' });
    const ctx = readContext({ root, feature: 'f' });
    assert.equal(ctx.value.data.phase, '2-impl');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('recordOutput appends to Outputs section', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    createContext({ root, feature: 'f', goal: 'g', team: 't' });
    recordOutput({ root, feature: 'f', agent: 'alpha', output: 'plan result here' });
    const ctx = readContext({ root, feature: 'f' });
    assert.match(ctx.value.body, /### alpha/);
    assert.match(ctx.value.body, /plan result here/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('markPhaseDone checks checkbox in phase', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    createContext({ root, feature: 'f', goal: 'g', team: 't' });
    markPhaseDone({ root, feature: 'f', phase: '1-plan', agent: 'implementation-planner' });
    const ctx = readContext({ root, feature: 'f' });
    assert.match(ctx.value.body, /## Phase 1: Plan/);
    assert.match(ctx.value.body, /- \[x\] implementation-planner/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('readContext returns error for missing feature', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    const result = readContext({ root, feature: 'nonexistent' });
    assert.equal(result.ok, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
