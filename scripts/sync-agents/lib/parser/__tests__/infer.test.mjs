import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferCapability, inferMode } from '../infer.mjs';

const inferenceCases = [
  ['code-reviewer', 'read-only'],
  ['security-auditor', 'read-only'],
  ['performance-analyst', 'read-only'],
  ['plan-specialist', 'read-only'],
  ['architect-specialist', 'read-only'],
  ['design-system-architect', 'read-only'],
  ['test-engineer', 'code-edit'],
  ['e2e-tester', 'code-edit'],
  ['playwright-runner', 'code-edit'],
  ['senior-frontend-developer', 'full-bash'],
  ['staff-orchestrator', 'full-bash'],
  ['senior-backend-developer', 'full-bash'],
  ['orchestrator-helper', 'full-bash'],
  ['random-name', 'code-edit'],
];

for (const [name, expected] of inferenceCases) {
  test(`infers capability for ${name}`, () => {
    assert.equal(inferCapability(name), expected);
  });
}

test('returns primary for build-named agents', () => {
  assert.equal(inferMode('build-agent'), 'primary');
  assert.equal(inferMode('orchestrator-agent'), 'subagent');
});
