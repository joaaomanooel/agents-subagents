const ALLOWED = ['primary', 'subagent', 'all'];

export const modeValidator = (canonical) => {
  const errors = [];
  if (canonical.mode && !ALLOWED.includes(canonical.mode)) {
    errors.push({ code: 'mode-invalid', message: `mode must be primary, subagent, or all (got: ${canonical.mode})` });
  }
  return { errors };
};
