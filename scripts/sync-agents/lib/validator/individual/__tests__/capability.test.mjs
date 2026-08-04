import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capabilityValidator } from '../capability.mjs';

test('rejects invalid capability', () => {
  const result = capabilityValidator({ capability: 'super-admin' });
  assert.ok(result.errors.some((e) => e.code === 'capability-invalid'));
});

test('warns on missing capability', () => {
  const result = capabilityValidator({});
  assert.ok(result.warnings.some((w) => w.code === 'capability-inferred'));
});

test('accepts read-only', () => {
  const result = capabilityValidator({ capability: 'read-only' });
  assert.equal(result.errors.length, 0);
});

test('accepts code-edit', () => {
  const result = capabilityValidator({ capability: 'code-edit' });
  assert.equal(result.errors.length, 0);
});

test('accepts full-bash', () => {
  const result = capabilityValidator({ capability: 'full-bash' });
  assert.equal(result.errors.length, 0);
});
