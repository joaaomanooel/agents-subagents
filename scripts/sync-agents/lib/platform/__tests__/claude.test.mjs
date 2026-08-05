import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emitClaude, ClaudePlatform } from '../claude.mjs';

const claudeCanonical = {
  name: 'foo',
  description: 'Use this when foo is needed.',
  mode: 'subagent',
  capability: 'read-only',
  skills: ['test-engineer-js'],
  model_preference: 'opus',
  color: '#3B82F6',
};

test('emitClaude function is available', () => {
  assert.equal(typeof emitClaude, 'function');
});

test('ClaudePlatform exposes name and outputDir', () => {
  const p = new ClaudePlatform();
  assert.equal(p.name, 'claude');
  assert.equal(p.outputDir, '.claude/agents');
});

test('emits name and description', () => {
  const out = emitClaude(claudeCanonical, 'body');
  assert.match(out, /^name: foo$/m);
  assert.match(out, /^description: Use/m);
});

test('emits read-only tools list', () => {
  const out = emitClaude({ ...claudeCanonical, capability: 'read-only' }, 'body');
  assert.match(out, /^tools: Read, Grep, Glob$/m);
});

test('emits code-edit tools list', () => {
  const out = emitClaude({ ...claudeCanonical, capability: 'code-edit' }, 'body');
  assert.match(out, /^tools: Read, Grep, Glob, Bash, Edit, Write$/m);
});

test('emits full-bash tools list', () => {
  const out = emitClaude({ ...claudeCanonical, capability: 'full-bash' }, 'body');
  assert.match(out, /^tools: Read, Grep, Glob, Bash, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill$/m);
});

test('emits opus model when canonical declares opus', () => {
  const out = emitClaude({ ...claudeCanonical, model_preference: 'opus' }, 'body');
  assert.match(out, /^model: opus$/m);
});

test('omits model_preference when inherit', () => {
  const out = emitClaude({ ...claudeCanonical, model_preference: 'inherit' }, 'body');
  assert.doesNotMatch(out, /^model:/m);
});

test('emits skills array', () => {
  const out = emitClaude(claudeCanonical, 'body');
  assert.match(out, /^skills:\n  - test-engineer-js$/m);
});

test('maps hex color to enum blue', () => {
  const out = emitClaude(claudeCanonical, 'body');
  assert.match(out, /^color: blue$/m);
});

test('mapCapability returns tools string', () => {
  const p = new ClaudePlatform();
  assert.equal(p.mapCapability('read-only'), 'Read, Grep, Glob');
  assert.equal(p.mapCapability('code-edit'), 'Read, Grep, Glob, Bash, Edit, Write');
  assert.equal(p.mapCapability('full-bash'), 'Read, Grep, Glob, Bash, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill');
});

test('emits Agent(...) wrapper when task_agents present', () => {
  const out = emitClaude({
    ...claudeCanonical,
    capability: 'full-bash',
    task_agents: ['alpha', 'beta'],
  }, 'body');
  assert.match(out, /Agent\(alpha, beta\)/);
});

test('emits tools without Agent wrapper when task_agents empty', () => {
  const out = emitClaude({
    ...claudeCanonical,
    task_agents: [],
  }, 'body');
  assert.match(out, /^tools: Read, Grep, Glob$/m);
  assert.doesNotMatch(out, /Agent\(/);
});

test('emits tools without Agent wrapper when task_agents absent', () => {
  const out = emitClaude(claudeCanonical, 'body');
  assert.doesNotMatch(out, /Agent\(/);
});
