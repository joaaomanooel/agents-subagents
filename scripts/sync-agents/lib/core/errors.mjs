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
  ENOENT: '\n  Hint: file or directory missing.',
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
