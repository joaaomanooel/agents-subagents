---
description: Summarize chat context after every 3 interactions
alwaysApply: true
---

# Chat Summary After 3 Interactions

After every 3 user interactions, perform the following:

1. **Inline Summary**: Provide a brief summary of what was discussed and accomplished
2. **Update .docs**: Create or update relevant `.docs/<context>.md` files with:
 - Agreements made
 - Decisions taken
 - Context for future sessions

## Summary Format

### Inline Summary
- 2-3 bullet points of key topics discussed
- Actions completed or pending
- Any blockers or open questions

### .docs Update
- Group by topic/feature in separate files
- Use structured Markdown with clear sections
- Record agreements, definitions, and notes
