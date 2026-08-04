import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanForbiddenFields, forbiddenFieldsPolicy } from '../forbidden-fields.mjs';

test('flags `model:` in frontmatter', () => {
  const src = `---\nname: foo\nmodel: opus\n---\nbody`;
  const findings = scanForbiddenFields(src, 'foo.md');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].field, 'model');
  assert.equal(findings[0].severity, 'error');
});

test('flags maxSteps in frontmatter', () => {
  const src = `---\nname: foo\nmaxSteps: 50\n---\nbody`;
  const findings = scanForbiddenFields(src, 'foo.md');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].field, 'maxSteps');
});

test('does not flag `model` in body content', () => {
  const src = `---\nname: foo\n---\nThis body mentions a model in a sentence.`;
  const findings = scanForbiddenFields(src, 'foo.md');
  assert.equal(findings.length, 0);
});

test('does not flag model_preference (canonical field)', () => {
  const src = `---\nname: foo\nmodel_preference: opus\n---\nbody`;
  const findings = scanForbiddenFields(src, 'foo.md');
  assert.equal(findings.length, 0);
});

test('does not flag `modeling` or other substrings', () => {
  const src = `---\nname: foo\nmodelling: true\n---\nbody`;
  const findings = scanForbiddenFields(src, 'foo.md');
  assert.equal(findings.length, 0);
});

test('forbiddenFieldsPolicy returns the policy', () => {
  const policy = forbiddenFieldsPolicy();
  assert.ok(policy.length >= 2);
  assert.ok(policy.find((p) => p.name === 'model'));
  assert.ok(policy.find((p) => p.name === 'maxSteps'));
});

test('reports line number', () => {
  const src = [
    '---',
    'name: foo',
    'description: "Use when foo is needed."',
    'model: opus',
    '---',
    'body',
  ].join('\n');
  const findings = scanForbiddenFields(src, 'foo.md');
  assert.equal(findings[0].line, 4);
});
