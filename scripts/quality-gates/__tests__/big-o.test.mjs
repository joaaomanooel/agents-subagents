import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintBigO, summarizeLintResults } from '../big-o.mjs';

test('flags .find() inside for loop', () => {
  const src = `
for (const item of items) {
  const found = items.find((x) => x.id === item.id);
}
`;
  const result = lintBigO(src, 'foo.mjs');
  assert.ok(result.findings.some((f) => f.pattern === 'find-in-loop'));
});

test('flags .includes() inside for loop', () => {
  const src = `
for (const x of xs) {
  if (ys.includes(x)) {}
}
`;
  const result = lintBigO(src, 'foo.mjs');
  assert.ok(result.findings.some((f) => f.pattern === 'find-in-loop'));
});

test('flags forEach inside forEach', () => {
  const src = `
arr.forEach((x) => {
  arr.forEach((y) => {});
});
`;
  const result = lintBigO(src, 'foo.mjs');
  assert.ok(result.findings.some((f) => f.pattern === 'forEach-in-forEach'));
});

test('does not flag .find() outside a loop', () => {
  const src = `
const found = items.find((x) => x.id === 1);
`;
  const result = lintBigO(src, 'foo.mjs');
  assert.equal(result.findings.length, 0);
});

test('returns correct line number', () => {
  const src = [
    '// safe',
    'for (const x of xs) {',
    '  ys.includes(x);',
    '}',
  ].join('\n');
  const result = lintBigO(src, 'foo.mjs');
  assert.ok(result.findings.length > 0);
  assert.equal(result.findings[0].line, 2);
});

test('summarizeLintResults counts findings', () => {
  const results = [
    { file: 'a.mjs', findings: [{}, {}], lines: 10 },
    { file: 'b.mjs', findings: [], lines: 5 },
  ];
  const summary = summarizeLintResults(results);
  assert.equal(summary.filesScanned, 2);
  assert.equal(summary.totalFindings, 2);
  assert.equal(summary.filesWithFindings, 1);
});
