import { Platform } from './platform.mjs';
import { registerPlatform, getPlatform } from './registry.mjs';

const PERMISSIONS = {
  'read-only': '  permission:\n    edit: deny\n    bash: deny',
  'code-edit': '  permission:\n    bash: ask',
  'full-bash': '',
};

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
    return PERMISSIONS[capability] ?? '';
  }

  emit(canonical, body) {
    const mode = canonical.mode ?? 'subagent';
    const capability = canonical.capability ?? 'code-edit';
    const permissionBlock = this.mapCapability(capability);

    const lines = [];
    lines.push('---');
    lines.push(`description: ${yamlScalar(canonical.description ?? '')}`);
    lines.push(`mode: ${mode}`);
    if (permissionBlock) lines.push(permissionBlock);
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
