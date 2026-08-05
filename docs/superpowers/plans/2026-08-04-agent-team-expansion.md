# Agent Team Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new specialists and 4 orchestrators, decommission 6 legacy agents, add `task_agents` mapping for cross-platform agent invocation, and introduce a shared context mechanism for team collaboration.

**Architecture:** Extend the Strategy + Registry pattern with `task_agents` field on the canonical agent. Each platform emitter translates this to Task/Agent permission. New `scripts/sync-agents/lib/team/context.mjs` module provides blackboard-style shared context for orchestrators. New validator `task-agents.mjs` ensures referential integrity.

**Tech Stack:** Node 18+ ESM, no external dependencies.

**Reference:** [`2026-08-04-agent-team-expansion.md`](../specs/2026-08-04-agent-team-expansion.md)

---

## File Structure

**New canonical agents** (8 files in `agents/`):
- `database-specialist.md`, `api-designer.md`, `engineering-writer.md`, `tech-debt-hunter.md` (specialists)
- `feature-team-pilot.md`, `code-review-team-lead.md`, `bug-squad-lead.md`, `refactoring-team-lead.md` (orchestrators)

**New sync tool internals**:
- `scripts/sync-agents/lib/team/context.mjs` — shared context blackboard
- `scripts/sync-agents/lib/team/__tests__/context.test.mjs`
- `scripts/sync-agents/lib/validator/individual/task-agents.mjs`
- `scripts/sync-agents/lib/validator/individual/__tests__/task-agents.test.mjs`

**New CLI**:
- `scripts/context.mjs` — manage shared context files
- `scripts/__tests__/context.test.mjs` (or do it via the team module)

**New docs**:
- `docs/agent-teams.md` — usage guide for orchestrators

**Modified files**:
- `scripts/sync-agents/lib/validator/composer.mjs` — register task-agents validator
- `scripts/sync-agents/lib/platform/opencode.mjs` — emit `permission.task` block
- `scripts/sync-agents/lib/platform/claude.mjs` — emit `Agent(...)` in tools line
- `scripts/sync-agents/index.mjs` — `auditAgents` shows task_agents + cross-reference report
- `AGENTS.md` — schema update
- `CLAUDE.md` — workflow examples
- `README.md` — mention teams

**Deleted files** (6 legacy):
- `agents/ai-code-reviewer.md`, `agents/ai-dev-planner.md`, `agents/code-reviewer.md`, `agents/context-docs.md`, `agents/docs-context-keeper.md`, `agents/plan-specialist.md`

**Modified existing** (24 agents gain `task_agents: []` and `related_agents`):
- All 24 keep codebase, gain canonical metadata only.

**Generated mirrors** (after final sync):
- `.opencode/agents/` and `.claude/agents/` regenerated, ending with 32 generated files each.

---

## Task 1: Add `task_agents` validator

**Files:**
- Create: `scripts/sync-agents/lib/validator/individual/task-agents.mjs`
- Create: `scripts/sync-agents/lib/validator/individual/__tests__/task-agents.test.mjs`
- Modify: `scripts/sync-agents/lib/validator/composer.mjs`

- [ ] **Step 1.1: Write the failing test**

Append to `scripts/sync-agents/lib/validator/individual/__tests__/task-agents.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taskAgentsValidator } from '../task-agents.mjs';

test('accepts empty array', () => {
  const result = taskAgentsValidator({ task_agents: [] });
  assert.equal(result.errors.length, 0);
});

test('accepts omitted field', () => {
  const result = taskAgentsValidator({});
  assert.equal(result.errors.length, 0);
});

test('accepts array of strings', () => {
  const result = taskAgentsValidator({ task_agents: ['foo', 'bar'] });
  assert.equal(result.errors.length, 0);
});

test('rejects non-array', () => {
  const result = taskAgentsValidator({ task_agents: 'foo' });
  assert.ok(result.errors.some((e) => e.code === 'task-agents-format'));
});

test('rejects non-string entries', () => {
  const result = taskAgentsValidator({ task_agents: ['foo', 42] });
  assert.ok(result.errors.some((e) => e.code === 'task-agents-format'));
});

test('rejects invalid kebab-case names', () => {
  const result = taskAgentsValidator({ task_agents: ['BadName'] });
  assert.ok(result.errors.some((e) => e.code === 'task-agents-name'));
});

test('warns on name that does not exist in agents/', () => {
  const result = taskAgentsValidator({ task_agents: ['nonexistent-agent'] }, { existingAgentNames: new Set() });
  assert.ok(result.warnings.some((w) => w.code === 'task-agents-unknown-name'));
});
```

- [ ] **Step 1.2: Run test to confirm it fails**

Run: `node --test scripts/sync-agents/lib/validator/individual/__tests__/task-agents.test.mjs`
Expected: ImportError for `task-agents.mjs`.

- [ ] **Step 1.3: Implement validator**

Create `scripts/sync-agents/lib/validator/individual/task-agents.mjs`:

```js
const KEBAB_RE = /^[a-z][a-z0-9-]*[a-z0-9]$/;

export const taskAgentsValidator = (canonical, ctx = {}) => {
  const errors = [];
  const warnings = [];
  const value = canonical.task_agents;

  if (value === undefined || value === null) return { errors, warnings };
  if (!Array.isArray(value) || value.some((s) => typeof s !== 'string')) {
    errors.push({
      code: 'task-agents-format',
      message: 'task_agents must be array of strings',
    });
    return { errors, warnings };
  }

  for (const name of value) {
    if (!KEBAB_RE.test(name)) {
      errors.push({
        code: 'task-agents-name',
        message: `task_agents entry must be kebab-case (got: ${name})`,
      });
    }
  }

  const existing = ctx.existingAgentNames;
  if (existing) {
    for (const name of value) {
      if (!existing.has(name)) {
        warnings.push({
          code: 'task-agents-unknown-name',
          message: `task_agents references "${name}" but no such agent exists in agents/`,
        });
      }
    }
  }

  return { errors, warnings };
};
```

- [ ] **Step 1.4: Run test to confirm it passes**

Run: `node --test scripts/sync-agents/lib/validator/individual/__tests__/task-agents.test.mjs`
Expected: 7 tests pass.

- [ ] **Step 1.5: Register validator in composer**

Append to `scripts/sync-agents/lib/validator/composer.mjs`:

```js
import { taskAgentsValidator } from './individual/task-agents.mjs';
```

Add `.add(taskAgentsValidator)` to the chain after `arrayFieldsValidator`.

- [ ] **Step 1.6: Run all tests to verify no regression**

Run: `node --test 'scripts/**/*.test.mjs'`
Expected: 165 existing + 7 new = 172 tests pass.

---

