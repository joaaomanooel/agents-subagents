import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emitOpencode, OpencodePlatform } from '../opencode.mjs';

const baseCanonical = {
  name: 'foo',
  description: 'Use this when foo is needed.',
  mode: 'subagent',
  capability: 'read-only',
  mcp: ['pencil'],
  color: '#3B82F6',
};

test('emitOpencode function is available', () => {
  assert.equal(typeof emitOpencode, 'function');
});

test('OpencodePlatform exposes name and outputDir', () => {
  const p = new OpencodePlatform();
  assert.equal(p.name, 'opencode');
  assert.equal(p.outputDir, '.opencode/agents');
});

test('emits read-only capability as permission deny', () => {
  const out = emitOpencode(baseCanonical, 'body');
  assert.match(out, /edit: deny/);
  assert.match(out, /bash: deny/);
});

test('emits code-edit with bash and edit allow', () => {
  const out = emitOpencode({ ...baseCanonical, capability: 'code-edit' }, 'body');
  assert.match(out, /edit: allow/);
  assert.match(out, /bash: allow/);
});

test('emits full-bash with edit and bash allow', () => {
  const out = emitOpencode({ ...baseCanonical, capability: 'full-bash' }, 'body');
  assert.match(out, /edit: allow/);
  assert.match(out, /bash: allow/);
  assert.doesNotMatch(out, /edit: deny/);
});

test('omits model even if canonical declares opus', () => {
  const out = emitOpencode({ ...baseCanonical, model_preference: 'opus' }, 'body');
  assert.doesNotMatch(out, /^model:/m);
});

test('preserves color and emits description', () => {
  const out = emitOpencode(baseCanonical, 'body');
  assert.match(out, /color: "#3B82F6"/);
  assert.match(out, /^description: /m);
});

test('returns body in output', () => {
  const out = emitOpencode(baseCanonical, 'my prompt body');
  assert.ok(out.endsWith('my prompt body'));
});

test('emits permission block at column 0 (YAML top-level)', () => {
  const out = emitOpencode(baseCanonical, 'body');
  assert.match(out, /^permission:/m);
  assert.doesNotMatch(out, /^  permission:/m);
});

test('emits task block with allow list at correct indentation', () => {
  const out = emitOpencode({
    ...baseCanonical,
    capability: 'full-bash',
    task_agents: ['alpha', 'beta'],
  }, 'body');
  assert.match(out, /^permission:/m);
  assert.match(out, /^  task:/m);
  assert.match(out, /^    "\*": "deny"/m);
  assert.match(out, /^    "alpha": "allow"/m);
  assert.match(out, /^    "beta": "allow"/m);
});

test('omits task block when task_agents is empty but emits capability permissions', () => {
  const out = emitOpencode({
    ...baseCanonical,
    capability: 'full-bash',
    task_agents: [],
  }, 'body');
  assert.match(out, /^permission:/m);
  assert.doesNotMatch(out, /^  task:/m);
});

test('mapCapability returns array of permission lines', () => {
  const p = new OpencodePlatform();
  assert.ok(Array.isArray(p.mapCapability('read-only')));
  assert.ok(p.mapCapability('read-only').some((l) => /edit: deny/.test(l)));
  assert.ok(p.mapCapability('code-edit').some((l) => /edit: allow/.test(l)));
  assert.ok(p.mapCapability('full-bash').some((l) => /bash: allow/.test(l)));
});

test('emits permission.task from task_agents list', () => {
  const out = emitOpencode({
    ...baseCanonical,
    capability: 'full-bash',
    task_agents: ['alpha', 'beta'],
  }, 'body');
  assert.match(out, /permission:[\s\S]*task:[\s\S]*\*": "deny"/);
  assert.match(out, /"alpha": "allow"/);
  assert.match(out, /"beta": "allow"/);
});

test('omits task permission when task_agents is empty', () => {
  const out = emitOpencode({
    ...baseCanonical,
    task_agents: [],
  }, 'body');
  assert.doesNotMatch(out, /\btask:/);
});

test('omits task permission when task_agents is absent', () => {
  const out = emitOpencode(baseCanonical, 'body');
  assert.doesNotMatch(out, /\btask:/);
});
