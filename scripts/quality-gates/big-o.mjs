/**
 * Big O lint — surface likely O(n^2) patterns in code under scan.
 *
 * Heuristic scanner for common nested-loop smells:
 *   - .find() / .includes() / .some() / .every() called inside a for-loop body
 *   - .indexOf() called inside a for-loop body
 *   - .forEach inside a .forEach block (brace-depth tracked)
 *   - .filter or .map called inside a for-loop body
 *
 * False positives are tolerated and reported as warnings.
 */

const SUSPECT_PATTERNS = [
  {
    name: 'find-in-loop',
    regex: /\bfor\b[^{]*\{[^}]*\.(?:find|findIndex|includes|some|every)\s*\(/gs,
  },
  {
    name: 'indexOf-in-loop',
    regex: /\bfor\b[^{]*\{[^}]*\.(?:indexOf|lastIndexOf)\s*\(/gs,
  },
  {
    name: 'filter-map-in-loop',
    regex: /\bfor\b[^{]*\{[^}]*\.(?:filter|map)\s*\(/gs,
  },
];

function detectNestedForEach(source, file) {
  const findings = [];
  const lines = source.split('\n');
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    const newDepth = depth + opens - closes;

    if (depth > 0 && /\.forEach\s*\(/.test(line)) {
      findings.push({ pattern: 'forEach-in-forEach', file, line: i + 1 });
    }

    depth = newDepth;
  }
  return findings;
}

function detectRegexPatterns(source, file) {
  const findings = [];
  for (const { name, regex } of SUSPECT_PATTERNS) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(source)) !== null) {
      const before = source.slice(0, m.index);
      const line = before.split('\n').length;
      findings.push({ pattern: name, file, line });
    }
  }
  return findings;
}

export function lintBigO(source, file = '<inline>') {
  const regexFindings = detectRegexPatterns(source, file);
  const forEachFindings = detectNestedForEach(source, file);
  const findings = [...regexFindings, ...forEachFindings];
  return { file, findings, lines: source.split('\n').length };
}

export function summarizeLintResults(results) {
  const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0);
  const filesWithFindings = results.filter((r) => r.findings.length > 0);
  return {
    filesScanned: results.length,
    filesWithFindings: filesWithFindings.length,
    totalFindings,
    files: filesWithFindings.map((r) => ({
      file: r.file,
      findings: r.findings.length,
    })),
  };
}