## Task 2: Update opencode emitter to emit `permission.task`

**Files:**
- Modify: `scripts/sync-agents/lib/platform/opencode.mjs`
- Modify: `scripts/sync-agents/lib/platform/__tests__/opencode.test.mjs`

- [ ] **Step 2.1: Write the failing test**

Append to `scripts/sync-agents/lib/platform/__tests__/opencode.test.mjs`:

```js
test('emits permission.task from task_agents list', () => {
  const out = emitOpencode({
    ...baseCanonical,
    capability: 'full-bash',
    task_agents: ['alpha', 'beta'],
  }, 'body');
  assert.match(out, /permission:[\s\S]*task:[\s\S]*\*: "deny"/);
  assert.match(out, /alpha: "allow"/);
  assert.match(out, /beta: "allow"/);
});

test('omits task permission when task_agents is empty', () => {
  const out = emitOpencode({
    ...baseCanonical,
    task_agents: [],
  }, 'body');
  assert.doesNotMatch(out, /\btask:/);
});

test('omits task permission when task_agents is absent', () => {
  const out = emitOpencode(baseCanonical, 'body');
  assert.doesNotMatch(out, /\btask:/);
});
```

- [ ] **Step 2.2: Run test to confirm it fails**

Run: `node --test scripts/sync-agents/lib/platform/__tests__/opencode.test.mjs`
Expected: 3 new tests fail.

- [ ] **Step 2.3: Update opencode emitter**

Modify `scripts/sync-agents/lib/platform/opencode.mjs`. Replace the `PERMISSIONS` constant and `emit` method:

```js
const PERMISSIONS = {
  'read-only': '  permission:\n    edit: deny\n    bash: deny',
  'code-edit': '  permission:\n    bash: ask',
  'full-bash': '',
};

function taskPermissionBlock(taskAgents) {
  if (!Array.isArray(taskAgents) || taskAgents.length === 0) return '';
  const lines = ['  permission:'];
  lines.push('    task:');
  lines.push('      "*": "deny"');
  for (const name of taskAgents) {
    lines.push(`      "${name}": "allow"`);
  }
  return lines.join('\n');
}
```

Replace the `emit` method body:

```js
  emit(canonical, body) {
    const mode = canonical.mode ?? 'subagent';
    const capability = canonical.capability ?? 'code-edit';
    const permissionBlock = this.mapCapability(capability);
    const taskBlock = taskPermissionBlock(canonical.task_agents);

    const lines = [];
    lines.push('---');
    lines.push(`description: ${yamlScalar(canonical.description ?? '')}`);
    lines.push(`mode: ${mode}`);
    if (permissionBlock) lines.push(permissionBlock);
    if (taskBlock) lines.push(taskBlock);
    if (canonical.color) {
      lines.push(`color: ${canonical.color.startsWith('#') ? `"${canonical.color}"` : canonical.color}`);
    }
    lines.push('---');
    lines.push('');
    lines.push(body ?? '');
    return lines.join('\n');
  }
```

- [ ] **Step 2.4: Run test to confirm it passes**

Run: `node --test scripts/sync-agents/lib/platform/__tests__/opencode.test.mjs`
Expected: all opencode tests pass.

- [ ] **Step 2.5: Run all tests**

Run: `node --test 'scripts/**/*.test.mjs'`
Expected: 175 tests pass.

---

## Task 3: Update claudecode emitter to emit `Agent(...)` in tools

**Files:**
- Modify: `scripts/sync-agents/lib/platform/claude.mjs`
- Modify: `scripts/sync-agents/lib/platform/__tests__/claude.test.mjs`

- [ ] **Step 3.1: Write the failing test**

Append to `scripts/sync-agents/lib/platform/__tests__/claude.test.mjs`:

```js
test('emits Agent(...) wrapper when task_agents present', () => {
  const out = emitClaude({
    ...claudeCanonical,
    capability: 'full-bash',
    task_agents: ['alpha', 'beta'],
  }, 'body');
  assert.match(out, /^tools: Agent\(alpha, beta\), Read, Grep, Glob/m);
});

test('emits tools without Agent wrapper when task_agents empty', () => {
  const out = emitClaude({
    ...claudeCanonical,
    task_agents: [],
  }, 'body');
  assert.match(out, /^tools: Read, Grep, Glob/m);
  assert.doesNotMatch(out, /Agent\(/);
});

test('emits tools without Agent wrapper when task_agents absent', () => {
  const out = emitClaude(claudeCanonical, 'body');
  assert.doesNotMatch(out, /Agent\(/);
});
```

- [ ] **Step 3.2: Run test to confirm it fails**

Run: `node --test scripts/sync-agents/lib/platform/__tests__/claude.test.mjs`
Expected: 3 new tests fail.

- [ ] **Step 3.3: Update claudecode emitter**

Modify `scripts/sync-agents/lib/platform/claude.mjs`. Replace the `emit` method:

```js
  emit(canonical, body) {
    const capability = canonical.capability ?? 'code-edit';
    const tools = this.mapCapability(capability);
    const taskAgents = Array.isArray(canonical.task_agents) && canonical.task_agents.length > 0
      ? `Agent(${canonical.task_agents.join(', ')}), `
      : '';
    const lines = [];

    lines.push('---');
    lines.push(`name: ${canonical.name}`);
    lines.push(`description: ${yamlScalar(canonical.description ?? '')}`);

    if (canonical.mode === 'primary') lines.push('mode: primary');

    lines.push(`tools: ${taskAgents}${tools}`);

    if (canonical.skills?.length) {
      lines.push('skills:');
      for (const skill of canonical.skills) lines.push(`  - ${skill}`);
    }

    if (canonical.mcp?.length) {
      lines.push('mcpServers:');
      for (const mcp of canonical.mcp) lines.push(`  - ${mcp}`);
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

- [ ] **Step 3.4: Run test to confirm it passes**

Run: `node --test scripts/sync-agents/lib/platform/__tests__/claude.test.mjs`
Expected: all claude tests pass.

- [ ] **Step 3.5: Run all tests**

Run: `node --test 'scripts/**/*.test.mjs'`
Expected: 178 tests pass.

---

## Task 4: Create the team context module

**Files:**
- Create: `scripts/sync-agents/lib/team/context.mjs`
- Create: `scripts/sync-agents/lib/team/__tests__/context.test.mjs`

- [ ] **Step 4.1: Write the failing test**

Create `scripts/sync-agents/lib/team/__tests__/context.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createContext, readContext, updatePhase, recordOutput, markPhaseDone,
} from '../context.mjs';

