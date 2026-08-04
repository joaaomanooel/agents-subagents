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

test('emits code-edit with bash ask', () => {
  const out = emitOpencode({ ...baseCanonical, capability: 'code-edit' }, 'body');
  assert.match(out, /bash: ask/);
});

test('emits full-bash without deny permission', () => {
  const out = emitOpencode({ ...baseCanonical, capability: 'full-bash' }, 'body');
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

test('mapCapability returns correct YAML fragment', () => {
  const p = new OpencodePlatform();
  assert.match(p.mapCapability('read-only'), /edit: deny/);
  assert.match(p.mapCapability('code-edit'), /bash: ask/);
  assert.equal(p.mapCapability('full-bash'), '');
});
