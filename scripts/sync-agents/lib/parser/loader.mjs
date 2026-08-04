import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileExists } from '../core/io.mjs';
import { parseFrontmatter } from './parse-frontmatter.mjs';
import { validate } from '../validator/validate.mjs';
import { inferCapability, inferMode } from './infer.mjs';

export function readCanonical(root) {
  const dir = join(root, 'agents');
  if (!fileExists(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({
      sourcePath: join(dir, f),
      name: f.replace(/\.md$/, ''),
      raw: readFileSync(join(dir, f), 'utf8'),
    }));
}

export function buildCanonical(parsed, name) {
  const merged = { ...parsed.data, name };
  if (!merged.mode) merged.mode = inferMode(name);
  if (!merged.capability) merged.capability = inferCapability(name);
  return merged;
}

export function loadAndValidate(root) {
  const c = readCanonical(root);
  const errors = [];
  const warnings = [];
  const canonicals = [];

  for (const agent of c) {
    const parsed = parseFrontmatter(agent.raw);
    if (!parsed.ok) {
      errors.push({ agent: agent.name, code: 'parse-error', message: parsed.error.message });
      continue;
    }
    const merged = buildCanonical(parsed.value, agent.name);
    const v = validate(merged);
    if (!v.ok) {
      errors.push(...v.error.errors.map((e) => ({ agent: agent.name, ...e })));
      warnings.push(...v.error.warnings.map((w) => ({ agent: agent.name, ...w })));
    } else {
      warnings.push(...v.value.warnings.map((w) => ({ agent: agent.name, ...w })));
    }
    canonicals.push({
      name: agent.name,
      canonical: merged,
      body: parsed.value.body,
    });
  }

  return { canonicals, errors, warnings };
}