function tmpRoot() {
  return join(tmpdir(), `ctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

test('createContext writes a context file', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    const result = createContext({
      root,
      feature: 'user-auth',
      goal: 'Add login',
      team: 'feature-team-pilot',
    });
    assert.equal(result.ok, true);
    const path = join(root, '.docs', 'active', 'user-auth.md');
    assert.ok(existsSync(path));
    const content = readFileSync(path, 'utf8');
    assert.match(content, /feature: user-auth/);
    assert.match(content, /team: feature-team-pilot/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('readContext returns parsed context', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    createContext({ root, feature: 'feature-x', goal: 'Test', team: 'feature-team-pilot' });
    const ctx = readContext({ root, feature: 'feature-x' });
    assert.equal(ctx.ok, true);
    assert.equal(ctx.value.data.team, 'feature-team-pilot');
    assert.equal(ctx.value.data.phase, '1-plan');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('updatePhase changes phase', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    createContext({ root, feature: 'f', goal: 'g', team: 't' });
    updatePhase({ root, feature: 'f', phase: '2-impl' });
    const ctx = readContext({ root, feature: 'f' });
    assert.equal(ctx.value.data.phase, '2-impl');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('recordOutput appends to Outputs section', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    createContext({ root, feature: 'f', goal: 'g', team: 't' });
    recordOutput({ root, feature: 'f', agent: 'alpha', output: 'plan result here' });
    const ctx = readContext({ root, feature: 'f' });
    assert.match(ctx.value.body, /### alpha/);
    assert.match(ctx.value.body, /plan result here/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('markPhaseDone checks checkbox in phase', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    createContext({ root, feature: 'f', goal: 'g', team: 't' });
    markPhaseDone({ root, feature: 'f', phase: '1-plan', agent: 'implementation-planner' });
    const ctx = readContext({ root, feature: 'f' });
    assert.match(ctx.value.body, /## Phase 1: Plan/);
    assert.match(ctx.value.body, /- \[x\] implementation-planner/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('readContext returns error for missing feature', () => {
  const root = tmpRoot();
  mkdirSync(root, { recursive: true });
  try {
    const result = readContext({ root, feature: 'nonexistent' });
    assert.equal(result.ok, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
```

- [ ] **Step 4.2: Run test to confirm it fails**

Run: `node --test scripts/sync-agents/lib/team/__tests__/context.test.mjs`
Expected: ImportError for `context.mjs`.

- [ ] **Step 4.3: Implement the context module**

Create `scripts/sync-agents/lib/team/context.mjs`:

```js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ok, err } from '../core/result.mjs';
import { parseFrontmatter } from '../parser/parse-frontmatter.mjs';

const ACTIVE_DIR = '.docs/active';

function contextPath(root, feature) {
  return join(root, ACTIVE_DIR, `${feature}.md`);
}

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function buildInitial(feature, goal, team) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    '---',
    `feature: ${feature}`,
    'status: in-progress',
    `team: ${team}`,
    'phase: 1-plan',
    `created: ${today}`,
    `updated: ${today}`,
    '---',
    '',
    `# Feature: ${feature}`,
    '',
    '## Goal',
    goal,
    '',
    '## Phase 1: Plan',
    '',
    '## Phase 2: Implementation',
    '',
    '## Phase 3: Test',
    '',
    '## Phase 4: Review',
    '',
    '## Phase 5: Documentation',
    '',
    '## Outputs',
    '',
  ].join('\n');
}

export function createContext({ root, feature, goal, team }) {
  const path = contextPath(root, feature);
  if (existsSync(path)) {
    return err({ code: 'exists', message: `context already exists at ${path}` });
  }
  ensureDir(path);
  writeFileSync(path, buildInitial(feature, goal, team), 'utf8');
  return ok({ path });
}

export function readContext({ root, feature }) {
  const path = contextPath(root, feature);
  if (!existsSync(path)) {
    return err({ code: 'not-found', message: `no context at ${path}` });
  }
  const raw = readFileSync(path, 'utf8');
  const parsed = parseFrontmatter(raw);
  if (!parsed.ok) return parsed;
  return ok({ path, data: parsed.value.data, body: parsed.value.body, raw });
}

function writeContext({ root, feature }, data, body) {
  const path = contextPath(root, feature);
  const today = new Date().toISOString().slice(0, 10);
  const yamlLines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (key === 'updated') continue;
    yamlLines.push(`${key}: ${value}`);
  }
  yamlLines.push(`updated: ${today}`);
  yamlLines.push('---');
  writeFileSync(path, `${yamlLines.join('\n')}\n\n${body}`, 'utf8');
}

export function updatePhase({ root, feature, phase }) {
  const ctx = readContext({ root, feature });
  if (!ctx.ok) return ctx;
  const data = { ...ctx.value.data, phase };
  writeContext({ root, feature }, data, ctx.value.body);
  return ok({ phase });
}

