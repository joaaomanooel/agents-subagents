import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../validate.mjs';

const validAgent = {
  name: 'staff-orchestrator',
  description: 'Use this agent when tasks span multiple concerns.',
  mode: 'subagent',
  capability: 'full-bash',
  mcp: ['pencil'],
  skills: ['test-engineer-js'],
  model_preference: 'opus',
  color: '#3B82F6',
};

test('accepts a fully valid agent', () => {
  const result = validate(validAgent);
  assert.equal(result.ok, true);
  assert.equal(result.value.errors.length, 0);
});

test('rejects missing name', () => {
  const { name, ...rest } = validAgent;
  const result = validate(rest);
  assert.equal(result.ok, false);
});

test('rejects invalid name format', () => {
  const result = validate({ ...validAgent, name: 'Bad_Name' });
  assert.equal(result.ok, false);
});

test('rejects invalid capability', () => {
  const result = validate({ ...validAgent, capability: 'super-admin' });
  assert.equal(result.ok, false);
});

test('rejects invalid mode', () => {
  const result = validate({ ...validAgent, mode: 'god-mode' });
  assert.equal(result.ok, false);
});

test('rejects invalid model_preference', () => {
  const result = validate({ ...validAgent, model_preference: 'gpt-9000' });
  assert.equal(result.ok, false);
});

test('warns on description shorter than 80 chars', () => {
  const result = validate({ ...validAgent, description: 'Short.' });
  assert.equal(result.value.warnings.length, 1);
});

test('warns on undeclared capability', () => {
  const { capability, ...rest } = validAgent;
  const result = validate(rest);
  assert.ok(result.value.warnings.some((w) => w.code === 'capability-inferred'));
});
