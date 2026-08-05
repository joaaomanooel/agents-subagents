# Agent Team Expansion: Cleanup, Orchestrators, and Collaboration

Status: Draft (pending user review)
Date: 2026-08-04
Owner: repository maintainers

Extend the agent catalog from 30 to 32 active agents by adding 4 new
specialists and 4 orchestrators that delegate to other agents via the
`task_agents` canonical field. Remove the 6 deprecated legacy agents.
Add a shared context mechanism so teams can communicate across handoffs.

---

## Summary

This work adds four new specialist agents (database, API design,
engineering writing, tech-debt hunting) and four orchestrators that pilot
end-to-end workflows (feature delivery, code review, bug investigation,
refactoring). Each orchestrator declares a `task_agents` list naming
which agents it can invoke, which maps to platform-specific Task or
Agent permissions. A new shared context file pattern (`.docs/active/
<feature>.md`) lets agents hand off state across phases. The sync tool
gains translation rules for the new field and a validator to verify
referenced agents exist.

## Decisions made

- Decommission 6 legacy agents: `ai-code-reviewer`, `ai-dev-planner`,
  `code-reviewer`, `context-docs`, `docs-context-keeper`, `plan-specialist`.
  After expansion: 30 − 6 + 8 = 32 active agents.
- Add 4 new specialists: `database-specialist`, `api-designer`,
  `engineering-writer`, `tech-debt-hunter`.
- Add 4 new orchestrators: `feature-team-pilot`, `code-review-team-lead`,
  `bug-squad-lead`, `refactoring-team-lead`.
- Each orchestrator's body includes a "Collaboration contract" section
  that explicitly documents which agents it invokes and in which order.
- Add canonical field `task_agents` (array of strings) — list of agent
  names the agent can invoke via the Task tool.
- Add canonical field `related_agents` (object) — `pilots`,
  `input_from`, `output_to` arrays for documentation only. Not emitted
  to platforms; surfaces in `--audit`.
- Add shared context mechanism: `.docs/active/<feature>.md` files
  maintained by orchestrators as a blackboard for handoffs.
- Add new module `scripts/sync-agents/lib/team/context.mjs` with
  `createContext`, `readContext`, `updatePhase`, `recordOutput`,
  `markPhaseDone`. CLI: `scripts/context.mjs`.
- Add validator `task-agents.mjs` that checks each entry names an
  existing agent.
- Sync tool maps `task_agents` to:
  - opencode: `permission.task: { "*": "deny", "<name>": "allow" }`
  - claudecode: `tools: Agent(<name1>, <name2>, ...)` prefix in the tools line.
- All non-orchestrator agents get `task_agents: []` (no sub-dispatch).
- Documentation must explain each agent's role, when to invoke, and what
  it produces — for both human readers and ambient context for other agents.

## Definitions

- "Pilot" — an orchestrator agent that runs a multi-phase workflow,
  invoking other agents in sequence and managing shared state.
- "Shared context file" — a Markdown file at `.docs/active/<feature>.md`
  that orchestrators maintain as a blackboard for handoffs.
- "Task agent" — any agent that appears in another agent's
  `task_agents` list, denoting invokable via Task/Agent tool.
- "Collaboration contract" — the documented ordering and outputs of
  agents in a workflow, written in the orchestrator's body.

## Details

### Cleanup

Decommission by deletion: removes 6 legacy agents and the generated
`.opencode/agents/<name>.md` and `.claude/agents/<name>.md` mirrors.
Generated mirrors re-run after deletion leaves the directories at
24 agents.

### New specialists

| Name | Capability | Description |
|---|---|---|
| `database-specialist` | full-bash | Schema design, migrations, query optimization, indexing, ORM mapping |
| `api-designer` | read-only | REST/GraphQL contract design, OpenAPI specs, surface consistency |
| `engineering-writer` | code-edit | ADRs, RFCs, runbooks, internal technical documentation |
| `tech-debt-hunter` | read-only | Identifies and prioritizes technical debt, code smells, outdated dependencies |

### New orchestrators

