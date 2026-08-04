import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanForSecrets } from '../secrets.mjs';

test('flags AWS access key', () => {
  const findings = scanForSecrets('config = "AKIAIOSFODNN7EXAMPLE"');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].pattern, 'aws-access-key');
});

test('flags GitHub token', () => {
  const findings = scanForSecrets('GITHUB_TOKEN=ghp_abc1234567890abcdefghijklmnopqrstuvwxyz01');
  assert.ok(findings.some((f) => f.pattern === 'github-token'));
});

test('flags private key block', () => {
  const findings = scanForSecrets('-----BEGIN RSA PRIVATE KEY-----');
  assert.ok(findings.some((f) => f.pattern === 'private-key-block'));
});

test('flags bearer token', () => {
  const findings = scanForSecrets('Authorization: Bearer eyJabcde12.eyJfghijkl34.eyJmnopqrst56');
  assert.ok(findings.some((f) => f.pattern === 'bearer-token'));
});

test('flags generic api_key=value', () => {
  const findings = scanForSecrets('api_key="abcdefghijklmnop1234"');
  assert.ok(findings.some((f) => f.pattern === 'generic-api-key'));
});

test('returns empty for clean text', () => {
  const findings = scanForSecrets('Use this agent when nothing sensitive happens.');
  assert.equal(findings.length, 0);
});

test('reports line number', () => {
  const source = ['safe line', 'unsafe AKIAIOSFODNN7EXAMPLE content', 'another safe line'].join('\n');
  const findings = scanForSecrets(source);
  assert.equal(findings[0].line, 2);
});

test('redacts the snippet', () => {
  const findings = scanForSecrets('AKIAIOSFODNN7EXAMPLE');
  assert.match(findings[0].snippet, /\*\*\*/);
  assert.doesNotMatch(findings[0].snippet, /AKIAIOSFODNN7/);
});
