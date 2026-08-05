import { Platform } from './platform.mjs';
import { registerPlatform, getPlatform } from './registry.mjs';

const CAPABILITY_PERMISSIONS = {
  'read-only': ['edit: deny', 'bash: deny'],
  'code-edit': ['edit: allow', 'bash: allow'],
  'full-bash': ['edit: allow', 'bash: allow'],
};

function permissionBlock(canonical) {
  const lines = [];
  const capPerm = CAPABILITY_PERMISSIONS[canonical.capability ?? 'code-edit'];
  const taskAgents = Array.isArray(canonical.task_agents) ? canonical.task_agents : [];

  if (!capPerm && taskAgents.length === 0) return '';

  lines.push('permission:');

  if (capPerm) {
    for (const line of capPerm) {
      lines.push(`  ${line}`);
    }
  }

  if (taskAgents.length > 0) {
    lines.push('  task:');
    lines.push('    "*": "deny"');
    for (const name of taskAgents) {
      lines.push(`    "${name}": "allow"`);
    }
  }

  return lines.join('\n');
}

function yamlScalar(s) {
  if (typeof s !== 'string') return s;
  if (s.includes('\n')) return `|\n    ${s.split('\n').join('\n    ')}`;
  return s;
}

export class OpencodePlatform extends Platform {
  #name = 'opencode';
  #outputDir = '.opencode/agents';

  get name() { return this.#name; }
  get outputDir() { return this.#outputDir; }
  describe() { return 'opencode (mode + permission keys)'; }

  mapCapability(capability) {
    return CAPABILITY_PERMISSIONS[capability] ?? [];
  }

  emit(canonical, body) {
    const mode = canonical.mode ?? 'subagent';
    const permBlock = permissionBlock(canonical);

    const lines = [];
    lines.push('---');
    lines.push(`description: ${yamlScalar(canonical.description ?? '')}`);
    lines.push(`mode: ${mode}`);
    if (permBlock) lines.push(permBlock);
    if (canonical.color) {
      lines.push(`color: ${canonical.color.startsWith('#') ? `"${canonical.color}"` : canonical.color}`);
    }
    lines.push('---');
    lines.push('');
    lines.push(body ?? '');
    return lines.join('\n');
  }
}

registerPlatform(new OpencodePlatform());

export function emitOpencode(canonical, body) {
  return getPlatform('opencode').emit(canonical, body);
}
