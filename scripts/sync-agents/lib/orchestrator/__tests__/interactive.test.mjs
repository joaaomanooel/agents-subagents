import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideAction, editCanonical } from '../interactive.mjs';
import { writeFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('decideAction returns accept for empty input', () => {
  assert.equal(decideAction(''), 'accept');
});

test('decideAction returns accept for y/yes', () => {
  assert.equal(decideAction('y'), 'accept');
  assert.equal(decideAction('YES'), 'accept');
});

test('decideAction returns reject for n/no', () => {
  assert.equal(decideAction('n'), 'reject');
  assert.equal(decideAction('no'), 'reject');
});

test('decideAction returns edit/skip/diff', () => {
  assert.equal(decideAction('e'), 'edit');
  assert.equal(decideAction('s'), 'skip');
  assert.equal(decideAction('d'), 'diff');
});

test('editCanonical writes file and reads it back', async () => {
  process.env.EDITOR = 'cat';
  const result = await editCanonical({
    root: '/tmp',
    name: 'foo',
    body: 'original content',
  });
  assert.equal(result.original, 'original content');
  assert.equal(result.edited, 'original content');
  assert.equal(result.changed, false);
});

test('editCanonical detects changes', async () => {
  const fakeEditor = join(tmpdir(), `editor-${Date.now()}.sh`);
  writeFileSync(fakeEditor, '#!/usr/bin/env bash\necho "changed" >> "$1"\n');
  chmodSync(fakeEditor, 0o755);
  process.env.EDITOR = fakeEditor;

  const result = await editCanonical({
    root: '/tmp',
    name: 'foo',
    body: 'original content',
  });
  assert.equal(result.changed, true);
  assert.match(result.edited, /changed/);
  rmSync(fakeEditor, { force: true });
});
