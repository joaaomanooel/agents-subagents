#!/usr/bin/env node
import process from 'node:process';
import { fatal, exitCodes } from './sync-agents/lib/core/errors.mjs';
import {
  createContext, readContext, updatePhase, recordOutput, markPhaseDone,
} from './sync-agents/lib/team/context.mjs';

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
