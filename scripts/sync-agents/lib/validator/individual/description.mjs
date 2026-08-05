const VERBS = /^(Use|Expert|An?|Help|Helps|Reviews|Audits|Plans|Implements|Designs|Creates|Performs|Generates|Validates|Analyzes|Orchestrates|Coordinates|Facilitates|Embodies|Maintains|Inspects|Guides|Coaches)/;
const ROLE_START = /^(?:[A-Z]?[A-Za-z][\w'-]*\s+)*(?:specialist|architect|strategist|reviewer|auditor|writer|facilitator|engineer|expert|agent|assistant|advisor|consultant|coordinator|operator|designer|lead|chief|principal|composer|developer|pilot)\b/;
const USE_WHEN = /\bUse(?:\s+this)?\s+(?:agent\s+)?when\b/i;
const MIN_DESCRIPTION_LENGTH = 80;

export const descriptionValidator = (canonical) => {
  const errors = [];
  const warnings = [];
  const desc = canonical.description;

  if (!desc || typeof desc !== 'string') {
    errors.push({ code: 'description-required', message: 'description is required' });
  } else if (!hasVerbOrRoleIntent(desc)) {
    warnings.push({ code: 'description-no-verb', message: 'description should start with a verb or role descriptor (e.g. "Use when", "Reviews", "X specialist that...")' });
  } else if (desc.length < MIN_DESCRIPTION_LENGTH) {
    warnings.push({ code: 'description-short', message: `description is ${desc.length} chars; prefer >= ${MIN_DESCRIPTION_LENGTH}` });
  }

  return { errors, warnings };
};

function hasVerbOrRoleIntent(desc) {
  const trimmed = desc.trim();
  return VERBS.test(trimmed) || ROLE_START.test(trimmed) || USE_WHEN.test(desc);
}
