import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ACTIONS = new Map([
  ['', 'accept'], ['y', 'accept'], ['yes', 'accept'],
  ['n', 'reject'], ['no', 'reject'],
  ['e', 'edit'], ['edit', 'edit'],
  ['s', 'skip'], ['skip', 'skip'],
  ['d', 'diff'], ['diff', 'diff'],
]);

export async function editCanonical({ root, name, body }) {
  const editor = process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi');
  const dir = mkdtempSync(join(tmpdir(), 'sync-agent-'));
  const file = join(dir, `${name}.md`);
  writeFileSync(file, body, 'utf8');

  await new Promise((resolve, reject) => {
    const child = spawn(editor, [file], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('TIMEOUT'));
    }, 30_000);
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  const edited = readFileSync(file, 'utf8');
  unlinkSync(file);
  return { original: body, edited, changed: edited !== body };
}

export function promptForAgent(rl, name) {
  return rl.question(`  [${name}] [Y/n/e(dit)/s(kip)/d(iff)] default Y: `)
    .then((answer) => answer.trim().toLowerCase());
}

export function decideAction(answer) {
  return ACTIONS.get(String(answer).trim().toLowerCase()) ?? 'accept';
}
