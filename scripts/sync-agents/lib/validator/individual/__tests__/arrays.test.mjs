import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrayFieldsValidator } from '../arrays.mjs';

test('accepts valid string arrays', () => {
  const result = arrayFieldsValidator({ mcp: ['pencil'], skills: ['s1', 's2'] });
  assert.equal(result.errors.length, 0);
});

test('rejects mcp with non-string entries', () => {
  const result = arrayFieldsValidator({ mcp: ['pencil', 42] });
  assert.ok(result.errors.some((e) => e.code === 'mcp-format'));
});

test('rejects skills with non-array value', () => {
  const result = arrayFieldsValidator({ skills: 'just-a-string' });
  assert.ok(result.errors.some((e) => e.code === 'skills-format'));
});

test('omitted arrays are fine', () => {
  const result = arrayFieldsValidator({});
  assert.equal(result.errors.length, 0);
});
