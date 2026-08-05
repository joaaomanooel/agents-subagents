const KEBAB_RE = /^[a-z][a-z0-9-]*[a-z0-9]$/;

export const taskAgentsValidator = (canonical, ctx = {}) => {
  const errors = [];
  const warnings = [];
  const value = canonical.task_agents;

  if (value === undefined || value === null) return { errors, warnings };
  if (!Array.isArray(value) || value.some((s) => typeof s !== 'string')) {
    errors.push({
      code: 'task-agents-format',
      message: 'task_agents must be array of strings',
    });
    return { errors, warnings };
  }

  for (const name of value) {
    if (!KEBAB_RE.test(name)) {
      errors.push({
        code: 'task-agents-name',
        message: `task_agents entry must be kebab-case (got: ${name})`,
      });
    }
  }

  const existing = ctx.existingAgentNames;
  if (existing) {
    for (const name of value) {
      if (!existing.has(name)) {
        warnings.push({
          code: 'task-agents-unknown-name',
          message: `task_agents references "${name}" but no such agent exists in agents/`,
        });
      }
    }
  }

  return { errors, warnings };
};
