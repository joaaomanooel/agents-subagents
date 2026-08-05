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
  const phaseNumber = phase.match(/^\d+/)?.[0] ?? phase;
  const escapeAgent = agent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phaseHeaderRe = new RegExp(`(## Phase ${phaseNumber}[^\\n]*\\n[\\s\\S]*?)(?=\\n## )`);
  const updated = ctx.value.body.replace(phaseHeaderRe, (match) => {
    const checkbox = `- [x] ${agent}`;
    const lineExists = match.includes(`- [ ] ${agent}`) || match.includes(`- [x] ${agent}`);
    if (lineExists) {
      return match.replace(new RegExp(`- \\[[ x]\\] ${escapeAgent}\\n`), `${checkbox}\n`);
    }
    return `${match}${checkbox}\n`;
  });
  writeContext({ root, feature }, ctx.value.data, updated);
  return ok({ phase, agent });
}
