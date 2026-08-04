const READ_ONLY_PATTERNS = [/review/i, /audit/i, /analy[sz]e/i, /analys[ti]/i, /plan/i, /architect/i, /design/i];
const CODE_EDIT_PATTERNS = [/test/i, /e2e/i, /playwright/i];
const FULL_BASH_PATTERNS = [/^senior-/i, /^staff-/i, /orchestrator/i];

function matchesAny(name, patterns) {
  return patterns.some((p) => p.test(name));
}

export function inferCapability(name) {
  if (matchesAny(name, FULL_BASH_PATTERNS)) return 'full-bash';
  if (matchesAny(name, READ_ONLY_PATTERNS)) return 'read-only';
  if (matchesAny(name, CODE_EDIT_PATTERNS)) return 'code-edit';
  return 'code-edit';
}

export function inferMode(name) {
  if (/^build-/i.test(name)) return 'primary';
  return 'subagent';
}
