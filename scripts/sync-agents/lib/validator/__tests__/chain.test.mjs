import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ValidatorChain } from '../chain.mjs';

test('empty chain returns no errors or warnings', () => {
  const chain = new ValidatorChain();
  const result = chain.run({ name: 'foo' });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('chain returns size 0 when empty', () => {
  const chain = new ValidatorChain();
  assert.equal(chain.size, 0);
});

test('chain.add returns the chain for fluent style', () => {
  const chain = new ValidatorChain();
  const result = chain.add(() => ({}));
  assert.equal(result, chain);
});

test('chain.add rejects non-function', () => {
  const chain = new ValidatorChain();
  assert.throws(() => chain.add('not a function'));
});

test('chain runs validators in order and aggregates', () => {
  const chain = new ValidatorChain();
  const order = [];
  chain.add(() => { order.push('a'); return {}; });
  chain.add(() => { order.push('b'); return { errors: [{ code: 'x', message: 'X' }] }; });
  chain.add(() => { order.push('c'); return { warnings: [{ code: 'y', message: 'Y' }] }; });

  const result = chain.run({});
  assert.deepEqual(order, ['a', 'b', 'c']);
  assert.equal(result.errors.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.errors[0].code, 'x');
  assert.equal(result.warnings[0].code, 'y');
});

test('chain tolerates validator returning undefined', () => {
  const chain = new ValidatorChain();
  chain.add(() => undefined);
  const result = chain.run({});
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('chain tolerates non-array errors or warnings', () => {
  const chain = new ValidatorChain();
  chain.add(() => ({ errors: 'not-an-array', warnings: null }));
  const result = chain.run({});
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});
