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

test('accepts role-then-verb pattern', () => {
  const result = descriptionValidator({
    description: 'Code review specialist that validates implementations against the implementation plan and project rules.',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts role descriptor chain', () => {
  const result = descriptionValidator({
    description: 'UI architect and design-system engineer channeling Jon Yablonski (Laws of UX, cognitive psychology applied to tokens, components, and documentation).',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts "Use when" pattern in description', () => {
  const result = descriptionValidator({
    description: 'Elite UX Writer and microcopy specialist. Use when the user or implementing agent needs user-facing copy.',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts "Facilitates" verb', () => {
  const result = descriptionValidator({
    description: 'Facilitates collaborative Design Haiku workshops with a multi-persona UI/UX expert panel.',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts "Maintains" verb', () => {
  const result = descriptionValidator({
    description: 'Maintains LLM-oriented context under .docs (agreements, definitions, features) in en-US for consistent responses.',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('accepts "Embodies" verb', () => {
  const result = descriptionValidator({
    description: 'Embodies Jon Yablonski (Laws of UX) as a layout and UI code auditor—Fitts, Hick, Jakob, Doherty.',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});
