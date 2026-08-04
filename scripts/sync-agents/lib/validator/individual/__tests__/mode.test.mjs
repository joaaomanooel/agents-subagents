import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modeValidator } from '../mode.mjs';

test('rejects invalid mode', () => {
  const result = modeValidator({ mode: 'god-mode' });
  assert.ok(result.errors.some((e) => e.code === 'mode-invalid'));
});

test('accepts primary', () => {
  const result = modeValidator({ mode: 'primary' });
  assert.equal(result.errors.length, 0);
});

test('accepts subagent', () => {
  const result = modeValidator({ mode: 'subagent' });
  assert.equal(result.errors.length, 0);
});

test('accepts all', () => {
  const result = modeValidator({ mode: 'all' });
  assert.equal(result.errors.length, 0);
});

test('omitted mode is fine', () => {
  const result = modeValidator({});
  assert.equal(result.errors.length, 0);
});
