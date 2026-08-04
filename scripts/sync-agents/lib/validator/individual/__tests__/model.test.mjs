import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modelValidator } from '../model.mjs';

test('rejects invalid model_preference', () => {
  const result = modelValidator({ model_preference: 'gpt-9000' });
  assert.ok(result.errors.some((e) => e.code === 'model-preference-invalid'));
});

test('accepts opus, sonnet, haiku, inherit', () => {
  for (const m of ['opus', 'sonnet', 'haiku', 'inherit']) {
    const result = modelValidator({ model_preference: m });
    assert.equal(result.errors.length, 0, `should accept ${m}`);
  }
});

test('omitted model_preference is fine', () => {
  const result = modelValidator({});
  assert.equal(result.errors.length, 0);
});