| Name | Capability | Phases piloted |
|---|---|---|
| `feature-team-pilot` | full-bash | plan → design → backend → frontend → typescript → test → review → docs |
| `code-review-team-lead` | read-only | baseline review → security → performance → typescript → api → test |
| `bug-squad-lead` | full-bash | reproduce → triage → investigate → fix → verify → review |
| `refactoring-team-lead` | full-bash | audit (typescript, performance, api, debt) → plan → execute → verify → review → docs |

### `task_agents` schema

```yaml
task_agents:
  - implementation-planner
  - senior-backend-developer
  - database-specialist
```

Mapping:

- **opencode** — emits permission block:
  ```yaml
  permission:
    task:
      "*": "deny"
      implementation-planner: "allow"
      senior-backend-developer: "allow"
      database-specialist: "allow"
  ```
- **claudecode** — prepends `Agent(<name1>, <name2>, ...)` to the tools list:
  ```yaml
  tools: Agent(implementation-planner, senior-backend-developer, database-specialist), Read, Grep, Glob, Bash, Edit, Write
  ```

If `task_agents: []` (or absent), the tools line on claudecode omits
any `Agent(...)` and the permission block on opencode omits `task`.

### `related_agents` schema (documentation only)

```yaml
related_agents:
  pilots:
    - staff-orchestrator
    - feature-team-pilot
  input_from:
    - implementation-planner
    - api-designer
  output_to:
    - senior-test-engineer
    - unified-code-reviewer
    - docs-context-agent
```

This field is NOT emitted to platform files. It surfaces in the
`--audit` output so reviewers can see who calls whom.

### Shared context file format

```yaml
---
feature: user-authentication
status: in-progress
team: feature-team-pilot
phase: 2-implementation
created: 2026-08-04
updated: 2026-08-04
---
# Feature: user-authentication

## Goal
[free text]

## Phase 1: Plan
- [x] implementation-planner: 2026-08-04

## Phase 2: Implementation
- [x] senior-backend-developer: 2026-08-04
- [ ] senior-frontend-developer: pending

## Phase 3: Test
- [ ] senior-test-engineer

## Phase 4: Review
- [ ] unified-code-reviewer

## Phase 5: Documentation
- [ ] docs-context-agent

## Outputs
### implementation-planner
[output captured at completion]

### senior-backend-developer
[output captured at completion]
```

The orchestrator updates `status`, `phase`, `updated`, and the checkbox
state after each agent completes. The `## Outputs` section appends the
agent's full output for downstream consumption.

### Orchestrator body contract

Each orchestrator's body must include:

1. **Role** — "You are X, a pilot agent that ..."
2. **Operating procedure** — numbered steps:
   1. Read `.docs/active/<feature>.md` (or create it if absent)
   2. Identify the next agent in the phase list
   3. Invoke that agent via Task tool, passing the context file path
   4. Append agent output to `## Outputs` section
   5. Mark the agent's checkbox done
   6. Advance phase or pick next agent
   7. When all phases complete, write a summary and exit
3. **Phase list** — explicit numbered phases with agents
4. **Stopping rules** — when to halt, ask user, or escalate
5. **Output format** — what the orchestrator returns

### Module structure

`scripts/sync-agents/lib/team/`:
- `context.mjs` — read/write/update shared context files
- `context.test.mjs` — tests

`scripts/context.mjs`:
- CLI: `create`, `read`, `phase`, `log`, `done` subcommands

`scripts/sync-agents/lib/validator/individual/`:
- `task-agents.mjs` — validates `task_agents` is array of strings + names
  reference existing agents

`scripts/sync-agents/lib/platform/`:
- `opencode.mjs` — emit `permission.task` block
- `claude.mjs` — emit `Agent(...)` in tools line

### Audit improvements

`--audit` now includes:

```
NAME                            MODE    CAPABILITY  TASK-AGENTS (n)  RELATED
feature-team-pilot              subagent full-bash  7               pilots: 0
senior-backend-developer        all     full-bash  1               pilots: 3
...
```

Plus a cross-reference report at end: agents referenced by
`task_agents` that don't exist as canonical files.

### Test strategy

New tests:

- `lib/platform/opencode.test.mjs` — emit `permission.task` block
- `lib/platform/claude.test.mjs` — emit `Agent(...)` in tools
- `lib/validator/individual/task-agents.test.mjs` — array validation + name
  validation
