import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCli } from '../cli.mjs';

test('parseCli defaults to sync mode', () => {
  const result = parseCli([]);
  assert.equal(result.mode, 'sync');
});

test('parseCli handles --check', () => {
  assert.equal(parseCli(['--check']).mode, 'check');
});

test('parseCli handles --agent=name', () => {
  assert.equal(parseCli(['--agent=foo']).agent, 'foo');
});

test('parseCli rejects unknown flag', () => {
  assert.throws(() => parseCli(['--made-up']), /unknown flag/);
});

test('parseCli parses --debounce', () => {
  assert.equal(parseCli(['--debounce=500']).debounce, 500);
});
