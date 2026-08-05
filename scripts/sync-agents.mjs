#!/usr/bin/env node
import process from 'node:process';
import { parseCli } from './sync-agents/lib/core/cli.mjs';
import { fatal, exitCodes } from './sync-agents/lib/core/errors.mjs';
import {
  syncAgents,
  diffAgents,
  auditAgents,
  listAgents,
  watchAgents,
  pruneOrphans,
  editCanonical,
  ensurePlatformsInitialized,
  decideAction,
} from './sync-agents/index.mjs';
import { createInterface } from 'node:readline/promises';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

process.on('uncaughtException', (e) => fatal(e, 'uncaughtException'));
process.on('unhandledRejection', (e) => fatal(e, 'unhandledRejection'));
process.on('SIGINT', () => process.exit(exitCodes.CANCELLED));

const cli = parseCli(process.argv.slice(2));
const root = process.cwd();
ensurePlatformsInitialized();

function formatErrors(errors) {
  if (!errors?.length) return '';
  return errors.map((e) => `  - ${e.agent ?? '?'}: [${e.code}] ${e.message}`).join('\n');
}

function formatWarnings(warnings) {
  if (!warnings?.length) return '';
  return warnings.map((w) => `  ! ${w.agent ?? '?'}: [${w.code}] ${w.message}`).join('\n');
}

async function main() {
  if (cli.mode === 'sync') {
    const result = await syncAgents({ root, dryRun: cli.flags.has('--dry-run') });
    if (!result.ok) {
      if (result.error.code === 'drift') {
        process.stderr.write(`[drift] ${result.error.items.length} file(s) out of sync. Run sync-agents.mjs to fix.\n`);
        process.exit(exitCodes.DRIFT);
      }
      process.stderr.write(`[error] ${formatErrors(result.error.items) || '(no items)'}\n`);
      if (result.error.warnings?.length) process.stderr.write(`[warnings]\n${formatWarnings(result.error.warnings)}\n`);
      process.exit(exitCodes.ERROR);
    }
    process.stdout.write(`[ok] ${result.value.processed} agents synced.\n`);
    if (result.value.warnings?.length) process.stderr.write(`[warnings]\n${formatWarnings(result.value.warnings)}\n`);
    process.exit(exitCodes.OK);
  }

  if (cli.mode === 'check') {
    const result = await syncAgents({ root, dryRun: false, checkOnly: true });
    if (!result.ok) {
      if (result.error.code === 'drift') {
        process.stderr.write(`[drift] ${result.error.items.length} file(s) out of sync:\n`);
        for (const d of result.error.items) process.stderr.write(`  - ${d.target}/${d.agent}.md\n`);
        process.exit(exitCodes.DRIFT);
      }
      process.stderr.write(`[error] ${formatErrors(result.error.items)}\n`);
      process.exit(exitCodes.ERROR);
    }
    process.stdout.write(`[ok] no drift across ${result.value.processed} agents.\n`);
    process.exit(exitCodes.OK);
  }

  if (cli.mode === 'diff') {
    process.stdout.write(diffAgents({ root }));
    process.stdout.write('\n');
    process.exit(exitCodes.OK);
  }

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

  if (cli.mode === 'list') {
    const rows = listAgents({ root });
    process.stdout.write('NAME                           MODE       CAPABILITY   MODEL     COLOR\n');
    for (const r of rows) {
      process.stdout.write(
        `${r.name.padEnd(27)}  ${r.mode.padEnd(9)}  ${r.capability.padEnd(10)}  ${String(r.model).padEnd(8)}  ${r.color}\n`,
      );
    }
    process.exit(exitCodes.OK);
  }

  if (cli.mode === 'interactive') {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const result = await syncAgents({ root, dryRun: cli.flags.has('--dry-run') });
    if (!result.ok) {
      process.stderr.write(`[error] ${formatErrors(result.error.items)}\n`);
      process.exit(exitCodes.ERROR);
    }
    process.stdout.write('Sync complete. Use --interactive with editor tweaks if needed (separate flow).\n');
    await rl.close();
    process.exit(exitCodes.OK);
  }

  if (cli.flags.has('--prune')) {
    const removed = pruneOrphans({ root, dryRun: cli.flags.has('--dry-run') });
    process.stdout.write(`[prune] removed ${removed.length} orphan files\n`);
    process.exit(exitCodes.OK);
  }

  if (cli.flags.has('--watch')) {
    process.stdout.write(`[watch] watching ${join(root, 'agents')} (debounce ${cli.debounce}ms)\n`);
    watchAgents({ root, debounce: cli.debounce, onChange: async (r) => {
      await syncAgents({ root: r, dryRun: false });
    } });
    return;
  }

  process.stderr.write(`unknown mode: ${cli.mode}\n`);
  process.exit(exitCodes.ARGS);
}

main().catch((err) => fatal(err, 'main'));