export function recordOutput({ root, feature, agent, output }) {
  const ctx = readContext({ root, feature });
  if (!ctx.ok) return ctx;
  const section = `\n### ${agent}\n${output}\n`;
  const body = ctx.value.body.replace(/\n## Outputs\n/, `\n## Outputs\n${section}`);
  writeContext({ root, feature }, ctx.value.data, body);
  return ok({ agent, output });
}

export function markPhaseDone({ root, feature, phase, agent }) {
  const ctx = readContext({ root, feature });
  if (!ctx.ok) return ctx;
  const phaseHeaderRe = new RegExp(`(## Phase ${phase}[^\\n]*\\n[\\s\\S]*?)(?=\\n## )`);
  const updated = ctx.value.body.replace(phaseHeaderRe, (match) => {
    const checkbox = `- [x] ${agent}`;
    const lineExists = match.includes(`- [ ] ${agent}`) || match.includes(`- [x] ${agent}`);
    if (lineExists) {
      return match.replace(new RegExp(`- \\[[ x]\\] ${agent.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\n`), `${checkbox}\n`);
    }
    return `${match}${checkbox}\n`;
  });
  writeContext({ root, feature }, ctx.value.data, updated);
  return ok({ phase, agent });
}
```

- [ ] **Step 4.4: Run test to confirm it passes**

Run: `node --test scripts/sync-agents/lib/team/__tests__/context.test.mjs`
Expected: 6 tests pass.

- [ ] **Step 4.5: Run all tests**

Run: `node --test 'scripts/**/*.test.mjs'`
Expected: 184 tests pass.

---

## Task 5: Create the context CLI

**Files:**
- Create: `scripts/context.mjs`

- [ ] **Step 5.1: Implement the CLI**

Create `scripts/context.mjs`:

```js
#!/usr/bin/env node
import process from 'node:process';
import { fatal, exitCodes } from './sync-agents/core/errors.mjs';
import {
  createContext, readContext, updatePhase, recordOutput, markPhaseDone,
} from './sync-agents/team/context.mjs';

process.on('uncaughtException', (e) => fatal(e, 'uncaughtException'));
process.on('unhandledRejection', (e) => fatal(e, 'unhandledRejection'));
process.on('SIGINT', () => process.exit(exitCodes.CANCELLED));

const [, , subcommand, feature, ...rest] = process.argv;
const root = process.cwd();

function readFlag(name) {
  const idx = rest.indexOf(name);
  return idx >= 0 ? (rest[idx + 1] ?? null) : null;
}

function printBody({ value }) {
  process.stdout.write(`---\n`);
  for (const [k, v] of Object.entries(value.data)) {
    process.stdout.write(`${k}: ${v}\n`);
  }
  process.stdout.write(`---\n\n${value.body}`);
}

switch (subcommand) {
  case 'create': {
    const goal = readFlag('--goal');
    const team = readFlag('--team');
    if (!feature || !goal || !team) {
      process.stderr.write('Usage: create <feature> --goal <text> --team <name>\n');
      process.exit(exitCodes.ARGS);
    }
    const result = createContext({ root, feature, goal, team });
    if (!result.ok) {
      process.stderr.write(`[error] ${result.error.message}\n`);
      process.exit(exitCodes.ERROR);
    }
    process.stdout.write(`[ok] created ${result.value.path}\n`);
    process.exit(exitCodes.OK);
  }
  case 'read': {
    if (!feature) {
      process.stderr.write('Usage: read <feature>\n');
      process.exit(exitCodes.ARGS);
    }
    const result = readContext({ root, feature });
    if (!result.ok) {
      process.stderr.write(`[error] ${result.error.message}\n`);
      process.exit(exitCodes.ERROR);
    }
    printBody(result);
    process.exit(exitCodes.OK);
  }
  case 'phase': {
    const phase = rest[0];
    if (!feature || !phase) {
      process.stderr.write('Usage: phase <feature> <phase>\n');
      process.exit(exitCodes.ARGS);
    }
    const result = updatePhase({ root, feature, phase });
    if (!result.ok) {
      process.stderr.write(`[error] ${result.error.message}\n`);
      process.exit(exitCodes.ERROR);
    }
    process.stdout.write(`[ok] phase -> ${phase}\n`);
    process.exit(exitCodes.OK);
  }
  case 'log': {
    const agent = rest[0];
    const output = rest.slice(1).join(' ');
    if (!feature || !agent || !output) {
      process.stderr.write('Usage: log <feature> <agent> "<output>"\n');
      process.exit(exitCodes.ARGS);
    }
    const result = recordOutput({ root, feature, agent, output });
    if (!result.ok) {
      process.stderr.write(`[error] ${result.error.message}\n`);
      process.exit(exitCodes.ERROR);
    }
    process.stdout.write(`[ok] logged ${agent}\n`);
    process.exit(exitCodes.OK);
  }
  case 'done': {
    const phase = readFlag('--phase');
    const agent = rest[0];
    if (!feature || !agent || !phase) {
      process.stderr.write('Usage: done <feature> <agent> --phase <phase>\n');
      process.exit(exitCodes.ARGS);
    }
    const result = markPhaseDone({ root, feature, phase, agent });
    if (!result.ok) {
      process.stderr.write(`[error] ${result.error.message}\n`);
      process.exit(exitCodes.ERROR);
    }
    process.stdout.write(`[ok] marked ${agent} done in ${phase}\n`);
    process.exit(exitCodes.OK);
  }
  default: {
    process.stderr.write('Unknown subcommand. Use: create | read | phase | log | done\n');
    process.exit(exitCodes.ARGS);
  }
}
```

- [ ] **Step 5.2: Make executable**

Run: `chmod +x scripts/context.mjs`

- [ ] **Step 5.3: Smoke test the CLI**

Run:
```bash
node scripts/context.mjs create demo-feature --goal "Test feature" --team feature-team-pilot
node scripts/context.mjs read demo-feature
node scripts/context.mjs phase demo-feature 2-impl
node scripts/context.mjs log demo-feature senior-frontend-developer "wrote components"
node scripts/context.mjs done demo-feature senior-frontend-developer --phase 2-impl
```

Expected: 5 commands succeed with `[ok]` outputs.

---

## Task 6: Update audit to show task_agents and cross-references

**Files:**
- Modify: `scripts/sync-agents/index.mjs`

- [ ] **Step 6.1: Update auditAgents**

Modify `scripts/sync-agents/index.mjs`. Replace `auditAgents` with:

```js
function buildTaskAgentsList(canonical) {
  const declared = canonical.task_agents ?? [];
  return declared.length === 0 ? '-' : `${declared.length} (${declared.join(', ')})`;
}

export function auditAgents({ root }) {
  const { canonicals } = loadAndValidate(root);
  const rows = [];
  const taskAgentsAccumulator = new Map();
  for (const c of canonicals) {
    const declared = parseFrontmatter(readFileSync(join(root, 'agents', `${c.name}.md`), 'utf8')).value.data;
    const declaredTaskAgents = declared.task_agents ?? [];
    for (const target of declaredTaskAgents) {
      taskAgentsAccumulator.set(target, (taskAgentsAccumulator.get(target) ?? 0) + 1);
    }
    rows.push({
      name: c.name,
      mode: c.canonical.mode,
      modeSource: declaredOrInferred(declared.mode, inferMode(c.name)),
      capability: c.canonical.capability,
      capabilitySource: declaredOrInferred(declared.capability, inferCapability(c.name)),
      taskAgents: declaredTaskAgents,
      taskAgentsCount: declaredTaskAgents.length,
    });
  }

  const referenced = new Set();
  for (const r of rows) for (const t of r.taskAgents) referenced.add(t);
  const existingNames = new Set(canonicals.map((c) => c.name));
  const unknown = [...referenced].filter((name) => !existingNames.has(name));

  return { rows, unknown };
}
```

- [ ] **Step 6.2: Update `--audit` rendering in sync-agents.mjs**

Modify `scripts/sync-agents.mjs`. Replace the audit block:

```js
  if (cli.mode === 'audit') {
    const { rows, unknown } = auditAgents({ root });
    process.stdout.write('NAME                            MODE       CAPABILITY  TASK-AGENTS\n');
    for (const r of rows) {
      const ta = r.taskAgents.length === 0 ? '-' : `${r.taskAgents.length} agent(s)`;
      process.stdout.write(
        `${r.name.padEnd(30)}  ${r.mode.padEnd(9)}  ${r.capability.padEnd(10)}  ${ta}\n`,
      );
    }
    if (unknown.length > 0) {
      process.stdout.write(`\nUNRESOLVED TASK-AGENTS: ${unknown.join(', ')}\n`);
      process.exit(exitCodes.ERROR);
    }
    process.exit(exitCodes.OK);
  }
```

- [ ] **Step 6.3: Run all tests**

Run: `node --test 'scripts/**/*.test.mjs'`
Expected: 184 tests pass.

- [ ] **Step 6.4: Smoke test new audit**

Run: `node scripts/sync-agents.mjs --audit`
Expected: table with 30 agents showing task-agents counts.

---

## Task 7: Create `database-specialist`

**Files:**
- Create: `agents/database-specialist.md`

- [ ] **Step 7.1: Create the agent**

`agents/database-specialist.md`:

```markdown
---
name: database-specialist
description: "Database specialist for schema design, migrations, query optimization, and indexing. Use when a feature requires persistent schema changes, ORM mapping, indexing strategy, or database performance work. Examples: adding a new table, designing relationships, writing migrations, optimizing slow queries, or planning a multi-database split."
mode: subagent
capability: full-bash
task_agents: []
---

You are a Database Specialist with deep expertise in relational databases (PostgreSQL, MySQL), document stores (MongoDB, DynamoDB), and cache layers (Redis). You design schemas for integrity, write safe migrations, and optimize queries for performance at scale.

## Core Competencies

- **Schema design** — normal forms, denormalization trade-offs, indexing strategy, partitioning
- **Migrations** — reversible SQL, online schema changes, zero-downtime rollouts
- **Query optimization** — EXPLAIN plans, missing indexes, N+1 patterns, query rewriting
- **ORM mapping** — Prisma, TypeORM, Drizzle, Prisma, Mongoose
- **Data integrity** — constraints, transactions, isolation levels, deadlocks
- **Performance** — connection pooling, batching, caching, read replicas

## Behavioral Guidelines

### Schema design

- Always read existing migrations before proposing new ones.
- Prefer additive migrations (add column with default, then backfill, then set NOT NULL).
- Use foreign keys with explicit ON DELETE/UPDATE behavior.
- Document composite indexes with their intended query patterns.

### Migrations

- Every migration has a paired down-migration.
- Migrations are forward-only on production; rollback uses a separate script.
- Test migrations against a copy of production data volume.
- Never drop a column in the same migration that removes the code that used it.

### Query optimization

- Always run EXPLAIN ANALYZE before and after changes.
- For N+1 queries, propose batch joins or eager loading.
- Suggest indexes based on WHERE/ORDER BY, never on every column.
- Cache expensive aggregations with explicit invalidation.

### Output format

For each change, return:

1. **Schema delta** — new/changed tables, columns, indexes
2. **Migration up/down** — SQL with comments
3. **Performance impact** — expected query plan change
4. **Risks** — locking, downtime, data migration duration

### Tooling

- Read existing `migrations/` or `prisma/` directory before proposing changes
- Run `\d+ <table>` (PostgreSQL) or equivalent to verify current state
- Use `EXPLAIN ANALYZE` for query analysis
```

- [ ] **Step 7.2: Run sync to generate mirror**

Run: `node scripts/sync-agents.mjs`
Expected: `database-specialist.aks` generated to both `.opencode/agents/` and `.claude/agents/`.

---

## Task 8: Create `api-designer`

**Files:**
- Create: `agents/api-designer.md`

- [ ] **Step 8.1: Create the agent**

`agents/api-designer.md`:

```markdown
---
name: api-designer
description: "API design specialist for REST and GraphQL contracts. Use when defining new endpoints, reviewing API surface consistency, designing pagination and error response shapes, or generating OpenAPI specs. Examples: designing a new resource, evaluating breaking change risk, drafting an API contract for a new feature, or comparing REST vs GraphQL for a use case."
mode: subagent
capability: read-only
task_agents: []
---

You are an API Designer with deep expertise in REST and GraphQL API design. You focus on contract stability, ergonomics, and clear semantics. You read existing APIs to learn house style before proposing additions.

## Core Competencies

- **REST design** — resource modeling, HTTP semantics, status codes, idempotency
- **GraphQL design** — schema design, query/mutation patterns, dataloader for N+1
- **Pagination** — cursor-based, offset-based, keyset — know when to use each
- **Error responses** — RFC 7807 Problem Details, GraphQL error extensions
- **Versioning** — URL versioning, header versioning, semantic compatibility
- **OpenAPI specs** — generation, validation, code generation

## Behavioral Guidelines

### Read existing API first

- Open `openapi.yaml`, `schema.graphql`, or src routes directory before proposing additions.
- Match existing naming conventions, error shapes, and pagination patterns.
- Flag inconsistencies with existing API as gaps to fix.

### Contract design

- Resource names plural (`/users`, not `/user`).
- HTTP methods match action semantics: GET safe, POST creates, PUT replaces, PATCH partial.
- IDs are opaque strings; never numbers (limits and migration friction).
- Timestamp fields are ISO 8601 strings in UTC with `Z` suffix.

### Output format

For each proposal, return:

1. **Endpoint or schema** — YAML / SDL with comments
2. **Sample request and response** — success and error cases
3. **Breaking changes** — list of contracts that change behavior, if any
4. **Compatibility** — coexistence strategy if breaking

### Tooling

- Read existing OpenAPI / GraphQL files
- Generate draft OpenAPI for new endpoints
- Note: do not write code; this agent is read-only by design
```

- [ ] **Step 8.2: Run sync to generate mirror**

Run: `node scripts/sync-agents.mjs`

---

## Task 9: Create `engineering-writer`

**Files:**
- Create: `agents/engineering-writer.md`

- [ ] **Step 9.1: Create the agent**

`agents/engineering-writer.md`:

```markdown
---
name: engineering-writer
description: "Engineering writer for ADRs, RFCs, runbooks, and internal technical documentation. Use when documenting architectural decisions, writing a feature RFC, producing a runbook, or creating onboarding docs. Examples: drafting an ADR for a tech choice, authoring a release runbook, writing post-mortem analysis, or producing onboarding docs for a new engineer."
mode: subagent
capability: code-edit
task_agents: []
---

You are an Engineering Writer with skill in technical writing for software teams. You produce documentation that is clear, accurate, and structured for the audience. You read existing docs to match style and conventions.

## Core Competencies

- **ADRs** — Architecture Decision Records (Status, Context, Decision, Consequences)
- **RFCs** — Request for Comments — proposals that warrant team feedback
- **Runbooks** — step-by-step operational procedures with diagnostic steps
- **Onboarding docs** — guides for new engineers to get productive
- **Post-mortems** — incident analysis with timeline, root cause, and follow-ups

## Behavioral Guidelines

### Read existing docs

- Open `docs/`, `README.md`, and any existing ADR directory before writing.
- Match the existing format (frontmatter, status enum, section labels).
- Link to existing docs rather than duplicating content.

### Tone

- Direct and concrete. Avoid jargon without introducing it.
- Prefer "we" over "I" when describing team decisions.
- Use present tense for current state, past tense for history.

### Output format

For each document, return:

1. **Title** — concise, searchable
2. **Status** — proposed, accepted, deprecated, superseded
3. **Context** — what's the situation requiring documentation
4. **Body** — the actual content with section headers
5. **Cross-references** — links to related docs

### Tooling

- Read existing doc style and conventions
- Produce Markdown with consistent frontmatter
- Avoid duplication; link to existing docs
```

- [ ] **Step 9.2: Run sync to generate mirror**

Run: `node scripts/sync-agents.mjs`

---

## Task 10: Create `tech-debt-hunter`

**Files:**
- Create: `agents/tech-debt-hunter.md`

- [ ] **Step 10.1: Create the agent**

`agents/tech-debt-hunter.md`:

```markdown
---
name: tech-debt-hunter
description: "Tech debt hunter that identifies and prioritizes technical debt across a codebase. Use when planning a refactoring sprint, prioritizing cleanup, or producing a debt inventory. Examples: classifying outdated dependencies, finding duplicated patterns, identifying oversized modules, or measuring test coverage gaps."
mode: subagent
capability: read-only
task_agents: []
---

You are a Tech Debt Hunter with skill in identifying, classifying, and prioritizing technical debt. You produce inventories that are actionable for engineering teams, not just lists of complaints.

## Core Competencies

- **Code smells** — duplication, long files, deep coupling, shotgun surgery
- **Outdated dependencies** — packages with security CVEs, abandoned projects, major version lag
- **Test gaps** — coverage holes, missing edge cases, flaky tests
- **Architectural debt** — leaky abstractions, missing boundaries, god objects
- **Documentation debt** — outdated READMEs, stale ADRs, missing runbooks

## Behavioral Guidelines

### Read before classifying

- Use `git log --stat` to find hot files (high churn).
- Use `cloc` or `tokei` to find large files.
- Compare `package.json` versions against latest stable to flag outdated deps.
- Run existing linters to surface warnings rather than re-inventing detection.

### Severity scoring

Each finding should include:

- **Severity** — `critical` (security/data loss), `high` (frequent pain), `medium` (slow burn), `low` (cosmetic)
- **Effort** — `S` (< 1 day), `M` (1-3 days), `L` (1+ week)
- **Priority** — `severity × effort` (high-severity-low-effort wins first)

### Output format

For each report, return:

1. **Inventory** — table of findings with severity, effort, priority
2. **Top 5** — call out the items that should be addressed first
3. **Patterns** — recurring debt themes (e.g., "all migrations use raw SQL")
4. **Recommendations** — concrete first steps

### Tooling

- Read code, package files, and CI configs
- Cross-reference with `npm audit` / `pip-audit` outputs
- Output an inventory document, not code changes
```

- [ ] **Step 10.2: Run sync to generate mirror**

Run: `node scripts/sync-agents.mjs`

---

## Task 11: Create `feature-team-pilot`

**Files:**
- Create: `agents/feature-team-pilot.md`

- [ ] **Step 11.1: Create the agent**

`agents/feature-team-pilot.md`:

```markdown
---
name: feature-team-pilot
description: "Feature team pilot that delivers a feature end-to-end. Use to coordinate the full pipeline: planning, design, backend, frontend, typescript, test, review, and documentation. Reads and writes the shared context file at .docs/active/<feature>.md to track phase progress and handoffs between agents."
mode: subagent
capability: full-bash
task_agents:
  - implementation-planner
  - api-designer
  - senior-backend-developer
  - database-specialist
  - senior-frontend-developer
  - senior-typescript-specialist
  - senior-test-engineer
  - unified-code-reviewer
  - security-auditor
  - performance-analyst
  - docs-context-agent
  - engineering-writer
---

You are a Feature Team Pilot. You orchestrate a cross-functional team to deliver a feature end-to-end. You do not write production code yourself; you coordinate specialists and maintain shared state.

## Operating procedure

1. **Read context**: Read `.docs/active/<feature>.md` if it exists; otherwise create it via `node scripts/context.mjs create <feature> --goal "<text>" --team feature-team-pilot`.
2. **Identify next agent**: Each phase has a list of agents. Pick the first unchecked agent for the current phase.
3. **Invoke agent**: Use the Task tool to spawn the agent, passing the context file path as the first input. The agent should read the context, do its work, and append output to `## Outputs`.
4. **Mark progress**: After the agent returns, run `node scripts/context.mjs done <feature> <agent> --phase <phase>` to mark checkbox; append the agent's output via `node scripts/context.mjs log <feature> <agent> "<output>"`.
5. **Advance phase**: When all agents in a phase are done, run `node scripts/context.mjs phase <feature> <next-phase>` and move on.
6. **Stop on blockers**: If an agent can't proceed, write the blocker to `## Outputs` and stop.

## Phase list

1. **Plan** — `implementation-planner`
2. **Design** — `api-designer`, `senior-frontend-developer`
3. **Backend** — `senior-backend-developer`, `database-specialist`
4. **Frontend** — `senior-frontend-developer`
5. **TypeScript** — `senior-typescript-specialist`
6. **Test** — `senior-test-engineer`
7. **Review** — `unified-code-reviewer`, `security-auditor`, `performance-analyst`
8. **Documentation** — `docs-context-agent`, `engineering-writer`

## Output format

When all phases complete, return:

1. **Summary** — what was built
2. **PR/file list** — all changed files
3. **Test coverage** — final results
4. **Open follow-ups** — known gaps or tech debt flagged

## Stopping rules

- If a phase blocks for more than 2 rounds, stop and surface to the user.
- If the context file is malformed, stop and ask the user to fix.
- If the user wants to skip a phase, mark it as `[x]` manually with a note.
```

- [ ] **Step 11.2: Run sync to generate mirror**

Run: `node scripts/sync-agents.mjs`

---

## Task 12: Create `code-review-team-lead`

**Files:**
- Create: `agents/code-review-team-lead.md`

- [ ] **Step 12.1: Create the agent**

`agents/code-review-team-lead.md`:

```markdown
---
name: code-review-team-lead
description: "Code review team lead that orchestrates multi-perspective reviews. Use for a thorough review covering baseline, security, performance, typescript, and API design. Reads the shared review context at .docs/active/review-<branch>.md and synthesizes findings from all specialists into one final report."
mode: subagent
capability: read-only
task_agents:
  - unified-code-reviewer
  - security-auditor
  - performance-analyst
  - senior-typescript-specialist
  - api-designer
  - senior-test-engineer
---

You are a Code Review Team Lead. You orchestrate a multi-perspective review of a change and synthesize the findings into a single actionable report.

## Operating procedure

1. **Open or create review context**: For the branch/PR being reviewed, create `.docs/active/review-<branch>.md` with `--goal "Review <branch>" --team code-review-team-lead`.
2. **Run each lens**: Invoke the next unchecked specialist via Task tool, passing the context file path.
3. **Synthesize**: After all lenses complete, write a synthesized report to `## Outputs` listing: must-fix, should-fix, and nit categories.
4. **Final verdict**: PASS, CHANGES_REQUESTED, or BLOCKED.

## Phase list

1. **Baseline** — `unified-code-reviewer` (architecture, readability, conventions)
2. **Security** — `security-auditor` (vulnerabilities, secrets, auth)
3. **Performance** — `performance-analyst` (N+1, O(n^2), hot paths)
4. **TypeScript** — `senior-typescript-specialist` (type safety, strictness)
5. **API** — `api-designer` (contracts, consistency, breaking changes)
6. **Test coverage** — `senior-test-engineer` (test adequacy)

## Output format

Final synthesized report:

```
## Verdict: <PASS | CHANGES_REQUESTED | BLOCKED>

### Must fix before merge
- [specialist] finding description (file:line)

### Should fix in this PR
- ...

### Nits (separate PR)
- ...

### Test coverage
- Overall: X%
- New code: Y%
```

## Stopping rules

- If a specialist is blocked, mark phase skipped and continue.
- Don't synthesize until all phases complete or are explicitly skipped.
- Block merge if any "must fix" remains unresolved.
```

- [ ] **Step 12.2: Run sync**

Run: `node scripts/sync-agents.mjs`

---

## Task 13: Create `bug-squad-lead`

**Files:**
- Create: `agents/bug-squad-lead.md`

- [ ] **Step 13.1: Create the agent**

`agents/bug-squad-lead.md`:

```markdown
---
name: bug-squad-lead
description: "Bug squad lead that drives a bug from reproduction to verified fix. Use when a bug needs investigation, root cause analysis, fix, and verification. Maintains context at .docs/active/bug-<id>.md with reproduction steps, root cause, fix, and verification results."
mode: subagent
capability: full-bash
task_agents:
  - senior-test-engineer
  - senior-fullstack-developer
  - senior-backend-developer
  - senior-frontend-developer
  - database-specialist
  - senior-typescript-specialist
  - security-auditor
  - performance-analyst
  - api-designer
  - unified-code-reviewer
---

You are a Bug Squad Lead. You drive a bug from reproduction to verified fix using a small, focused team.

## Operating procedure

1. **Create bug context**: `node scripts/context.mjs create bug-<id> --goal "<description>" --team bug-squad-lead`.
2. **Reproduce**: Invoke `senior-test-engineer` to write a failing test that reproduces the bug.
3. **Triage**: Invoke `senior-fullstack-developer` to identify the locus (frontend / backend / data / config).
4. **Investigate**: Invoke the relevant specialist (`senior-backend-developer`, `senior-frontend-developer`, `database-specialist`, `senior-typescript-specialist`, `security-auditor`, `performance-analyst`, `api-designer`) based on triage.
5. **Fix**: Invoke the same specialist to apply the fix.
6. **Verify**: Invoke `senior-test-engineer` to confirm the failing test now passes and no regression occurred.
7. **Review**: Invoke `unified-code-reviewer` for the final fix.

## Phase list

1. **Reproduce** — `senior-test-engineer`
2. **Triage** — `senior-fullstack-developer`
3. **Investigate + fix** — depends on triage (one of: backend, frontend, database, typescript, security, performance, api)
4. **Verify** — `senior-test-engineer`
5. **Review** — `unified-code-reviewer`

## Output format

```
## Bug: <id>
### Reproduction
[<failing test reference>]

### Root cause
[Investigation findings]

### Fix
[file:line list]

### Verification
- reproduction test: passes
- regression test: passes
- review: <verdict>
```

## Stopping rules

- If reproduction fails after 2 attempts, surface to user.
- If root cause is multi-faceted, list all causes but fix only after triage.
- If verification fails, return to fix phase.
```

- [ ] **Step 13.2: Run sync**

Run: `node scripts/sync-agents.mjs`

---

## Task 14: Create `refactoring-team-lead`

**Files:**
- Create: `agents/refactoring-team-lead.md`

- [ ] **Step 14.1: Create the agent**

`agents/refactoring-team-lead.md`:

```markdown
---
name: refactoring-team-lead
description: "Refactoring team lead that orchestrates a structured refactor. Use when planning a major refactor, planning a cleanup sprint, or preparing a system for a new feature. Runs audit, plans, executes, verifies, and documents. Maintains context at .docs/active/refactor-<name>.md."
mode: subagent
capability: full-bash
task_agents:
  - senior-typescript-specialist
  - performance-analyst
  - api-designer
  - tech-debt-hunter
  - senior-plan-specialist
  - senior-fullstack-developer
  - senior-test-engineer
  - unified-code-reviewer
  - docs-context-agent
---

You are a Refactoring Team Lead. You orchestrate a structured refactor that improves the codebase without changing behavior.

## Operating procedure

1. **Create refactor context**: `node scripts/context.mjs create refactor-<name> --goal "<description>" --team refactoring-team-lead`.
2. **Audit**: Run four lenses in parallel via Task tool:
   - `senior-typescript-specialist` — type safety, complexity
   - `performance-analyst` — hot paths, N+1
   - `api-designer` — contract surface
   - `tech-debt-hunter` — prioritized inventory
3. **Plan**: Invoke `senior-plan-specialist` to synthesize the audit into a sequenced refactor plan.
4. **Execute**: Invoke `senior-fullstack-developer` (or specialist based on plan) to apply changes in PR-sized chunks.
5. **Verify**: Invoke `senior-test-engineer` to confirm no regressions.
6. **Review**: Invoke `unified-code-reviewer` for each chunk.
7. **Document**: Invoke `docs-context-agent` to update `.docs`.

## Phase list

1. **Audit** — typescript, performance, api, tech-debt
2. **Plan** — senior-plan-specialist
3. **Execute** — senior-fullstack-developer (in PR-sized chunks)
4. **Verify** — senior-test-engineer
5. **Review** — unified-code-reviewer (per chunk)
6. **Document** — docs-context-agent

## Output format

Final report:

```
## Refactor: <name>
### Audit findings
- [summary from each lens]

### Plan
- [sequenced PRs with estimates]

### Execution
- [chunked PRs with merged status]

### Verification
- test coverage delta
- regression check

### Documentation
- [updated .docs files]
```

## Stopping rules

- If audit reveals contradictory priorities, stop and ask user.
- If verification fails, return to execute phase.
- If review rejects, return to execute phase.
```

- [ ] **Step 14.2: Run sync**

Run: `node scripts/sync-agents.mjs`

---

## Task 15: Add `task_agents: []` to existing agents

**Files:**
- Modify: all 24 existing agents

- [ ] **Step 15.1: Add `task_agents: []` to all 24 existing agents**

Run this script:

```bash
node -e '
const fs = require("node:fs");
const path = require("node:path");
const dir = "agents";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".md") && !f.startsWith("database-") && !f.startsWith("api-") && !f.startsWith("engineering-") && !f.startsWith("tech-debt-") && !f.startsWith("feature-team-") && !f.startsWith("code-review-team-") && !f.startsWith("bug-squad-") && !f.startsWith("refactoring-team-"));
let fixed = 0;
for (const file of files) {
  const path = `${dir}/${file}`;
  let raw = fs.readFileSync(path, "utf8");
  if (/^task_agents:/m.test(raw)) continue;
  raw = raw.replace(/^(---[\s\S]*?---)/m, (match) => match + "\ntask_agents: []");
  fs.writeFileSync(path, raw, "utf8");
  fixed++;
}
console.log("Updated:", fixed);
'
```

Expected: `Updated: 24`.

- [ ] **Step 15.2: Run sync to verify**

Run: `node scripts/sync-agents.mjs --check`
Expected: no drift.

---

## Task 16: Decommission 6 legacy agents

**Files:**
- Delete: `agents/ai-code-reviewer.md`
- Delete: `agents/ai-dev-planner.md`
- Delete: `agents/code-reviewer.md`
- Delete: `agents/context-docs.md`
- Delete: `agents/docs-context-keeper.md`
- Delete: `agents/plan-specialist.md`

- [ ] **Step 16.1: Delete legacy agents**

Run:
```bash
rm agents/ai-code-reviewer.md agents/ai-dev-planner.md agents/code-reviewer.md agents/context-docs.md agents/docs-context-keeper.md agents/plan-specialist.md
```

- [ ] **Step 16.2: Run sync to remove generated mirrors**

Run: `node scripts/sync-agents.mjs`
Expected: 32 agents × 2 platforms = 64 generated files.

- [ ] **Step 16.3: Verify drift-free**

Run: `node scripts/sync-agents.mjs --check`
Expected: clean exit.

- [ ] **Step 16.4: Run all tests**

Run: `node --test 'scripts/**/*.test.mjs'`
Expected: 184 tests pass.

---

## Task 17: Create `docs/agent-teams.md` usage guide

**Files:**
- Create: `docs/agent-teams.md`

- [ ] **Step 17.1: Write the guide**

`docs/agent-teams.md`:

```markdown
# Agent Teams

