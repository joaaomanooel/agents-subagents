import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taskAgentsValidator } from '../task-agents.mjs';

test('accepts empty array', () => {
  const result = taskAgentsValidator({ task_agents: [] });
  assert.equal(result.errors.length, 0);
});

test('accepts omitted field', () => {
  const result = taskAgentsValidator({});
  assert.equal(result.errors.length, 0);
});

test('accepts array of strings', () => {
  const result = taskAgentsValidator({ task_agents: ['foo', 'bar'] });
  assert.equal(result.errors.length, 0);
});

test('rejects non-array', () => {
  const result = taskAgentsValidator({ task_agents: 'foo' });
  assert.ok(result.errors.some((e) => e.code === 'task-agents-format'));
});

test('rejects non-string entries', () => {
  const result = taskAgentsValidator({ task_agents: ['foo', 42] });
  assert.ok(result.errors.some((e) => e.code === 'task-agents-format'));
});

test('rejects invalid kebab-case names', () => {
  const result = taskAgentsValidator({ task_agents: ['BadName'] });
  assert.ok(result.errors.some((e) => e.code === 'task-agents-name'));
});

test('warns on name that does not exist in agents/', () => {
  const result = taskAgentsValidator({ task_agents: ['nonexistent-agent'] }, { existingAgentNames: new Set() });
  assert.ok(result.warnings.some((w) => w.code === 'task-agents-unknown-name'));
});
