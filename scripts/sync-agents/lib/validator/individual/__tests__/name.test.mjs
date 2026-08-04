import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nameValidator } from '../name.mjs';

test('flags missing name', () => {
  const result = nameValidator({});
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].code, 'name-required');
});

test('rejects uppercase name', () => {
  const result = nameValidator({ name: 'BadName' });
  assert.ok(result.errors.some((e) => e.code === 'name-format'));
});

test('rejects underscore in name', () => {
  const result = nameValidator({ name: 'bad_name' });
  assert.ok(result.errors.some((e) => e.code === 'name-format'));
});

test('rejects leading hyphen', () => {
  const result = nameValidator({ name: '-bad-name' });
  assert.ok(result.errors.some((e) => e.code === 'name-format'));
});

test('accepts valid kebab-case name', () => {
  const result = nameValidator({ name: 'good-name-1' });
  assert.equal(result.errors.length, 0);
});
