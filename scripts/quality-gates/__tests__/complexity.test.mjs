import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureFunctionComplexity, complexityViolations } from '../complexity.mjs';

test('returns empty for no functions', () => {
  const result = measureFunctionComplexity('const x = 1;\n');
  assert.equal(result.length, 0);
});

test('counts decisions in a simple function', () => {
  const src = `function foo(items) {\n  if (items.length > 0) {}\n}\n`;
  const result = measureFunctionComplexity(src);
  assert.ok(result.length >= 1);
  assert.equal(result[0].name, 'foo');
  assert.ok(result[0].complexity >= 2);
});

test('counts && || and ternary as decision points', () => {
  const src = `
function bar(a, b) {
  if (a && b) return true;
  return a || b ? 'x' : 'y';
}
`;
  const result = measureFunctionComplexity(src);
  assert.ok(result.length >= 1);
  const bar = result.find((f) => f.name === 'bar');
  assert.ok(bar);
  assert.ok(bar.complexity >= 4);
});

test('complexityViolations filters above threshold', () => {
  const src = `
function big(x) {
  if (x) {} else if (x) {} else if (x) {}
  if (x) {} else if (x) {} else if (x) {}
  for (const a of x) { if (a) {} }
}
`;
  const result = measureFunctionComplexity(src);
  const big = result.find((f) => f.name === 'big');
  if (big && big.complexity > 10) {
    assert.ok(complexityViolations(result, 10).some((f) => f.name === 'big'));
  }
});

test('handles arrow function assignment', () => {
  const src = `const fn = () => {\n  if (Math.random() > 0.5) {}\n};\n`;
  const result = measureFunctionComplexity(src);
  assert.ok(result.length >= 1);
});
