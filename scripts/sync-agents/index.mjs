import { join } from 'node:path';
import { readFileSync } from 'node:fs';

export { ok, err } from './lib/core/result.mjs';
export { writeUtf8, fileExists } from './lib/core/io.mjs';
export { parseFrontmatter } from './lib/parser/parse-frontmatter.mjs';
export { validate } from './lib/validator/validate.mjs';
export { inferCapability, inferMode } from './lib/parser/infer.mjs';
export { ValidatorChain } from './lib/validator/chain.mjs';
export { validatorChain } from './lib/validator/composer.mjs';
export { loadAndValidate } from './lib/parser/loader.mjs';

export { Platform } from './lib/platform/platform.mjs';
export {
  listPlatforms,
  getPlatform,
  registerPlatform,
  clearRegistry,
  ensurePlatformsInitialized,
} from './lib/platform/registry.mjs';
export { OpencodePlatform, emitOpencode } from './lib/platform/opencode.mjs';
export { ClaudePlatform, emitClaude } from './lib/platform/claude.mjs';

export { parseCli } from './lib/core/cli.mjs';
export { formatError, fatal, exitCodes } from './lib/core/errors.mjs';
export { editCanonical, decideAction } from './lib/orchestrator/interactive.mjs';
export { watchAgents, pruneOrphans } from './lib/orchestrator/watch.mjs';

import { ok, err } from './lib/core/result.mjs';
import { writeUtf8, fileExists } from './lib/core/io.mjs';
import { parseFrontmatter } from './lib/parser/parse-frontmatter.mjs';
import { validate } from './lib/validator/validate.mjs';
import { inferCapability, inferMode } from './lib/parser/infer.mjs';
import { listPlatforms } from './lib/platform/registry.mjs';
import { loadAndValidate } from './lib/parser/loader.mjs';
import './lib/platform/opencode.mjs';
import './lib/platform/claude.mjs';

export async function syncAgents({ root, dryRun = false, checkOnly = false } = {}) {
  const { canonicals, errors, warnings } = loadAndValidate(root);
  const drift = [];
  const platforms = listPlatforms();

  for (const c of canonicals) {
    for (const platform of platforms) {
      const out = platform.emit(c.canonical, c.body);
      const target = join(root, platform.outputDir, `${c.name}.md`);

      if (checkOnly) {
        if (fileExists(target) && readFileSync(target, 'utf8') !== out) {
          drift.push({ agent: c.name, target: platform.name });
        }
        continue;
      }
      if (!dryRun) writeUtf8(target, out);
    }
  }

  if (drift.length > 0) return err({ code: 'drift', items: drift });
  if (errors.length > 0) return err({ code: 'schema', items: errors, warnings });
  return ok({ warnings, processed: canonicals.length });
}

export function diffAgents({ root }) {
  const { canonicals } = loadAndValidate(root);
  const lines = [];
  const platforms = listPlatforms();

  for (const c of canonicals) {
    for (const platform of platforms) {
      const out = platform.emit(c.canonical, c.body);
      const target = join(root, platform.outputDir, `${c.name}.md`);
      const exists = fileExists(target);
      const current = exists ? readFileSync(target, 'utf8') : null;
      if (current !== out) {
        lines.push(`--- a/${platform.outputDir}/${c.name}.md`);
        lines.push(`+++ b/${platform.outputDir}/${c.name}.md`);
        lines.push(`@@ ${c.name} ${platform.name} @@`);
        lines.push(out);
        lines.push('');
      }
    }
  }
  return lines.join('\n');
}

function declaredOrInferred(declaredKey, inferred) {
  return declaredKey ? 'declared' : `inferred (${inferred})`;
}

export function auditAgents({ root }) {
  const { canonicals } = loadAndValidate(root);
  const rows = [];
  for (const c of canonicals) {
    const declared = parseFrontmatter(readFileSync(join(root, 'agents', `${c.name}.md`), 'utf8')).value.data;
    rows.push({
      name: c.name,
      mode: c.canonical.mode,
      modeSource: declaredOrInferred(declared.mode, inferMode(c.name)),
      capability: c.canonical.capability,
      capabilitySource: declaredOrInferred(declared.capability, inferCapability(c.name)),
    });
  }
  return rows;
}

export function listAgents({ root }) {
  const { canonicals } = loadAndValidate(root);
  return canonicals.map((c) => ({
    name: c.name,
    mode: c.canonical.mode,
    capability: c.canonical.capability,
    model: c.canonical.model_preference ?? 'inherit',
    color: c.canonical.color ?? '-',
  }));
}
