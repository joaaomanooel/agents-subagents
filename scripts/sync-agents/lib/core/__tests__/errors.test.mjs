import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatError, exitCodes } from '../errors.mjs';

test('exitCodes are correct integers', () => {
  assert.equal(exitCodes.OK, 0);
  assert.equal(exitCodes.DRIFT, 2);
  assert.equal(exitCodes.ARGS, 3);
});

test('formatError shows path for ENOENT-style errors', () => {
  const err = new Error('not found');
  err.code = 'ENOENT';
  err.path = '/missing/file';
  const msg = formatError(err);
  assert.match(msg, /missing\/file/);
});

test('formatError includes chmod hint for EACCES', () => {
  const err = new Error('denied');
  err.code = 'EACCES';
  const msg = formatError(err);
  assert.match(msg, /chmod/);
});