- `lib/team/context.test.mjs` — create/read/update/append/phase
- `scripts/__tests__/context.test.mjs` — CLI

Coverage target: ≥ 90% lines/functions, ≥ 85% branches (current
thresholds).

### Migration path

1. Add new specialists and orchestrators (8 new agents)
2. Add `task_agents` to all 32 agents (24 current + 4 new specialists +
   4 new orchestrators with full lists). Decommission 6 legacy. After
   this step: 32 active agents.
3. Decommission 6 legacy agents
4. Run sync — 28 × 2 = 56 generated files
5. Run validators — all references must resolve
6. Document the new workflow in `docs/agent-teams.md`

### Files changed

**New files:**
- `agents/database-specialist.md`
- `agents/api-designer.md`
- `agents/engineering-writer.md`
- `agents/tech-debt-hunter.md`
- `agents/feature-team-pilot.md`
- `agents/code-review-team-lead.md`
- `agents/bug-squad-lead.md`
- `agents/refactoring-team-lead.md`
- `scripts/sync-agents/lib/team/context.mjs`
- `scripts/sync-agents/lib/team/__tests__/context.test.mjs`
- `scripts/sync-agents/lib/validator/individual/task-agents.mjs`
- `scripts/sync-agents/lib/validator/individual/__tests__/task-agents.test.mjs`
- `scripts/sync-agents/lib/validator/composer.mjs` (updated)
- `scripts/context.mjs` (CLI)
- `scripts/__tests__/context.test.mjs`
- `docs/agent-teams.md` (usage guide)

**Modified files:**
- All 24 existing agents gain `task_agents: []` and `related_agents: {...}`
- `scripts/sync-agents/lib/platform/opencode.mjs` — emit `permission.task`
- `scripts/sync-agents/lib/platform/claude.mjs` — emit `Agent(...)`
- `scripts/sync-agents/lib/validator/composer.mjs` — register new
  validator
- `scripts/sync-agents/index.mjs` — `auditAgents` shows task_agents
- `AGENTS.md` — schema update
- `CLAUDE.md` — workflow examples
- `README.md` — mention teams

**Deleted files:**
- `agents/ai-code-reviewer.md`
- `agents/ai-dev-planner.md`
- `agents/code-reviewer.md`
- `agents/context-docs.md`
- `agents/docs-context-keeper.md`
- `agents/plan-specialist.md`

### Validation and quality gates

Add `task_agents` validator to the chain. The validator checks:
- `task_agents` is array of strings
- Each entry is a valid kebab-case name
- Each entry names an agent that exists in `agents/`

If `task_agents` references an unknown agent, the validator emits an
error and the sync tool aborts. This prevents broken cross-references.

### Risks and mitigations

| Risk | Mitigation |
|---|---|
| Orchestrator agent runs forever in a loop | Each orchestrator has a `maxPhase` < 10 to prevent runaway |
| Two agents modify the same shared context concurrently | Append-only semantics; orchestrator is the single writer |
| `task_agents` references deleted agent | Validator catches at sync time |
| Claude Code or opencode versions with different `Agent(...)` syntax | Tested in CI matrix; fallback documented |
| Token explosion from large `## Outputs` section | Output is truncated at 20KB per agent; flagged if truncated |

## Notes

- The shared context file is intentionally a blackboard, not a
  workflow engine. Orchestrators read what's relevant and append
  what's new. Each agent decides which parts to consult.
- The `task_agents` field is the contractual wire between platforms.
  If an orchestrator lists an agent there, the platform MUST allow the
  Task/Agent invocation.
- The `related_agents` field is documentation, not a contract. It
  exists for human auditors and to surface collaboration patterns in
  `--audit`.
- Decommissioning legacy agents is irreversible. Users who depend
  on them must migrate to the preferred agents before this lands.

## References

- `agents/` — current 24 active agents
- `scripts/sync-agents/lib/` — current sync tool internals
- `docs/agents-platforms.md` — extension guide
- `docs/superpowers/specs/2026-08-04-agent-dual-platform-design.md` —
  previous spec for dual-platform support
- `AGENTS.md` — current conventions for frontmatter
