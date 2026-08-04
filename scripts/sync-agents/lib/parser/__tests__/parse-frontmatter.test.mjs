import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../parse-frontmatter.mjs';

test('parseFrontmatter exists', () => {
  assert.equal(typeof parseFrontmatter, 'function');
});

test('parses simple frontmatter', () => {
  const raw = '---\nname: foo\ndescription: bar\n---\nbody';
  const result = parseFrontmatter(raw);
  assert.equal(result.ok, true);
  assert.equal(result.value.data.name, 'foo');
  assert.equal(result.value.body, 'body');
});

test('returns error on missing frontmatter', () => {
  const raw = 'no frontmatter here';
  const result = parseFrontmatter(raw);
  assert.equal(result.ok, false);
});

test('returns error on unclosed frontmatter', () => {
  const raw = '---\nname: foo\nbody';
  const result = parseFrontmatter(raw);
  assert.equal(result.ok, false);
});

test('returns error on empty frontmatter', () => {
  const raw = '---\n---\nbody';
  const result = parseFrontmatter(raw);
  assert.equal(result.ok, false);
});

test('handles multiline description', () => {
  const raw = '---\nname: foo\ndescription: "line one\nline two"\n---\nbody';
  const result = parseFrontmatter(raw);
  assert.equal(result.ok, true);
  assert.ok(result.value.data.description.includes('line one'));
});

test('handles BOM at start', () => {
  const raw = '\uFEFF---\nname: foo\n---\nbody';
  const result = parseFrontmatter(raw);
  assert.equal(result.ok, true);
});

test('preserves raw frontmatter text', () => {
  const raw = '---\nname: foo\n---\nbody';
  const result = parseFrontmatter(raw);
  assert.equal(result.value.raw, 'name: foo');
});

test('preserves array values for mcp and skills', () => {
  const raw = '---\nname: foo\nmcp:\n  - pencil\n  - agent-skills\nskills:\n  - test-engineer-js\n---\nbody';
  const result = parseFrontmatter(raw);
  assert.deepEqual(result.value.data.mcp, ['pencil', 'agent-skills']);
  assert.deepEqual(result.value.data.skills, ['test-engineer-js']);
});
