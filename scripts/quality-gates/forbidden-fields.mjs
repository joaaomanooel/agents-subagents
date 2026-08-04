/**
 * Scans canonical agents/*.md for forbidden frontmatter fields.
 *
 * Currently flags any `^model:` line in YAML frontmatter, since AGENTS.md
 * reserves model selection for runtime tooling, not file metadata.
 */

const FORBIDDEN_FIELDS = [
  { name: 'model', regex: /^model:\s*/m, severity: 'error' },
  { name: 'maxSteps', regex: /^maxSteps:\s*/m, severity: 'error' },
];

export function scanForbiddenFields(source, file = '<inline>') {
  const findings = [];
  const lines = source.split(/\r?\n/);

  let inFrontmatter = false;
  let frontmatterDone = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---' && !inFrontmatter && !frontmatterDone) {
      inFrontmatter = true;
      continue;
    }
    if (line.trim() === '---' && inFrontmatter) {
      inFrontmatter = false;
      frontmatterDone = true;
      continue;
    }
    if (!inFrontmatter) continue;
    for (const { name, regex, severity } of FORBIDDEN_FIELDS) {
      if (regex.test(line)) {
        findings.push({ field: name, file, line: i + 1, severity });
      }
    }
  }
  return findings;
}

export function forbiddenFieldsPolicy() {
  return FORBIDDEN_FIELDS.map((f) => ({ name: f.name, severity: f.severity }));
}
