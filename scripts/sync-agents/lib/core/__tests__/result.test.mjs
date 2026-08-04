import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ok, err, isOk } from '../result.mjs';

test('ok creates a success result', () => {
  const r = ok({ x: 1 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { x: 1 });
});

test('err creates a failure result', () => {
  const r = err(new Error('boom'));
  assert.equal(r.ok, false);
  assert.equal(r.error.message, 'boom');
});

test('isOk returns true for ok results', () => {
  assert.equal(isOk(ok(1)), true);
});

test('isOk returns false for err results', () => {
  assert.equal(isOk(err(new Error())), false);
});

test('isOk returns false for falsy values', () => {
  assert.equal(isOk(null), false);
  assert.equal(isOk(undefined), false);
});
