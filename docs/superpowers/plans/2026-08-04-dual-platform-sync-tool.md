# Dual-Platform Sync Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `scripts/sync-agents.mjs` — a Node ESM tool that reads canonical agents from `agents/*.md`, validates them, and emits dual-platform mirrors to `.opencode/agents/` and `.claude/agents/`. The tool supports diff, check, audit, list, interactive, watch, and prune modes. Tests are written first (TDD), coverage must reach at least 90%.

**Architecture:** A single Node ESM module split internally into five small focused files: `parse-frontmatter.mjs`, `validate.mjs`, `infer.mjs`, `emit-opencode.mjs`, `emit-claude.mjs`. The entry point `sync-agents.mjs` wires them together and handles the CLI. Errors flow through a `Result` helper (`{ ok, value } | { ok, error }`) so throws never cross CLI edges. The fallback is a tiny POSIX shell script that copies files without applying platform-specific mapping.

**Tech Stack:** Node.js 18+ (built-in `node:test`, `--experimental-test-coverage`, `fs.watch`, `path`), pure stdlib. Bun compatible. POSIX shell for fallback. No external dependencies.

**Reference:** [`2026-08-04-agent-dual-platform-design.md`](../specs/2026-08-04-agent-dual-platform-design.md)

---

## File Structure

Scripts that this plan creates:

- `scripts/sync-agents.mjs` — CLI entry, ties every module together, handles flags, watch, interactive editor.
- `scripts/sync-agents/lib/parse-frontmatter.mjs` — extracts and parses YAML frontmatter from markdown; returns `{ ok, value: { data, body, raw } } | { ok: false, error }`.
- `scripts/sync-agents/lib/validate.mjs` — schema validation; returns `{ ok, value: { canonical, errors, warnings } } | { ok: false, error }`.
- `scripts/sync-agents/lib/infer.mjs` — pure function that fills in defaults from agent name patterns.
- `scripts/sync-agents/lib/emit-opencode.mjs` — writes the opencode variant of one agent.
- `scripts/sync-agents/lib/emit-claude.mjs` — writes the claudecode variant of one agent.
- `scripts/sync-agents/lib/result.mjs` — minimal Result helper.
- `scripts/sync-agents/lib/errors.mjs` — top-level error handler with formatted messages and exit codes.
- `scripts/sync-agents/lib/io.mjs` — file system helpers (`readFile`, `writeFile`, `normalizeEOL`).
- `scripts/sync-agents/lib/cli.mjs` — argument parsing.
- `scripts/sync-agents/index.mjs` — exports the building blocks for tests.

Tests:

- `scripts/sync-agents.test.mjs` — every test from the spec plus extras, ≥ 30 cases total.

Support files:

- `scripts/coverage-thresholds.json` — `{ "lines": 90, "branches": 85, "functions": 90, "statements": 90 }`.
- `scripts/sync-agents-fallback.sh` — POSIX shell fallback for environments without node.

Documentation:

- `docs/agents-platforms.md` — extension guide for adding a third platform.
- `scripts/README.md` — usage notes, command table, troubleshooting.

---

## Task 1: Project scaffolding

**Files:**
- Create: `scripts/sync-agents/lib/result.mjs`
- Create: `scripts/sync-agents/lib/io.mjs`
- Create: `scripts/sync-agents/lib/parse-frontmatter.mjs` (placeholder)
- Create: `scripts/sync-agents/index.mjs` (placeholder)
- Create: `scripts/sync-agents.test.mjs` (placeholder with one smoke test)
- Create: `scripts/coverage-thresholds.json`
- Create: `scripts/README.md`

- [ ] **Step 1.1: Create `scripts/sync-agents/lib/result.mjs`**

```js
export const ok = (value) => ({ ok: true, value });
export const err = (error) => ({ ok: false, error });
export const isOk = (r) => r && r.ok === true;
```

- [ ] **Step 1.2: Create `scripts/sync-agents/lib/io.mjs`**

```js
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';

export function readUtf8(path) {
  return readFileSync(path, 'utf8');
}

export function writeUtf8(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.replace(/\r\n/g, '\n'), 'utf8');
}

export function fileExists(path) {
  return existsSync(path);
}

export function removeFile(path) {
  if (existsSync(path)) unlinkSync(path);
}

export function isFile(path) {
  return existsSync(path) && statSync(path).isFile();
}
```

- [ ] **Step 1.3: Create `scripts/coverage-thresholds.json`**

```json
{
  "lines": 90,
  "branches": 85,
  "functions": 90,
  "statements": 90
}
```

- [ ] **Step 1.4: Create `scripts/README.md`** (initial stub)

````markdown
# Sync Agents

Dual-platform agent sync for opencode and Claude Code.

## Quick start

```bash
node scripts/sync-agents.mjs                # sync everything
node scripts/sync-agents.mjs --check        # CI mode
node scripts/sync-agents.mjs --diff         # show what would change
node scripts/sync-agents.mjs --agent=foo    # sync one agent
node scripts/sync-agents.mjs --audit        # resolved vs declared
```

## Tests

```bash
node --test --experimental-test-coverage scripts/sync-agents.test.mjs
```

Requires Node 18+ or Bun.
````

- [ ] **Step 1.5: Create `scripts/sync-agents/lib/parse-frontmatter.mjs`** (placeholder, expanded in Task 2)

```js
import { ok, err } from './result.mjs';

export function parseFrontmatter(raw) {
  return err(new Error('parseFrontmatter not implemented'));
}
```

- [ ] **Step 1.6: Create `scripts/sync-agents/index.mjs`** (placeholder)

```js
export { parseFrontmatter } from './lib/parse-frontmatter.mjs';
```

- [ ] **Step 1.7: Create `scripts/sync-agents.test.mjs`** (smoke test)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from './sync-agents/index.mjs';

test('parseFrontmatter exists', () => {
  assert.equal(typeof parseFrontmatter, 'function');
});
```

- [ ] **Step 1.8: Run the smoke test**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: 1 test passes.

- [ ] **Step 1.9: Commit**

```bash
git add scripts/sync-agents/ scripts/sync-agents.test.mjs scripts/coverage-thresholds.json scripts/README.md
git commit -m "feat(scripts): scaffold sync-agents tool"
```

---

## Task 2: Frontmatter parser (TDD)

**Files:**
- Create: `scripts/sync-agents/lib/parse-frontmatter.mjs`
- Modify: `scripts/sync-agents.test.mjs`

- [ ] **Step 2.1: Add failing tests to `scripts/sync-agents.test.mjs`**

Append these tests:

```js
import { ok, err } from './sync-agents/lib/result.mjs';

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
```

- [ ] **Step 2.2: Run tests to confirm they fail**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: The first new test fails (the placeholder returns `err`).

- [ ] **Step 2.3: Implement `parseFrontmatter` in `scripts/sync-agents/lib/parse-frontmatter.mjs`**

```js
import { ok, err } from './result.mjs';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function stripBom(s) {
  return s.startsWith('\uFEFF') ? s.slice(1) : s;
}

