# Agents and Rules Repository

Welcome. This repository stores AI agent definitions and shared rule files used by opencode and Claude Code (and other AI-assisted editor workflows).

It is a markdown-first project: the main goal here is to define how agents should think, respond, review, plan, and collaborate inside real development environments. A small Node tool (`scripts/sync-agents.mjs`) emits dual-platform mirrors of each canonical agent so the same definitions load natively in both editors.

## What This Project Does

- Defines 30 specialized agents for planning, code review, testing, UX, security, performance, and multi-disciplinary collaboration.
- Centralizes reusable rule files that shape assistant behavior across repositories and tasks.
- Keeps agent instructions explicit, versioned, and easy to evolve in plain Markdown.
- Emits dual-platform outputs (`opencode` + `claudecode`) from a single source of truth via the sync tool.

## Who This Repository Is For

This repo is useful for people who:

- maintain AI-assisted engineering workflows,
- want consistent agent behavior across tools,
- need reusable prompts with clear scope and responsibilities,
- prefer keeping operational guidance in version-controlled documentation.

## Preferred Agents

For new workflows, the current preferred trio is:

- `implementation-planner`
- `unified-code-reviewer`
- `docs-context-agent`

Some legacy agents are still present during the transition period, but new flows should prefer the trio above.

## Repository Layout

```text
agents/                            Canonical agents (manual edits, 30 files)
.opencode/agents/                  Generated (opencode format, committed)
.claude/agents/                    Generated (Claude Code format, committed)
rules/                             Shared behavior and quality rules (37 files)
skills/                            Project-local skills (test-engineer-js, etc.)
docs/
├── superpowers/specs/             Specs for past work
├── superpowers/plans/             Implementation plans
├── agents-platforms.md            Extension guide for adding platforms
└── ...
opencode.json                      Tooling configuration for opencode
```

### `agents/`

Each file in `agents/` defines one agent with:

- YAML frontmatter metadata (name, description, capability, mode, mcp, skills, color)
- A role definition: "You are..."
- Behavioral guidelines
- Expected output structure
- Invocation guidance

Examples of agent categories in this repository:

- planning and implementation,
- code review,
- testing,
- UX and design systems,
- security and performance,
- collaborative and workshop-style agents.

### `rules/`

Behavior and engineering standards. See `rules/INDEX.md` for the full inventory.

### `skills/`

Project-local skills. Current local skill:

- `skills/test-engineer-js/SKILL.md` — JavaScript and TypeScript testing guidance focused on trustworthy, behavior-oriented tests.

### Dual-Platform Sync

Each canonical agent in `agents/<name>.md` is emitted to two platforms:

- `.opencode/agents/<name>.md` — opencode native format
- `.claude/agents/<name>.md` — Claude Code native format

Both outputs contain the same markdown body; only the YAML frontmatter differs. The `scripts/sync-agents/` tool is built on Strategy + Registry + Chain of Responsibility patterns to make adding new platforms a one-file change.

## Quick Start (Sync Workflow)

### Edit an agent

```bash
$EDITOR agents/senior-frontend-developer.md
node scripts/sync-agents.mjs             # sync to both platforms
git add agents/  .opencode/agents/  .claude/agents/
git commit -m "feat(agents): ..."
```

### Useful commands

| Command                              | What it does                              |
| ------------------------------------ | ----------------------------------------- |
| `node scripts/sync-agents.mjs`       | Sync everything                           |
| `node scripts/sync-agents.mjs --check` | CI mode (exit 1 on drift)                |
| `node scripts/sync-agents.mjs --diff`  | Show what would change                    |
| `node scripts/sync-agents.mjs --audit` | List resolved vs declared configs        |
| `node scripts/sync-agents.mjs --list`  | Compact table of all agents               |
| `node scripts/sync-agents.mjs --agent=foo` | Sync one agent                        |
| `node scripts/sync-agents.mjs --interactive` | Confirm agent by agent, edit inline |
| `node scripts/sync-agents.mjs --prune` | Remove orphan generated files           |
| `node scripts/sync-agents.mjs --watch` | Resync on file changes (debounced)       |

### Quality gates

`scripts/hooks/pre-commit` runs sync drift check + the quality gate suite (secrets, forbidden fields, big-o, complexity). Enable globally:

```bash
git config core.hooksPath scripts/hooks
```

CI runs the same checks via `.github/workflows/quality-gates.yml` on Ubuntu, macOS, and Windows.

### Adding a new agent

1. Copy an existing agent's frontmatter
2. Set `name`, `description`, `capability`, `mode`
3. Run `node scripts/sync-agents.mjs` to emit to both platforms
4. Commit the canonical + both generated files

### Adding a new platform

See `docs/agents-platforms.md`. The Strategy + Registry pattern means adding a platform is one file in `scripts/sync-agents/lib/platforms/` plus one line in `index.mjs`.

## Tests

```bash
node --test --experimental-test-coverage 'scripts/**/*.test.mjs'
```

- 159 tests across 24 files (all green)
- Coverage: 97%+ lines, 90%+ functions
- Coverage thresholds in `scripts/coverage-thresholds.json`

No external dependencies required — Node 18+ stdlib only. Bun compatible.

## Writing Guidelines

When editing this repository, keep these conventions:

- One agent per Markdown file.
- Agent names use kebab-case.
- File names match agent name.
- Required frontmatter fields: `name`, `description`.
- Do **not** add `model` or `maxSteps` to agent frontmatter (rule enforced by quality gate).
- Write agent descriptions and documentation in English (en-US).

Example frontmatter:

```yaml
---
name: senior-frontend-developer
description: "Use this agent when you need expert frontend development assistance, ..."
mode: subagent
capability: full-bash
mcp: [pencil]
skills: [react-best-practices]
color: "#10B981"
---
```

## Tooling Notes

`opencode.json` configures the local workspace for opencode:

- `instructions: ["rules/*.md", "CLAUDE.md"]` loads rule files into context.
- `mcp.pencil` and `mcp.agent-skills` provide local integrations.

## Development Workflow

In practice, working here usually means:

1. editing Markdown files in `agents/` or `rules/`,
2. running `scripts/sync-agents.mjs` to emit dual-platform mirrors,
3. testing with `node --test scripts/**/*.test.mjs`,
4. running `bash scripts/hooks/pre-commit` as a local quality gate,
5. reviewing diffs carefully before committing.

## Where To Start

If this is your first time in the repository:

1. `README.md`
2. `AGENTS.md`
3. `agents/implementation-planner.md`
4. `agents/unified-code-reviewer.md`
5. `rules/INDEX.md`
6. `docs/agents-platforms.md`

## Contributing

Friendly, focused changes work best here.

- Prefer small edits over broad rewrites.
- Keep agent scope clear and specific.
- Reuse existing rules when possible instead of copying guidance into multiple files.
- Preserve naming consistency and repository conventions.
- After every agent edit, run `node scripts/sync-agents.mjs` and commit the canonical + both generated files.

If you are adding a new agent, make it easy for future maintainers to answer two questions quickly: what problem does this agent solve, and when should it be used instead of another one?
