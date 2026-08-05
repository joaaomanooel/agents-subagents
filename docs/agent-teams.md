# Agent Teams

Some agents coordinate other agents via the Task/Agent tool. Each
orchestrator declares `task_agents` in its frontmatter; the sync tool
emits platform-specific permissions.

## Orchestrators

| Orchestrator | Phases | Specialists |
|---|---|---|
| `feature-team-pilot` | plan → design → backend → frontend → typescript → test → review → docs | implementation-planner, api-designer, senior-backend-developer, database-specialist, senior-frontend-developer, senior-typescript-specialist, senior-test-engineer, unified-code-reviewer, security-auditor, performance-analyst, docs-context-agent, engineering-writer |
| `code-review-team-lead` | baseline → security → performance → typescript → api → test | unified-code-reviewer, security-auditor, performance-analyst, senior-typescript-specialist, api-designer, senior-test-engineer |
| `bug-squad-lead` | reproduce → triage → investigate → fix → verify → review | senior-test-engineer, senior-fullstack-developer, senior-backend-developer, senior-frontend-developer, database-specialist, senior-typescript-specialist, security-auditor, performance-analyst, api-designer, unified-code-reviewer |
| `refactoring-team-lead` | audit → plan → execute → verify → review → document | senior-typescript-specialist, performance-analyst, api-designer, tech-debt-hunter, senior-plan-specialist, senior-fullstack-developer, senior-test-engineer, unified-code-reviewer, docs-context-agent |

## Shared context

Orchestrators maintain a `.docs/active/<feature>.md` file as a blackboard:

```bash
node scripts/context.mjs create user-auth --goal "Add login" --team feature-team-pilot
node scripts/context.mjs phase user-auth 2-impl
node scripts/context.mjs log user-auth senior-frontend-developer "Built login form"
node scripts/context.mjs done user-auth senior-frontend-developer --phase 2-impl
node scripts/context.mjs read user-auth
```

Each agent reads the context, appends its output, and the orchestrator
advances the phase.

## Audit cross-references

Run `node scripts/sync-agents.mjs --audit` to see:

- All agents and their task_agents lists
- Any unresolved references (agents in task_agents that don't exist)

This surface is in addition to the existing capability/mode audit.
