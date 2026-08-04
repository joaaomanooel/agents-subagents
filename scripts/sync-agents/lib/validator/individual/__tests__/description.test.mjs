import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descriptionValidator } from '../description.mjs';

test('flags missing description', () => {
  const result = descriptionValidator({});
  assert.ok(result.errors.some((e) => e.code === 'description-required'));
});

test('warns on description without leading verb', () => {
  const result = descriptionValidator({ description: 'this does random stuff' });
  assert.ok(result.warnings.some((w) => w.code === 'description-no-verb'));
});

test('warns on description shorter than 80 chars', () => {
  const result = descriptionValidator({ description: 'Reviews stuff briefly.' });
  assert.ok(result.warnings.some((w) => w.code === 'description-short'));
});

test('accepts long verb-leading description', () => {
  const result = descriptionValidator({
    description: 'Reviews code changes for quality, performance, and security concerns across all PRs.',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});
