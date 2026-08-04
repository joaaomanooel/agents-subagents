const NAME_RE = /^[a-z][a-z0-9-]*[a-z0-9]$/;

export const nameValidator = (canonical) => {
  const errors = [];
  if (!canonical.name || typeof canonical.name !== 'string') {
    errors.push({ code: 'name-required', message: 'name is required' });
  } else if (!NAME_RE.test(canonical.name)) {
    errors.push({ code: 'name-format', message: `name must match kebab-case (got: ${canonical.name})` });
  }
  return { errors };
};
