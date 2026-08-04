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
      const n = Number(arg.slice('--debounce='.length));
      result.debounce = Number.isFinite(n) && n >= 0 ? n : 200;
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
