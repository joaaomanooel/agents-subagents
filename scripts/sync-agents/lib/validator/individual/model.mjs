const ALLOWED = ['opus', 'sonnet', 'haiku', 'inherit'];

export const modelValidator = (canonical) => {
  const errors = [];
  if (canonical.model_preference && !ALLOWED.includes(canonical.model_preference)) {
    errors.push({ code: 'model-preference-invalid', message: `model_preference must be one of ${ALLOWED.join(', ')} (got: ${canonical.model_preference})` });
  }
  return { errors };
};
