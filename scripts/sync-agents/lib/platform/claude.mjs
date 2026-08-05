import { Platform } from './platform.mjs';
import { registerPlatform, getPlatform } from './registry.mjs';

const TOOLS = {
  'read-only': 'Read, Grep, Glob',
  'code-edit': 'Read, Grep, Glob, Bash, Edit, Write',
  'full-bash': 'Read, Grep, Glob, Bash, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill',
};

const COLORS = {
  '#3B82F6': 'blue', '#10B981': 'green', '#F59E0B': 'yellow',
  '#EF4444': 'red', '#8B5CF6': 'purple', '#F97316': 'orange',
};

function yamlScalar(s) {
  if (typeof s !== 'string') return s;
  if (s.includes('\n')) return `|\n    ${s.split('\n').join('\n    ')}`;
  return s;
}

export class ClaudePlatform extends Platform {
  #name = 'claude';
  #outputDir = '.claude/agents';

  get name() { return this.#name; }
  get outputDir() { return this.#outputDir; }
  describe() { return 'Claude Code (tools list + permissionMode)'; }

  mapCapability(capability) {
    return TOOLS[capability] ?? TOOLS['code-edit'];
  }

  emit(canonical, body) {
    const capability = canonical.capability ?? 'code-edit';
    const tools = this.mapCapability(capability);
    const taskAgents = Array.isArray(canonical.task_agents) && canonical.task_agents.length > 0
      ? `Agent(${canonical.task_agents.join(', ')}), `
      : '';
    const lines = [];

    lines.push('---');
    lines.push(`name: ${canonical.name}`);
    lines.push(`description: ${yamlScalar(canonical.description ?? '')}`);

    if (canonical.mode === 'primary') lines.push('mode: primary');

    lines.push(`tools: ${taskAgents}${tools}`);

    if (canonical.skills?.length) {
      lines.push('skills:');
      for (const skill of canonical.skills) lines.push(`  - ${skill}`);
    }

    if (canonical.mcp?.length) {
      lines.push('mcpServers:');
      for (const mcp of canonical.mcp) lines.push(`  - ${mcp}`);
    }

    if (canonical.model_preference && canonical.model_preference !== 'inherit') {
      lines.push(`model: ${canonical.model_preference}`);
    }

    if (canonical.color) {
      const mapped = COLORS[canonical.color] ?? canonical.color;
      lines.push(`color: ${mapped}`);
    }

    lines.push('---');
    lines.push('');
    lines.push(body ?? '');
    return lines.join('\n');
  }
}

registerPlatform(new ClaudePlatform());

export function emitClaude(canonical, body) {
  return getPlatform('claude').emit(canonical, body);
}
