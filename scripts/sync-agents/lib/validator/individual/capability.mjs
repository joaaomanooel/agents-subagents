const ALLOWED = ['read-only', 'code-edit', 'full-bash'];

export const capabilityValidator = (canonical) => {
  const errors = [];
  const warnings = [];

  if (canonical.capability && !ALLOWED.includes(canonical.capability)) {
    errors.push({ code: 'capability-invalid', message: `capability must be read-only, code-edit, or full-bash (got: ${canonical.capability})` });
  } else if (!canonical.capability) {
    warnings.push({ code: 'capability-inferred', message: 'capability not declared; will be inferred from name' });
  }

  return { errors, warnings };
};
