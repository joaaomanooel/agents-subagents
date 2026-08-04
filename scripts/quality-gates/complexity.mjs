/**
 * Cyclomatic complexity — coarse heuristic on JS code.
 *
 * Counts decision points: `if`, `else if`, `for`, `while`, `case`,
 * `catch`, `||`, `&&`, ternary `?:`. Each +1.
 *
 * Starts at 1 (the function body itself).
 */

const DECISION_KEYWORDS = /\b(if|else if|for|while|do|case|catch|return)\b|\&\&|\|\||\?[^=]/g;

export function measureFunctionComplexity(source) {
  const lines = source.split('\n');
  const findings = [];

  const functionRe = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)|^([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{|=>\s*\{/m;
  const braceStack = [];
  let current = null;
  let complexity = 1;
  let lineStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const fnMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/) ||
                   line.match(/^(?:export\s+)?(?:async\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>\s*\{/) ||
                   line.match(/^(?:export\s+)?(?:async\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*=>\s*\{/);

    if (fnMatch && current === null) {
      current = {
        name: fnMatch[1] ?? '<anonymous>',
        file: '<inline>',
        lineStart: i + 1,
        complexity: 1,
        body: '',
      };
      lineStart = i;
    }

    if (current) {
      DECISION_KEYWORDS.lastIndex = 0;
      const matches = line.match(DECISION_KEYWORDS);
      if (matches) current.complexity += matches.length;

      const opens = (line.match(/\{/g) ?? []).length;
      const closes = (line.match(/\}/g) ?? []).length;
      current.body += line + '\n';

      if (closes > opens) {
        if (current.complexity > 0) {
          findings.push({ ...current, file: current.file, line: current.lineStart });
        }
        current = null;
      }
    }
  }

  if (current && current.complexity > 0) {
    findings.push({ ...current });
  }

  return findings;
}

export function complexityViolations(findings, threshold = 10) {
  return findings.filter((f) => f.complexity > threshold);
}
