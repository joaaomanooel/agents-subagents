import { watch } from 'node:fs';
import { readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { listPlatforms } from '../platform/registry.mjs';
import { fileExists } from '../core/io.mjs';
import { loadAndValidate } from '../parser/loader.mjs';
import { exitCodes } from '../core/errors.mjs';

let watcher = null;
let debounceTimer = null;

export function watchAgents({ root, debounce = 200, onChange }) {
  const agentsDir = join(root, 'agents');
  if (!fileExists(agentsDir)) return;

  const run = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onChange(root), debounce);
  };

  watcher = watch(agentsDir, { recursive: false }, run);

  process.on('SIGINT', () => {
    if (watcher) watcher.close();
    if (debounceTimer) clearTimeout(debounceTimer);
    process.exit(exitCodes.CANCELLED);
  });
}

export function stopWatch() {
  if (watcher) watcher.close();
  if (debounceTimer) clearTimeout(debounceTimer);
}

export function pruneOrphans({ root, dryRun = false }) {
  const { canonicals } = loadAndValidate(root);
  const names = new Set(canonicals.map((c) => c.name));
  const removed = [];

  for (const platform of listPlatforms()) {
    const dir = join(root, platform.outputDir);
    if (!fileExists(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      const stem = f.replace(/\.md$/, '');
      if (!names.has(stem)) {
        const path = join(dir, f);
        if (!dryRun) unlinkSync(path);
        removed.push({ path, platform: platform.name });
      }
    }
  }
  return removed;
}
