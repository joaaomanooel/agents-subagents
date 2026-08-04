const FIELD_NAMES = new Set(['mcp', 'skills']);

export const arrayFieldsValidator = (canonical) => {
  const errors = [];
  for (const fieldName of FIELD_NAMES) {
    const value = canonical[fieldName];
    if (!value) continue;
    if (!Array.isArray(value) || hasNonStringMember(value)) {
      errors.push({ code: `${fieldName}-format`, message: `${fieldName} must be array of strings` });
    }
  }
  return { errors };
};

function hasNonStringMember(arr) {
  for (const item of arr) {
    if (typeof item !== 'string') return true;
  }
  return false;
}
