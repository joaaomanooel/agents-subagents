import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readUtf8, writeUtf8, fileExists, removeFile, isFile } from '../io.mjs';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function tmpRoot() {
  return join(tmpdir(), `io-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

test('fileExists returns false for missing file', () => {
  assert.equal(fileExists('/totally/missing/file.md'), false);
});

test('writeUtf8 normalizes CRLF to LF', () => {
  const root = tmpRoot();
  const path = join(root, 'foo.md');
  try {
    writeUtf8(path, 'a\r\nb\r\nc');
    const content = readUtf8(path);
    assert.equal(content, 'a\nb\nc');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('writeUtf8 creates parent directories', () => {
  const root = tmpRoot();
  const path = join(root, 'nested', 'deep', 'foo.md');
  try {
    writeUtf8(path, 'data');
    assert.equal(fileExists(path), true);
    assert.equal(isFile(path), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('removeFile is idempotent', () => {
  const root = tmpRoot();
  const path = join(root, 'foo.md');
  writeUtf8(path, 'data');
  removeFile(path);
  removeFile(path);
  assert.equal(fileExists(path), false);
});