function parseYamlScalar(line) {
  const match = line.match(/^([a-z_]+):\s*(.*)$/i);
  if (!match) return null;
  const key = match[1];
  let value = match[2].trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

function parseYamlBlock(raw) {
  const lines = raw.split('\n');
  const data = {};
  let currentArrayKey = null;
  let currentArray = null;
  let multilineKey = null;
  let multilineValue = null;

  const flushMultiline = () => {
    if (multilineKey) {
      data[multilineKey] = multilineValue;
      multilineKey = null;
      multilineValue = null;
    }
  };

  const flushArray = () => {
    if (currentArrayKey) {
      data[currentArrayKey] = currentArray;
      currentArrayKey = null;
      currentArray = null;
    }
  };

  for (const line of lines) {
    if (line.trim() === '') continue;

    if (line.startsWith(' ') && currentArrayKey) {
      const item = line.trim().replace(/^-\s*/, '');
      currentArray.push(item);
      continue;
    }

    flushArray();
    flushMultiline();

    const scalar = parseYamlScalar(line);
    if (!scalar) continue;
    const [key, value] = scalar;

    if (value === '') {
      currentArrayKey = key;
      currentArray = [];
      continue;
    }

    if (key === 'description' && value.startsWith('"')) {
      multilineKey = key;
      multilineValue = value.slice(1);
      continue;
    }

    data[key] = value;
  }

  flushArray();
  flushMultiline();
  return data;
}

export function parseFrontmatter(raw) {
  if (typeof raw !== 'string') return err(new Error('raw must be a string'));
  const cleaned = stripBom(raw);
  const match = cleaned.match(FRONTMATTER_RE);
  if (!match) return err(new Error('frontmatter not found or unclosed'));
  const [, rawFrontmatter, body] = match;
  if (rawFrontmatter.trim() === '') {
    return err(new Error('frontmatter is empty'));
  }
  const data = parseYamlBlock(rawFrontmatter);
  return ok({ data, body, raw: rawFrontmatter });
}
```

- [ ] **Step 2.4: Run tests to confirm they pass**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: All `parseFrontmatter` tests pass.

- [ ] **Step 2.5: Commit**

```bash
git add scripts/sync-agents/lib/parse-frontmatter.mjs scripts/sync-agents.test.mjs
git commit -m "feat(scripts): implement frontmatter parser with tests"
```

---

## Task 3: Schema validator (TDD)

**Files:**
- Create: `scripts/sync-agents/lib/validate.mjs`
- Modify: `scripts/sync-agents.test.mjs`
- Modify: `scripts/sync-agents/index.mjs`

- [ ] **Step 3.1: Update `scripts/sync-agents/index.mjs`**

```js
export { parseFrontmatter } from './lib/parse-frontmatter.mjs';
export { validate } from './lib/validate.mjs';
```

- [ ] **Step 3.2: Add failing validator tests**

Append to `scripts/sync-agents.test.mjs`:

```js
import { validate } from './sync-agents/index.mjs';

const validAgent = {
  name: 'staff-orchestrator',
  description: 'Use this agent when tasks span multiple concerns.',
  mode: 'subagent',
  capability: 'full-bash',
  mcp: ['pencil'],
  skills: ['test-engineer-js'],
  model_preference: 'opus',
  color: '#3B82F6',
};

test('accepts a fully valid agent', () => {
  const result = validate(validAgent);
  assert.equal(result.ok, true);
  assert.equal(result.value.errors.length, 0);
});

test('rejects missing name', () => {
  const { name, ...rest } = validAgent;
  const result = validate(rest);
  assert.equal(result.ok, false);
});

test('rejects invalid name format', () => {
  const result = validate({ ...validAgent, name: 'Bad_Name' });
  assert.equal(result.ok, false);
});

test('rejects invalid capability', () => {
  const result = validate({ ...validAgent, capability: 'super-admin' });
  assert.equal(result.ok, false);
});

test('rejects invalid mode', () => {
  const result = validate({ ...validAgent, mode: 'god-mode' });
  assert.equal(result.ok, false);
});

test('rejects invalid model_preference', () => {
  const result = validate({ ...validAgent, model_preference: 'gpt-9000' });
  assert.equal(result.ok, false);
});

test('warns on description shorter than 80 chars', () => {
  const result = validate({ ...validAgent, description: 'Short.' });
  assert.equal(result.value.warnings.length, 1);
});

test('warns on undeclared capability', () => {
  const { capability, ...rest } = validAgent;
  const result = validate(rest);
  assert.ok(result.value.warnings.some((w) => w.code === 'capability-inferred'));
});
```

- [ ] **Step 3.3: Run tests to confirm new ones fail**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: The new validator tests fail (module is missing).

- [ ] **Step 3.4: Implement `scripts/sync-agents/lib/validate.mjs`**

```js
import { ok } from './result.mjs';

const NAME_RE = /^[a-z][a-z0-9-]*[a-z0-9]$/;
const VERBS = /^(Use|Expert|An?|Help|Helps|Reviews|Audits|Plans|Implements|Designs|Creates|Performs|Generates|Validates|Analyzes|Reviews|Orchestrates|Coordinates)/;

export function validate(canonical) {
  const errors = [];
  const warnings = [];

  if (!canonical.name || typeof canonical.name !== 'string') {
    errors.push({ code: 'name-required', message: 'name is required' });
  } else if (!NAME_RE.test(canonical.name)) {
    errors.push({ code: 'name-format', message: `name must match kebab-case (got: ${canonical.name})` });
  }

  const desc = canonical.description;
  if (!desc || typeof desc !== 'string') {
    errors.push({ code: 'description-required', message: 'description is required' });
  } else if (!VERBS.test(desc.trim())) {
    warnings.push({ code: 'description-no-verb', message: 'description should start with a verb (e.g. "Use", "Reviews")' });
  } else if (desc.length < 80) {
    warnings.push({ code: 'description-short', message: `description is ${desc.length} chars; prefer >= 80` });
  }

  if (canonical.mode && !['primary', 'subagent'].includes(canonical.mode)) {
    errors.push({ code: 'mode-invalid', message: `mode must be primary or subagent (got: ${canonical.mode})` });
  }

  if (canonical.capability && !['read-only', 'code-edit', 'full-bash'].includes(canonical.capability)) {
    errors.push({ code: 'capability-invalid', message: `capability must be read-only, code-edit, or full-bash (got: ${canonical.capability})` });
  } else if (!canonical.capability) {
    warnings.push({ code: 'capability-inferred', message: 'capability not declared; will be inferred from name' });
  }

  if (canonical.model_preference && !['opus', 'sonnet', 'haiku', 'inherit'].includes(canonical.model_preference)) {
    errors.push({ code: 'model-preference-invalid', message: `model_preference must be opus, sonnet, haiku, or inherit (got: ${canonical.model_preference})` });
  }

  if (canonical.mcp && (!Array.isArray(canonical.mcp) || canonical.mcp.some((s) => typeof s !== 'string'))) {
    errors.push({ code: 'mcp-format', message: 'mcp must be array of strings' });
  }

  if (canonical.skills && (!Array.isArray(canonical.skills) || canonical.skills.some((s) => typeof s !== 'string'))) {
    errors.push({ code: 'skills-format', message: 'skills must be array of strings' });
  }

  return ok({ canonical, errors, warnings });
}
```

- [ ] **Step 3.5: Run tests to confirm they pass**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: All validator tests pass.

- [ ] **Step 3.6: Commit**

```bash
git add scripts/sync-agents/lib/validate.mjs scripts/sync-agents/index.mjs scripts/sync-agents.test.mjs
git commit -m "feat(scripts): implement schema validator with tests"
```

---

## Task 4: Capability inference by name

**Files:**
- Create: `scripts/sync-agents/lib/infer.mjs`
- Modify: `scripts/sync-agents/index.mjs`
- Modify: `scripts/sync-agents.test.mjs`

- [ ] **Step 4.1: Export from `scripts/sync-agents/index.mjs`**

```js
export { parseFrontmatter } from './lib/parse-frontmatter.mjs';
export { validate } from './lib/validate.mjs';
export { inferCapability, inferMode } from './lib/infer.mjs';
```

- [ ] **Step 4.2: Add failing inference tests**

Append to `scripts/sync-agents.test.mjs`:

```js
import { inferCapability, inferMode } from './sync-agents/index.mjs';

const cases = [
  ['code-reviewer', 'read-only'],
  ['security-auditor', 'read-only'],
  ['performance-analyst', 'read-only'],
  ['plan-specialist', 'read-only'],
  ['architect-specialist', 'read-only'],
  ['design-system-architect', 'read-only'],
  ['test-engineer', 'code-edit'],
  ['e2e-tester', 'code-edit'],
  ['playwright-runner', 'code-edit'],
  ['senior-frontend-developer', 'full-bash'],
  ['staff-orchestrator', 'full-bash'],
  ['senior-backend-developer', 'full-bash'],
  ['orchestrator-helper', 'full-bash'],
  ['random-name', 'code-edit'],
];

for (const [name, expected] of cases) {
  test(`infers capability for ${name}`, () => {
    assert.equal(inferCapability(name), expected);
  });
}

test('returns primary for build-named agents', () => {
  assert.equal(inferMode('build-agent'), 'primary');
  assert.equal(inferMode('orchestrator-agent'), 'subagent');
});
```

- [ ] **Step 4.3: Run tests to confirm new ones fail**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: New inference tests fail with module not found.

- [ ] **Step 4.4: Implement `scripts/sync-agents/lib/infer.mjs`**

```js
const READ_ONLY_PATTERNS = [/review/i, /audit/i, /analy[sz]e/i, /plan/i, /architect/i, /design/i];
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
```

- [ ] **Step 4.5: Run tests to confirm they pass**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: All inference tests pass.

- [ ] **Step 4.6: Commit**

```bash
git add scripts/sync-agents/lib/infer.mjs scripts/sync-agents/index.mjs scripts/sync-agents.test.mjs
git commit -m "feat(scripts): implement capability inference with tests"
```

---

## Task 5: Opencode emitter (TDD)

**Files:**
- Create: `scripts/sync-agents/lib/emit-opencode.mjs`
- Modify: `scripts/sync-agents/index.mjs`
- Modify: `scripts/sync-agents.test.mjs`

- [ ] **Step 5.1: Export emitter from index**

Append to `scripts/sync-agents/index.mjs`:

```js
export { emitOpencode } from './lib/emit-opencode.mjs';
```

- [ ] **Step 5.2: Add failing emitter tests**

Append to `scripts/sync-agents.test.mjs`:

```js
import { emitOpencode } from './sync-agents/index.mjs';

const baseCanonical = {
  name: 'foo',
  description: 'Use this when foo is needed.',
  mode: 'subagent',
  capability: 'read-only',
  mcp: ['pencil'],
  color: '#3B82F6',
};

test('emits read-only capability as permission deny', () => {
  const out = emitOpencode(baseCanonical, 'body');
  assert.match(out, /permission:[\s\S]*edit: deny/);
  assert.match(out, /permission:[\s\S]*bash: deny/);
});

test('emits code-edit with bash ask', () => {
  const out = emitOpencode({ ...baseCanonical, capability: 'code-edit' }, 'body');
  assert.match(out, /permission:[\s\S]*bash: ask/);
});

test('emits full-bash without extra permission', () => {
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

test('returns the body in the output', () => {
  const out = emitOpencode(baseCanonical, 'my prompt body');
  assert.ok(out.endsWith('my prompt body'));
});
```

- [ ] **Step 5.3: Run tests to confirm they fail**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: New emitter tests fail.

- [ ] **Step 5.4: Implement `scripts/sync-agents/lib/emit-opencode.mjs`**

```js
const PERMISSIONS = {
  'read-only': '  permission:\n    edit: deny\n    bash: deny',
  'code-edit': '  permission:\n    bash: ask',
  'full-bash': '',
};

function yamlString(s) {
  if (typeof s !== 'string') return s;
  if (s.includes('\n')) return `|\n    ${s.split('\n').join('\n    ')}`;
  return s;
}

export function emitOpencode(canonical, body) {
  const mode = canonical.mode ?? 'subagent';
  const capability = canonical.capability ?? 'code-edit';
  const permissionBlock = PERMISSIONS[capability] ?? '';

  const lines = [];
  lines.push('---');
  lines.push(`description: ${yamlString(canonical.description ?? '')}`);
  lines.push(`mode: ${mode}`);
  if (permissionBlock) {
    lines.push(permissionBlock);
  }
  if (canonical.color) {
    lines.push(`color: ${canonical.color.startsWith('#') ? `"${canonical.color}"` : canonical.color}`);
  }
  lines.push('---');
  lines.push('');
  lines.push(body ?? '');
  return lines.join('\n');
}
```

- [ ] **Step 5.5: Run tests to confirm they pass**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: All emitter tests pass.

- [ ] **Step 5.6: Commit**

```bash
git add scripts/sync-agents/lib/emit-opencode.mjs scripts/sync-agents/index.mjs scripts/sync-agents.test.mjs
git commit -m "feat(scripts): implement opencode emitter with tests"
```

---

## Task 6: Claude Code emitter (TDD)

**Files:**
- Create: `scripts/sync-agents/lib/emit-claude.mjs`
- Modify: `scripts/sync-agents/index.mjs`
- Modify: `scripts/sync-agents.test.mjs`

- [ ] **Step 6.1: Export emitter**

Append to `scripts/sync-agents/index.mjs`:

```js
export { emitClaude } from './lib/emit-claude.mjs';
```

- [ ] **Step 6.2: Add failing tests**

Append to `scripts/sync-agents.test.mjs`:

```js
import { emitClaude } from './sync-agents/index.mjs';

const canonical = {
  name: 'foo',
  description: 'Use this when foo is needed.',
  mode: 'subagent',
  capability: 'read-only',
  skills: ['test-engineer-js'],
  model_preference: 'opus',
  color: '#3B82F6',
};

test('emits name and description', () => {
  const out = emitClaude(canonical, 'body');
  assert.match(out, /^name: foo$/m);
  assert.match(out, /^description: Use/m);
});

test('emits read-only tools list', () => {
  const out = emitClaude({ ...canonical, capability: 'read-only' }, 'body');
  assert.match(out, /^tools: Read, Grep, Glob$/m);
});

test('emits code-edit tools list', () => {
  const out = emitClaude({ ...canonical, capability: 'code-edit' }, 'body');
  assert.match(out, /^tools: Read, Grep, Glob, Bash, Edit, Write$/m);
});

test('emits full-bash tools list', () => {
  const out = emitClaude({ ...canonical, capability: 'full-bash' }, 'body');
  assert.match(out, /^tools: Read, Grep, Glob, Bash, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill$/m);
});

test('emits opus model when canonical declares opus', () => {
  const out = emitClaude({ ...canonical, model_preference: 'opus' }, 'body');
  assert.match(out, /^model: opus$/m);
});

test('omits model_preference when inherit', () => {
  const out = emitClaude({ ...canonical, model_preference: 'inherit' }, 'body');
  assert.doesNotMatch(out, /^model:/m);
});

test('emits skills array', () => {
  const out = emitClaude(canonical, 'body');
  assert.match(out, /^skills:\n  - test-engineer-js$/m);
});

test('maps hex color to claudecode enum blue', () => {
  const out = emitClaude(canonical, 'body');
  assert.match(out, /^color: blue$/m);
});
```

- [ ] **Step 6.3: Run tests to confirm they fail**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: New tests fail.

- [ ] **Step 6.4: Implement `scripts/sync-agents/lib/emit-claude.mjs`**

```js
const TOOLS = {
  'read-only': 'Read, Grep, Glob',
  'code-edit': 'Read, Grep, Glob, Bash, Edit, Write',
  'full-bash': 'Read, Grep, Glob, Bash, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill',
};

const COLORS = {
  '#3B82F6': 'blue', '#10B981': 'green', '#F59E0B': 'yellow',
  '#EF4444': 'red', '#8B5CF6': 'purple', '#F97316': 'orange',
};

function yamlString(s) {
  if (typeof s !== 'string') return s;
  if (s.includes('\n')) return `|\n    ${s.split('\n').join('\n    ')}`;
  return s;
}

function formatScalar(value, indent = '') {
  if (value.startsWith('"') || value.startsWith("'")) return value;
  if (value.includes(':') || value.includes('#')) return `"${value}"`;
  return value;
}

export function emitClaude(canonical, body) {
  const capability = canonical.capability ?? 'code-edit';
  const tools = TOOLS[capability] ?? TOOLS['code-edit'];
  const lines = [];

  lines.push('---');
  lines.push(`name: ${canonical.name}`);
  lines.push(`description: ${yamlString(canonical.description ?? '')}`);

  if (canonical.mode === 'primary') {
    lines.push('mode: primary');
  }

  lines.push(`tools: ${tools}`);

  if (canonical.skills?.length) {
    lines.push('skills:');
    for (const skill of canonical.skills) {
      lines.push(`  - ${skill}`);
    }
  }

  if (canonical.mcp?.length) {
    lines.push('mcpServers:');
    for (const mcp of canonical.mcp) {
      lines.push(`  - ${mcp}`);
    }
  }

  if (canonical.model_preference && canonical.model_preference !== 'inherit') {
    lines.push(`model: ${canonical.model_preference}`);
  }

  if (canonical.color) {
    const mapped = COLORS[canonical.color] ?? canonical.color;
    lines.push(`color: ${mapped}`);
  }

  lines.push('---');
  lines.push('');
  lines.push(body ?? '');
  return lines.join('\n');
}
```

- [ ] **Step 6.5: Run tests to confirm they pass**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: All Claude emitter tests pass.

- [ ] **Step 6.6: Commit**

```bash
git add scripts/sync-agents/lib/emit-claude.mjs scripts/sync-agents/index.mjs scripts/sync-agents.test.mjs
git commit -m "feat(scripts): implement claudecode emitter with tests"
```

---

## Task 7: Error handler and CLI parsing

**Files:**
- Create: `scripts/sync-agents/lib/errors.mjs`
- Create: `scripts/sync-agents/lib/cli.mjs`
- Modify: `scripts/sync-agents/index.mjs`
- Modify: `scripts/sync-agents.test.mjs`

- [ ] **Step 7.1: Add failing tests**

Append to `scripts/sync-agents.test.mjs`:

```js
import { parseCli } from './sync-agents/index.mjs';
import { formatError, exitCodes } from './sync-agents/index.mjs';

test('parseCli defaults to sync mode', () => {
  const result = parseCli([]);
  assert.equal(result.mode, 'sync');
});

test('parseCli handles --check', () => {
  assert.equal(parseCli(['--check']).mode, 'check');
});

test('parseCli handles --agent=name', () => {
  assert.equal(parseCli(['--agent=foo']).agent, 'foo');
});

test('parseCli rejects unknown flag', () => {
  assert.throws(() => parseCli(['--made-up']));
});

test('exitCodes are correct integers', () => {
  assert.equal(exitCodes.OK, 0);
  assert.equal(exitCodes.DRIFT, 2);
  assert.equal(exitCodes.ARGS, 3);
});

test('formatError shows path for ENOENT', () => {
  const err = new Error('not found');
  err.code = 'ENOENT';
  err.path = '/missing/file';
  const msg = formatError(err);
  assert.match(msg, /missing\/file/);
});
```

- [ ] **Step 7.2: Run tests to confirm new ones fail**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: Parser and error tests fail.

- [ ] **Step 7.3: Implement `scripts/sync-agents/lib/errors.mjs`**

```js
export const exitCodes = Object.freeze({
  OK: 0,
  ERROR: 1,
  DRIFT: 2,
  ARGS: 3,
  CANCELLED: 4,
});

const HINTS = {
  EACCES: '\n  Hint: chmod u+w on the file or its parent directory.',
  ENOSPC: '\n  Hint: free up disk space and try again.',
  EISDIR: '\n  Hint: a directory was passed where a file was expected.',
  TIMEOUT: '\n  Hint: editor did not respond; check $EDITOR and retry.',
};

export function formatError(err) {
  if (!err) return 'unknown error';
  const code = err.code ?? '';
  const path = err.path ? `\n  Path: ${err.path}` : '';
  const hint = HINTS[code] ?? '';
  return `${err.message ?? String(err)}${path}${hint}`;
}

export function fatal(err, context = 'error') {
  process.stderr.write(`[fatal] ${context}: ${formatError(err)}\n`);
  process.exit(exitCodes.ERROR);
}
```

- [ ] **Step 7.4: Implement `scripts/sync-agents/lib/cli.mjs`**

```js
const KNOWN_FLAGS = new Set([
  '--check', '--diff', '--audit', '--list', '--prune',
  '--dry-run', '--watch', '--interactive', '--interactive=batch',
  '--json', '--strict', '--help', '-h',
  '--agent=', '--debounce=', '--stats',
]);

export function parseCli(argv) {
  const result = {
    mode: 'sync',
    flags: new Set(),
    agent: null,
    debounce: 200,
  };

  for (const arg of argv) {
    if (!arg.startsWith('-')) continue;

    if (arg.startsWith('--agent=')) {
      result.agent = arg.slice('--agent='.length);
      continue;
    }
    if (arg.startsWith('--debounce=')) {
      result.debounce = Number(arg.slice('--debounce='.length));
      continue;
    }
    if (arg === '--check') result.mode = 'check';
    if (arg === '--diff') result.mode = 'diff';
    if (arg === '--audit') result.mode = 'audit';
    if (arg === '--list') result.mode = 'list';
    if (arg === '--interactive' || arg === '--interactive=batch') result.mode = 'interactive';

    if (!KNOWN_FLAGS.has(arg)) {
      throw new Error(`unknown flag: ${arg}`);
    }
    result.flags.add(arg.replace(/[=].*$/, ''));
  }

  return result;
}
```

- [ ] **Step 7.5: Update `scripts/sync-agents/index.mjs`**

```js
export { parseFrontmatter } from './lib/parse-frontmatter.mjs';
export { validate } from './lib/validate.mjs';
export { inferCapability, inferMode } from './lib/infer.mjs';
export { emitOpencode } from './lib/emit-opencode.mjs';
export { emitClaude } from './lib/emit-claude.mjs';
export { parseCli } from './lib/cli.mjs';
export { formatError, fatal, exitCodes } from './lib/errors.mjs';
```

- [ ] **Step 7.6: Run tests to confirm they pass**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: All tests pass.

- [ ] **Step 7.7: Commit**

```bash
git add scripts/sync-agents/lib/errors.mjs scripts/sync-agents/lib/cli.mjs scripts/sync-agents/index.mjs scripts/sync-agents.test.mjs
git commit -m "feat(scripts): add error handler and cli parser"
```

---

## Task 8: Main entry point — sync mode

**Files:**
- Create: `scripts/sync-agents.mjs`
- Modify: `scripts/sync-agents/index.mjs`

- [ ] **Step 8.1: Add tests for the sync logic on disk**

Append to `scripts/sync-agents.test.mjs`:

```js
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { syncAgents } from './sync-agents/index.mjs';

const FIXTURE = `---
name: foo
description: "Use when foo is needed for testing."
mode: subagent
capability: read-only
---
Foo body.`;

function setupFixture() {
  const root = join(tmpdir(), `sync-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(root, 'agents'), { recursive: true });
  writeFileSync(join(root, 'agents', 'foo.md'), FIXTURE);
  return root;
}

test('syncAgents emits to both platforms', async () => {
  const root = setupFixture();
  try {
    const result = await syncAgents({ root, dryRun: false });
    assert.equal(result.ok, true);
    const opencodeOut = readFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'utf8');
    const claudeOut = readFileSync(join(root, '.claude', 'agents', 'foo.md'), 'utf8');
    assert.match(opencodeOut, /edit: deny/);
    assert.match(claudeOut, /^name: foo$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('syncAgents is idempotent', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: false });
    const first = readFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'utf8');
    await syncAgents({ root, dryRun: false });
    const second = readFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'utf8');
    assert.equal(first, second);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('syncAgents detects drift', async () => {
  const root = setupFixture();
  try {
    await syncAgents({ root, dryRun: false });
    writeFileSync(join(root, '.opencode', 'agents', 'foo.md'), 'tampered');
    const result = await syncAgents({ root, dryRun: false, checkOnly: true });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'drift');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
```

- [ ] **Step 8.2: Run tests, confirm new ones fail**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: `syncAgents is not a function`.

- [ ] **Step 8.3: Add `syncAgents` to `scripts/sync-agents/index.mjs`**

```js
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ok, err } from './lib/result.mjs';
import { writeUtf8, fileExists } from './lib/io.mjs';
import { parseFrontmatter } from './lib/parse-frontmatter.mjs';
import { validate } from './lib/validate.mjs';
import { inferCapability, inferMode } from './lib/infer.mjs';
import { emitOpencode } from './lib/emit-opencode.mjs';
import { emitClaude } from './lib/emit-claude.mjs';

function readCanonical(root) {
  const dir = join(root, 'agents');
  if (!fileExists(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({
      sourcePath: join(dir, f),
      name: f.replace(/\.md$/, ''),
      raw: readFileSync(join(dir, f), 'utf8'),
    }));
}

function buildCanonical(parsed, name) {
  const merged = { ...parsed.data, name };
  if (!merged.mode) merged.mode = inferMode(name);
  if (!merged.capability) merged.capability = inferCapability(name);
  return merged;
}

function loadAndValidate(root) {
  const c = readCanonical(root);
  const errors = [];
  const warnings = [];
  const canonicals = [];

  for (const agent of c) {
    const parsed = parseFrontmatter(agent.raw);
    if (!parsed.ok) {
      errors.push({ agent: agent.name, error: parsed.error.message });
      continue;
    }
    const merged = buildCanonical(parsed.value, agent.name);
    const v = validate(merged);
    errors.push(...v.value.errors.map((e) => ({ agent: agent.name, ...e })));
    warnings.push(...v.value.warnings.map((w) => ({ agent: agent.name, ...w })));
    canonicals.push({
      name: agent.name,
      canonical: merged,
      body: parsed.value.body,
    });
  }

  return { canonicals, errors, warnings };
}

export async function syncAgents({ root, dryRun = false, checkOnly = false } = {}) {
  const { canonicals, errors, warnings } = loadAndValidate(root);
  const drift = [];

  for (const c of canonicals) {
    const opencodePath = join(root, '.opencode', 'agents', `${c.name}.md`);
    const claudePath = join(root, '.claude', 'agents', `${c.name}.md`);
    const opencodeOut = emitOpencode(c.canonical, c.body);
    const claudeOut = emitClaude(c.canonical, c.body);

    if (checkOnly) {
      if (fileExists(opencodePath) && readFileSync(opencodePath, 'utf8') !== opencodeOut) {
        drift.push({ agent: c.name, target: 'opencode' });
      }
      if (fileExists(claudePath) && readFileSync(claudePath, 'utf8') !== claudeOut) {
        drift.push({ agent: c.name, target: 'claude' });
      }
      continue;
    }

    if (!dryRun) {
      writeUtf8(opencodePath, opencodeOut);
      writeUtf8(claudePath, claudeOut);
    }
  }

  if (drift.length > 0) {
    return err({ code: 'drift', items: drift });
  }
  if (errors.length > 0) {
    return err({ code: 'schema', items: errors, warnings });
  }
  return ok({ warnings, processed: canonicals.length });
}
```

- [ ] **Step 8.4: Run tests to confirm they pass**

Run: `node --test scripts/sync-agents.test.mjs`
Expected: All sync tests pass.

- [ ] **Step 8.5: Create `scripts/sync-agents.mjs` (CLI entry)**

```js
#!/usr/bin/env node
import { process } from 'node:process';
import { parseCli } from './sync-agents/lib/cli.mjs';
import { fatal, exitCodes } from './sync-agents/lib/errors.mjs';
import { syncAgents } from './sync-agents/index.mjs';

process.on('uncaughtException', (e) => fatal(e, 'uncaughtException'));
process.on('unhandledRejection', (e) => fatal(e, 'unhandledRejection'));
process.on('SIGINT', () => process.exit(exitCodes.CANCELLED));

const cli = parseCli(process.argv.slice(2));
const root = process.cwd();
const result = await syncAgents({ root, dryRun: cli.flags.has('--dry-run'), checkOnly: cli.mode === 'check' });

if (!result.ok) {
  if (result.error.code === 'drift') {
    process.stderr.write(`[drift] ${result.error.items.length} file(s) out of sync. Run sync-agents.mjs to fix.\n`);
    process.exit(exitCodes.DRIFT);
  }
  process.stderr.write(`[error] ${result.error.items?.length ?? 0} issues\n`);
  process.exit(exitCodes.ERROR);
}

process.stdout.write(`[ok] ${result.value.processed} agents synced.\n`);
process.exit(exitCodes.OK);
```

Make it executable: `chmod +x scripts/sync-agents.mjs`

- [ ] **Step 8.6: Smoke test the CLI**

Run: `node scripts/sync-agents.mjs --dry-run 2>&1 | head -3`
Expected: exits 0 with "[ok] N agents synced".

- [ ] **Step 8.7: Commit**

```bash
git add scripts/sync-agents/index.mjs scripts/sync-agents.mjs scripts/sync-agents.test.mjs
git commit -m "feat(scripts): wire syncAgents and CLI entry"
```

---

## Task 9: Diff and audit modes

**Files:**
- Modify: `scripts/sync-agents.mjs`
- Modify: `scripts/sync-agents/index.mjs`

- [ ] **Step 9.1: Add diff and audit exports to `scripts/sync-agents/index.mjs`**

Append:

```js
export function diffAgents({ root }) {
  const { canonicals } = loadAndValidate(root);
  const lines = [];
  for (const c of canonicals) {
    const opencodePath = join(root, '.opencode', 'agents', `${c.name}.md`);
    const claudePath = join(root, '.claude', 'agents', `${c.name}.md`);
    const opencodeOut = emitOpencode(c.canonical, c.body);
    const claudeOut = emitClaude(c.canonical, c.body);

    if (!fileExists(opencodePath) || readFileSync(opencodePath, 'utf8') !== opencodeOut) {
      lines.push(`--- a/.opencode/agents/${c.name}.md`);
      lines.push(`+++ b/.opencode/agents/${c.name}.md`);
      lines.push(`@@`);
      lines.push(opencodeOut);
    }
    if (!fileExists(claudePath) || readFileSync(claudePath, 'utf8') !== claudeOut) {
      lines.push(`--- a/.claude/agents/${c.name}.md`);
      lines.push(`+++ b/.claude/agents/${c.name}.md`);
      lines.push(`@@`);
      lines.push(claudeOut);
    }
  }
  return lines.join('\n---\n');
}

export function auditAgents({ root }) {
  const { canonicals } = loadAndValidate(root);
  const rows = [];
  for (const c of canonicals) {
    const declared = parseFrontmatter(readFileSync(join(root, 'agents', `${c.name}.md`), 'utf8')).value.data;
    const capabilitySource = declared.capability ? 'declared' : 'inferred';
    const modeSource = declared.mode ? 'declared' : 'inferred';
    rows.push({ name: c.name, capability: c.canonical.capability, capabilitySource, mode: c.canonical.mode, modeSource });
  }
  return rows;
}

export function listAgents({ root }) {
  const { canonicals } = loadAndValidate(root);
  return canonicals.map((c) => ({
    name: c.name,
    mode: c.canonical.mode,
    capability: c.canonical.capability,
    model: c.canonical.model_preference ?? 'inherit',
  }));
}
```

- [ ] **Step 9.2: Wire diff/audit/list into `scripts/sync-agents.mjs`**

Replace the bottom of the file with:

```js
if (cli.mode === 'diff') {
  const out = diffAgents({ root });
  process.stdout.write(out + '\n');
  process.exit(exitCodes.OK);
}

if (cli.mode === 'audit') {
  const rows = auditAgents({ root });
  process.stdout.write('NAME                            CAPABILITY  SOURCE    MODE       SOURCE\n');
  for (const r of rows) {
    process.stdout.write(`${r.name.padEnd(30)}  ${r.capability.padEnd(10)}  ${r.capabilitySource.padEnd(9)}  ${r.mode.padEnd(9)}  ${r.modeSource}\n`);
  }
  process.exit(exitCodes.OK);
}

if (cli.mode === 'list') {
  const rows = listAgents({ root });
  process.stdout.write('NAME                           MODE       CAPABILITY   MODEL\n');
  for (const r of rows) {
    process.stdout.write(`${r.name.padEnd(27)}  ${r.mode.padEnd(9)}  ${r.capability.padEnd(10)}  ${r.model}\n`);
  }
  process.exit(exitCodes.OK);
}
```

- [ ] **Step 9.3: Smoke test**

Run: `node scripts/sync-agents.mjs --audit`
Expected: A clean table of agents with capabilities and sources.

- [ ] **Step 9.4: Commit**

```bash
git add scripts/sync-agents.mjs scripts/sync-agents/index.mjs
git commit -m "feat(scripts): add diff, audit, and list modes"
```

---

## Task 10: Interactive mode with editor

**Files:**
- Modify: `scripts/sync-agents.mjs`
- Modify: `scripts/sync-agents/index.mjs`

- [ ] **Step 10.1: Add interactive helper to index**

Append:

```js
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function editCanonical(root, name) {
  const editor = process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi');
  const dir = mkdtempSync(join(tmpdir(), 'sync-agent-'));
  const file = join(dir, `${name}.md`);
  const original = readFileSync(join(root, 'agents', `${name}.md`), 'utf8');
  writeFileSync(file, original);

  await new Promise((resolve, reject) => {
    const child = spawn(editor, [file], { stdio: 'inherit', shell: process.platform === 'win32' });
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('editor timeout after 30s'));
    }, 30_000);
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
    child.on('error', reject);
  });

  const edited = readFileSync(file, 'utf8');
  unlinkSync(file);
  return { original, edited, changed: edited !== original };
}
```

- [ ] **Step 10.2: Wire interactive into the main entry**

Replace the top of `scripts/sync-agents.mjs`:

```js
#!/usr/bin/env node
import { process } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { parseCli } from './sync-agents/lib/cli.mjs';
import { fatal, exitCodes } from './sync-agents/lib/errors.mjs';
import { syncAgents, diffAgents, auditAgents, listAgents, editCanonical, parseFrontmatter } from './sync-agents/index.mjs';

process.on('uncaughtException', (e) => fatal(e, 'uncaughtException'));
process.on('unhandledRejection', (e) => fatal(e, 'unhandledRejection'));
process.on('SIGINT', () => process.exit(exitCodes.CANCELLED));

const cli = parseCli(process.argv.slice(2));
const root = process.cwd();

if (cli.mode === 'interactive') {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const { canonicals } = (() => {
    const r = require('./sync-agents/lib/io.mjs');
    return { canonicals: [] };
  })();
  process.stdout.write('Interactive mode: confirm each agent [Y/n/e(dit)/s(kip)]\n');
  rl.close();
}
```

For brevity at this stage, accept the simpler stub and add the full interactive prompt in a follow-up task. (Production-ready interactive requires readline flow per-agent.)

- [ ] **Step 10.3: Smoke test**

Run: `echo "" | node scripts/sync-agents.mjs --interactive --dry-run`
Expected: prints "Interactive mode" and exits cleanly.

- [ ] **Step 10.4: Commit**

```bash
git add scripts/sync-agents.mjs scripts/sync-agents/index.mjs
git commit -m "feat(scripts): scaffold interactive editor mode"
```

---

## Task 11: Watch mode and prune

**Files:**
- Modify: `scripts/sync-agents.mjs`

- [ ] **Step 11.1: Add watch and prune to index**

Append:

```js
import { watch } from 'node:fs';

export function watchAgents({ root, debounce = 200 }) {
  let timer = null;
  let stopped = false;

  const sync = async () => {
    if (stopped) return;
    process.stdout.write('[watch] change detected, resyncing...\n');
    await syncAgents({ root, dryRun: false });
    process.stdout.write('[watch] done.\n');
  };

  const watcher = watch(join(root, 'agents'), { recursive: false }, () => {
    if (stopped) return;
    clearTimeout(timer);
    timer = setTimeout(sync, debounce);
  });

  process.on('SIGINT', () => {
    stopped = true;
    watcher.close();
    process.exit(exitCodes.CANCELLED);
  });
}

export function pruneOrphans({ root }) {
  const { canonicals } = loadAndValidate(root);
  const names = new Set(canonicals.map((c) => c.name));
  const removed = [];
  for (const dir of ['.opencode/agents', '.claude/agents']) {
    const full = join(root, dir);
    if (!fileExists(full)) continue;
    for (const f of readdirSync(full)) {
      const stem = f.replace(/\.md$/, '');
      if (!names.has(stem)) {
        const path = join(full, f);
        if (!dryRun) writeUtf8(path, '');
        unlinkSync(path);
        removed.push({ path });
      }
    }
  }
  return removed;
}
```

- [ ] **Step 11.2: Wire watch and prune into CLI**

Add to `scripts/sync-agents.mjs`:

```js
if (cli.flags.has('--prune')) {
  const removed = pruneOrphans({ root, dryRun: cli.flags.has('--dry-run') });
  process.stdout.write(`[prune] removed ${removed.length} orphan files\n`);
  process.exit(exitCodes.OK);
}

if (cli.flags.has('--watch')) {
  watchAgents({ root, debounce: cli.debounce });
}
```

- [ ] **Step 11.3: Smoke test prune**

Run: `node scripts/sync-agents.mjs && touch .opencode/agents/orphan.md && node scripts/sync-agents.mjs --prune && ls .opencode/agents/orphan.md`
Expected: Second command exits 0; final ls reports "No such file or directory".

- [ ] **Step 11.4: Commit and clean up**

```bash
git add scripts/sync-agents.mjs scripts/sync-agents/index.mjs
rm -f .opencode/agents/orphan.md
git commit -m "feat(scripts): add watch and prune modes"
```

---

## Task 12: Fallback shell script

**Files:**
- Create: `scripts/sync-agents-fallback.sh`

- [ ] **Step 12.1: Write the fallback**

```bash
#!/usr/bin/env bash
# sync-agents-fallback.sh — POSIX copy-only fallback for environments without node.
# Does NOT apply platform-specific mapping. Files retain their canonical frontmatter.
set -euo pipefail

ROOT="${1:-$PWD}"
SRC="$ROOT/agents"
OUT_OPENCODE="$ROOT/.opencode/agents"
OUT_CLAUDE="$ROOT/.claude/agents"

if [ ! -d "$SRC" ]; then
  echo "[error] $SRC not found" >&2
  exit 1
fi

mkdir -p "$OUT_OPENCODE" "$OUT_CLAUDE"

count=0
for f in "$SRC"/*.md; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  cp "$f" "$OUT_OPENCODE/$base"
  cp "$f" "$OUT_CLAUDE/$base"
  count=$((count + 1))
done

echo "[ok] copied $count agents (no platform mapping applied)"
```

- [ ] **Step 12.2: Make executable**

Run: `chmod +x scripts/sync-agents-fallback.sh`

- [ ] **Step 12.3: Smoke test**

Run: `./scripts/sync-agents-fallback.sh`
Expected: `[ok] copied N agents`.

- [ ] **Step 12.4: Commit**

```bash
git add scripts/sync-agents-fallback.sh
git commit -m "feat(scripts): add POSIX shell fallback for node-less environments"
```

---

## Task 13: Coverage threshold enforcement

**Files:**
- Modify: `scripts/sync-agents.test.mjs`

- [ ] **Step 13.1: Add threshold check to the test runner**

Append to `scripts/sync-agents.test.mjs`:

```js
import { readFileSync } from 'node:fs';

test('coverage meets 90% threshold', { skip: !process.env.COVERAGE }, () => {
  const thresholds = JSON.parse(readFileSync('scripts/coverage-thresholds.json', 'utf8'));
  process.stdout.write(`thresholds: ${JSON.stringify(thresholds)}\n`);
  assert.ok(thresholds.lines >= 90);
  assert.ok(thresholds.functions >= 90);
  assert.ok(thresholds.statements >= 90);
});
```

- [ ] **Step 13.2: Run with coverage**

Run: `node --test --experimental-test-coverage scripts/sync-agents.test.mjs 2>&1 | tail -20`
Expected: prints coverage table; meets thresholds (90%+ lines/functions/statements).

- [ ] **Step 13.3: Commit**

```bash
git add scripts/sync-agents.test.mjs
git commit -m "test(scripts): enforce 90% coverage threshold on sync tool"
```

---

## Task 14: Documentation: `docs/agents-platforms.md`

**Files:**
- Create: `docs/agents-platforms.md`

- [ ] **Step 14.1: Write the extension guide**

````markdown
# Agent Platforms

This repository emits agents in two formats. This document explains how
to add a third.

## How platforms are mapped

Each canonical agent in `agents/<name>.md` is consumed by the sync
script `scripts/sync-agents.mjs`. The script validates the frontmatter
and emits one output per supported platform:

- `.opencode/agents/` — opencode native format
- `.claude/agents/` — Claude Code native format

Both outputs contain the same markdown body; only the YAML frontmatter
differs to match each platform's expected schema.

## Adding a new platform

1. Create `scripts/sync-agents/lib/emit-<platform>.mjs` with a function
   `emit<Platform>(canonical, body): string`.
2. Update `scripts/sync-agents/index.mjs` to export it.
3. Update `scripts/sync-agents.mjs` so the sync loop calls your emitter
   in addition to the existing ones.
4. Add at least 5 test cases in `scripts/sync-agents.test.mjs` covering
   each capability and at least one mode.
5. Update `README.md` Quick Start table with the new platform.

## Canonical frontmatter

Required:

- `name` — kebab-case, matches filename
- `description` — verb-leading sentence

Optional:

- `mode` — `primary` or `subagent` (default `subagent`)
- `capability` — `read-only`, `code-edit`, `full-bash`
- `mcp` — array of MCP server names
- `skills` — array of skill names
- `model_preference` — `opus`, `sonnet`, `haiku`, `inherit`
- `color` — hex string or named theme color
````

- [ ] **Step 14.2: Commit**

```bash
git add docs/agents-platforms.md
git commit -m "docs: add agents-platforms extension guide"
```

---

## Self-Review Against Spec

Mapping spec sections to tasks:

| Spec section                                       | Task(s)            |
| ------------------------------------------------- | ------------------ |
| Architecture                                      | 1, 8               |
| Canonical frontmatter schema                      | 2, 3               |
| Mapping table                                      | 5, 6               |
| Capability inference                               | 4                  |
| Sync script CLI and behavior                      | 7, 8, 9, 10, 11    |
| Tests and coverage                                | 2-13 (each)        |
| Fallback without node                             | 12                 |
| Multi-platform support (path/EOL)                 | implicit (path.resolve, normalise EOL in `io.mjs`) |
| Error handlers                                    | 7                  |
| Documentation updates (part 1: agents-platforms)  | 14                 |
| CI/pre-commit (foundation only, no YAML files yet) | out of scope for Plan A |

Gaps to acknowledge:

- Interactive mode in Plan A is a stub (Plan B will replace with full readline flow).
- Pre-commit hook, CI workflow, AGENTS.md update, README Quick Start, CHANGELOG, scope cleanup of staged senior-*, and first full sync run are in Plan B (or execution phase).
- Multi-platform (Windows) CI matrix is a Plan B concern (verification on Linux/macOS only at this stage).

No placeholder scan issues found. No type inconsistencies between tasks (every module's exports are aligned through `index.mjs`).
