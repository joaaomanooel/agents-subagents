/**
 * Quality gate orchestrator.
 *
 * Runs each gate (sync drift, secrets, big-o, complexity, forbidden fields)
 * against the repository and returns a structured result. CLI exit code
 * is non-zero when any error-severity gate fails.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { scanForSecrets } from './secrets.mjs';
import { lintBigO } from './big-o.mjs';
import { measureFunctionComplexity, complexityViolations } from './complexity.mjs';
import { scanForbiddenFields } from './forbidden-fields.mjs';
import { syncAgents, ensurePlatformsInitialized } from '../sync-agents/index.mjs';

const SCRIPT_EXTENSIONS = new Set(['.mjs', '.js']);
const SKIP_DIRS = new Set(['node_modules', '__tests__', '.git', 'coverage']);

export const GATE_NAMES = [
  'sync-drift',
  'forbidden-fields',
  'secrets',
  'big-o',
  'complexity',
];

function listFiles(root, dir, exts, out) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return out;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      listFiles(root, join(dir, entry.name), exts, out);
    } else if (exts.has('.' + entry.name.split('.').pop())) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

export async function runQualityGate(root, { complexityThreshold = 10 } = {}) {
  ensurePlatformsInitialized();
  const gates = {};

  const drift = await syncAgents({ root, dryRun: false, checkOnly: true });
  gates['sync-drift'] = {
    ok: drift.ok,
    details: drift.ok
      ? `${drift.value.processed} agents in sync`
      : drift.error.code === 'drift'
      ? `${drift.error.items.length} files out of sync`
      : drift.error.code,
  };

  const canonicalFiles = listFiles(root, 'agents', new Set(['.md']), []);
  const secretFindings = [];
  for (const f of canonicalFiles) {
    const path = join(root, f);
    if (!existsSync(path)) continue;
    const body = readFileSync(path, 'utf8');
    for (const finding of scanForSecrets(body, f)) {
      secretFindings.push(finding);
    }
  }
  const scriptFiles = listFiles(root, 'scripts', SCRIPT_EXTENSIONS, [])
    .filter((f) => !SKIP_DIRS.has(f.split('/')[1] ?? ''))
    .filter((f) => f.includes('/lib/') || f === 'scripts/sync-agents.mjs' || f === 'scripts/sync-agents-fallback.sh')
    .filter((f) => !f.endsWith('.test.mjs'));
  for (const f of scriptFiles) {
    const path = join(root, f);
    if (!existsSync(path)) continue;
    const body = readFileSync(path, 'utf8');
    for (const finding of scanForSecrets(body, f)) {
      secretFindings.push(finding);
    }
  }
  gates.secrets = {
    ok: secretFindings.length === 0,
    details: secretFindings.length === 0 ? 'no secrets found' : `${secretFindings.length} potential secrets`,
    findings: secretFindings,
  };

  const forbiddenFindings = [];
  for (const f of canonicalFiles) {
    const path = join(root, f);
    if (!existsSync(path)) continue;
    const body = readFileSync(path, 'utf8');
    for (const finding of scanForbiddenFields(body, f)) {
      forbiddenFindings.push(finding);
    }
  }
  gates['forbidden-fields'] = {
    ok: forbiddenFindings.filter((f) => f.severity === 'error').length === 0,
    details: forbiddenFindings.length === 0
      ? 'no forbidden fields'
      : `${forbiddenFindings.length} forbidden field(s)`,
    findings: forbiddenFindings,
  };

  const bigOFindings = [];
  for (const f of scriptFiles) {
    const path = join(root, f);
    if (!existsSync(path)) continue;
    const body = readFileSync(path, 'utf8');
    bigOFindings.push(lintBigO(body, f));
  }
  const totalBigO = bigOFindings.reduce((sum, r) => sum + r.findings.length, 0);
  gates['big-o'] = {
    ok: totalBigO === 0,
    details: totalBigO === 0
      ? 'no nested-loop smells'
      : `${totalBigO} potential smell(s)`,
    findings: bigOFindings.flatMap((r) => r.findings),
  };

  const complexityFindings = [];
  for (const f of scriptFiles) {
    const path = join(root, f);
    if (!existsSync(path)) continue;
    const body = readFileSync(path, 'utf8');
    for (const finding of measureFunctionComplexity(body)) {
      complexityFindings.push({ ...finding, file: f });
    }
  }
  const violations = complexityViolations(complexityFindings, complexityThreshold);
  gates.complexity = {
    ok: violations.length === 0,
    details: violations.length === 0
      ? `all functions below threshold (${complexityThreshold})`
      : `${violations.length} function(s) exceed complexity ${complexityThreshold}`,
    findings: violations,
  };

  const overall = Object.values(gates).every((g) => g.ok);
  return { ok: overall, gates };
}

export function formatGateReport(result) {
  const lines = [];
  lines.push('=' .repeat(60));
  lines.push('Quality Gate Report');
  lines.push('=' .repeat(60));
  for (const [name, gate] of Object.entries(result.gates)) {
    const status = gate.ok ? '[PASS]' : '[FAIL]';
    lines.push(`${status.padEnd(7)} ${name.padEnd(18)} ${gate.details}`);
  }
  lines.push('=' .repeat(60));
  lines.push(result.ok ? 'OVERALL: [PASS] All gates green.' : 'OVERALL: [FAIL] One or more gates failed.');
  return lines.join('\n');
}