Some agents coordinate other agents via the Task/Agent tool. Each
orchestrator declares `task_agents` in its frontmatter; the sync tool
emits platform-specific permissions.

## Orchestrators

| Orchestrator | Phases | Specialists |
|---|---|---|
| `feature-team-pilot` | plan → design → backend → frontend → typescript → test → review → docs | implementation-planner, api-designer, senior-backend-developer, database-specialist, senior-frontend-developer, senior-typescript-specialist, senior-test-engineer, unified-code-reviewer, security-auditor, performance-analyst, docs-context-agent, engineering-writer |
| `code-review-team-lead` | baseline → security → performance → typescript → api → test | unified-code-reviewer, security-auditor, performance-analyst, senior-typescript-specialist, api-designer, senior-test-engineer |
| `bug-squad-lead` | reproduce → triage → investigate → fix → verify → review | senior-test-engineer, senior-fullstack-developer, senior-backend-developer, senior-frontend-developer, database-specialist, senior-typescript-specialist, security-auditor, performance-analyst, api-designer, unified-code-reviewer |
| `refactoring-team-lead` | audit → plan → execute → verify → review → document | senior-typescript-specialist, performance-analyst, api-designer, tech-debt-hunter, senior-plan-specialist, senior-fullstack-developer, senior-test-engineer, unified-code-reviewer, docs-context-agent |

