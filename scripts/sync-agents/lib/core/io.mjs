import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';

export function readUtf8(path) {
  return readFileSync(path, 'utf8');
}

export function writeUtf8(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.replace(/\r\n/g, '\n'), 'utf8');
}

export function fileExists(path) {
  return existsSync(path);
}

export function removeFile(path) {
  if (existsSync(path)) unlinkSync(path);
}

export function isFile(path) {
  return existsSync(path) && statSync(path).isFile();
}
