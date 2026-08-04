const VERBS = /^(Use|Expert|An?|Help|Helps|Reviews|Audits|Plans|Implements|Designs|Creates|Performs|Generates|Validates|Analyzes|Orchestrates|Coordinates)/;
const MIN_DESCRIPTION_LENGTH = 80;

export const descriptionValidator = (canonical) => {
  const errors = [];
  const warnings = [];
  const desc = canonical.description;

  if (!desc || typeof desc !== 'string') {
    errors.push({ code: 'description-required', message: 'description is required' });
  } else if (!VERBS.test(desc.trim())) {
    warnings.push({ code: 'description-no-verb', message: 'description should start with a verb' });
  } else if (desc.length < MIN_DESCRIPTION_LENGTH) {
    warnings.push({ code: 'description-short', message: `description is ${desc.length} chars; prefer >= ${MIN_DESCRIPTION_LENGTH}` });
  }

  return { errors, warnings };
};