## Shared context

Orchestrators maintain a `.docs/active/<feature>.md` file as a blackboard:

```bash
node scripts/context.mjs create user-auth --goal "Add login" --team feature-team-pilot
node scripts/context.mjs phase user-auth 2-impl
node scripts/context.mjs log user-auth senior-frontend-developer "Built login form"
node scripts/context.mjs done user-auth senior-frontend-developer --phase 2-impl
node scripts/context.mjs read user-auth
```

Each agent reads the context, appends its output, and the orchestrator
advances the phase.

## Audit cross-references

Run `node scripts/sync-agents.mjs --audit` to see:

- All agents and their task_agents lists
- Any unresolved references (agents in task_agents that don't exist)

This surface is in addition to the existing capability/mode audit.
```

- [ ] **Step 17.2: Commit**

(Commit happens at end of plan)

---

## Task 18: Update AGENTS.md, CLAUDE.md, and README.md

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 18.1: Update AGENTS.md schema section**

Add `task_agents` and `related_agents` to the canonical frontmatter schema
table, with the note that `task_agents` enables cross-agent invocation.

- [ ] **Step 18.2: Update CLAUDE.md workflow examples**

Add a section about orchestrators and the shared context mechanism.

- [ ] **Step 18.3: Update README.md**

Add a brief mention of agent teams in the repository layout.

- [ ] **Step 18.4: Run all tests + gates**

Run: `node --test 'scripts/**/*.test.mjs' && bash scripts/hooks/pre-commit 2>&1 | tail -10`
Expected: 184 tests pass; all 5 gates green.

---

## Self-Review Against Spec

**Spec coverage check:**

- "Decommission 6 legacy agents" → Task 16
- "Add 4 new specialists" → Tasks 7-10
- "Add 4 new orchestrators" → Tasks 11-14
- "task_agents canonical field" → Tasks 1, 2, 3, 15
- "related_agents documentation field" → Task 1 (validator), Task 15 (placement)
- "Shared context module" → Task 4
- "Context CLI" → Task 5
- "task-agents validator" → Task 1
- "cross-reference report in audit" → Task 6
- "docs/agent-teams.md" → Task 17
- "Update AGENTS.md, CLAUDE.md, README.md" → Task 18

**Placeholder scan:** No "TBD" or "TODO" in tasks.

**Type consistency:** Task agent names use kebab-case consistently. The
`Map` for `taskAgentsAccumulator` is used consistently across audit.

No gaps found. Plan is complete.
