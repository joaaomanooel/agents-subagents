# AGENTS.md

This repository contains AI agent definitions used by opencode and Claude Code.

## Preferred agents (pilot)

For new flows, prefer **implementation-planner**, **unified-code-reviewer**, and **docs-context-agent**. They supersede the paired legacy agents listed in the tree below. After the pilot period, legacy duplicates may be removed; until then, treat **ai-dev-planner**, **plan-specialist**, **ai-code-reviewer**, **code-reviewer**, **context-docs**, and **docs-context-keeper** as **deprecated in transition**.

## Frontmatter: do not use `model`

Do **not** add a `model` key (e.g. `model: opus`) to agent frontmatter. Tooling selects models outside these files; keeping frontmatter free of `model` avoids drift and duplicate sources of truth. The quality gate `forbidden-fields` enforces this on every commit.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Agent Frontmatter Schema](#agent-frontmatter-schema)
- [Dual-Platform Sync Workflow](#dual-platform-sync-workflow)
- [Build and Test Commands](#build-and-test-commands)
- [Code Style Guidelines](#code-style-guidelines)
- [Cursor/Co-pilot Rules](#cursurcopilot-rules)
- [Framework-Specific Guidelines](#framework-specific-guidelines)

## Repository Structure

```text
agents/                              Canonical agents (manual edits)
├── implementation-planner.md
├── unified-code-reviewer.md
├── docs-context-agent.md
├── ai-code-reviewer.md             # legacy
├── senior-*.md                    # full-bash capability
├── staff-orchestrator.md          # full-bash capability
└── ...  (30 agents total)

.opencode/agents/                   Generated (opencode format, committed)
.claude/agents/                     Generated (Claude Code format, committed)

rules/                              Behavior and quality rules (37 files)
skills/                             Project-local skills (test-engineer-js, etc.)
docs/
├── superpowers/specs/             Specs for past work
├── superpowers/plans/             Implementation plans
├── agents-platforms.md            Extension guide for adding platforms
└── ...

scripts/
├── sync-agents.mjs                 CLI entry: sync, check, diff, audit, list, watch, prune
├── sync-agents-fallback.sh         POSIX shell fallback (no node required)
├── sync-agents/                    Sync tool internals
│   ├── index.mjs                   public API
│   ├── __tests__/                  orchestrator tests
│   └── lib/
│       ├── core/                   Result, IO, CLI, Errors
│       ├── parser/                 Frontmatter parsing + name inference
│       ├── validator/              Chain of Responsibility validators
│       ├── platform/               Strategy pattern (opencode, claude)
│       └── orchestrator/           sync, watch, prune, interactive
├── quality-gates/                  Quality gate suite
│   ├── orchestrator.mjs           runs all gates
│   ├── {secrets,big-o,complexity,forbidden-fields}.mjs
│   └── __tests__/                  tests mirrored by gate
├── hooks/pre-commit                Quality gate before commit
└── README.md

.opencode/                         opencode package.json + node_modules
.cursor/agents/                    Cursor-specific agent overrides (if any)
.github/workflows/quality-gates.yml   CI: sync drift + tests
```

## Agent Frontmatter Schema

Required:

- `name` — kebab-case, unique, must match filename without `.md`
- `description` — verb-leading sentence; ≥ 80 chars recommended; can be a single line, a `>-` folded block, or a `|` literal block

Optional (validated by `ValidatorChain`):

- `mode` — `primary`, `subagent`, or `all`. Default inferred from name.
- `capability` — `read-only`, `code-edit`, or `full-bash`. Default inferred from name pattern.
- `mcp` — array of MCP server names configured in `opencode.json`.
- `skills` — array of skill names available in `skills/`.
- `model_preference` — `opus`, `sonnet`, `haiku`, or `inherit`. Translated per-platform during emit.
- `color` — hex string (opencode) or named token (claudecode).
- `task_agents` — array of agent names this agent can invoke via Task/Agent tool. Maps to `permission.task` (opencode) or `tools: Agent(...)` (claudecode). Validator warns on unknown names.

**Forbidden in frontmatter** (enforced by quality gate):

- `model` — runtime tooling selects, not metadata
- `maxSteps` — runtime concern

### Capability inference by name

| Pattern contains        | Inferred capability |
| ----------------------- | ------------------- |
| `senior-` or `staff-`   | `full-bash`         |
| `orchestrator`          | `full-bash`         |
| `review`, `audit`, `analy[sz]e`, `analys[ti]`, `plan`, `architect`, `design` | `read-only` |
| `test`, `e2e`, `playwright` | `code-edit`    |
| other                    | `code-edit`         |

## Dual-Platform Sync Workflow

Editing one agent in `agents/` triggers a sync that emits both `.opencode/agents/<name>.md` and `.claude/agents/<name>.md`. The sync tool respects Strategy + Registry — opencode and claude are independent platforms registered at runtime.

### Commands

| Command                              | Purpose                                    |
| ------------------------------------ | ------------------------------------------ |
| `node scripts/sync-agents.mjs`       | Sync everything                            |
| `node scripts/sync-agents.mjs --check` | CI: exit 1 on drift                       |
| `node scripts/sync-agents.mjs --diff`  | Show unified diff                          |
| `node scripts/sync-agents.mjs --audit` | List resolved vs declared configs          |
| `node scripts/sync-agents.mjs --list`  | Compact table of all agents               |
| `node scripts/sync-agents.mjs --agent=foo` | Sync a single agent                    |
| `node scripts/sync-agents.mjs --prune` | Remove orphan generated files              |
| `node scripts/sync-agents.mjs --watch` | Re-sync on file changes (debounced)       |
| `node scripts/sync-agents.mjs --interactive` | Confirm per agent, edit, skip       |
| `node scripts/sync-agents.mjs --dry-run` | Show what would change without writing |
| `./scripts/sync-agents-fallback.sh`  | POSIX-only copy fallback (no node)         |

### Pre-commit + CI

- Pre-commit: `scripts/hooks/pre-commit` runs `sync --check` then the quality gate suite.
- CI: `.github/workflows/quality-gates.yml` runs sync drift + tests on Ubuntu, macOS, Windows.
- Enable pre-commit via `git config core.hooksPath scripts/hooks`.

## Build and Test Commands

This repository combines markdown with a Node-based sync tool:

**Markdown agents**: no build, lint, or test commands.

**Sync tool**:

```bash
node --test --experimental-test-coverage 'scripts/**/*.test.mjs'    # 159 tests, ≥ 90% coverage
bash scripts/hooks/pre-commit                                      # full quality gate locally
```

No external dependencies required — Node 18+ stdlib only. Bun compatible.

---

## Code Style Guidelines

### File Organization

- One agent definition per markdown file
- YAML frontmatter required fields: `name`, `description`
- Optional: `mode`, `capability`, `mcp`, `skills`, `model_preference`, `color`
- Forbidden: `model`, `maxSteps`

### Naming Conventions

- Agent names: **kebab-case** (e.g., `plan-specialist`, `senior-frontend-developer`)
- File names: Match agent name with `.md` extension
- Descriptions: One sentence, start with verb ("Use this agent when...", "Reviews...", "Implements...")

### Markdown Formatting

- ATX-style headers (`#`, `##`, `###`)
- Code blocks with language identifier (```typescript, ```bash)
- Tables for structured data, lists for checklists
- Horizontal rules (`---`) for section separation

### Core Coding Principles

- **Clean Code**: Self-documenting names, no comments explaining logic
- **Avoid Else**: Use early returns, guard clauses
- **Humbleness**: Controllers coordinate, don't contain business logic
- **Performance**: Flag O(n²), require Map/Set for collections > 100
- **Security**: OWASP Top Ten awareness
- **Testing**: AAA pattern (Arrange-Act-Assert)

### Execution Rules

- **Execute yourself**: Run commands and tools; never delegate to user
- **Follow ALL instructions precisely**: user, tool, system, skill, MCP
- **No auto-commit/push**: Never commit or push automatically

### Output Language

- Agent descriptions: **English (en-US)**
- Internal content: **English (en-US)** as default
- Code and technical terms: Keep in original language

### Version Control

- Branch naming: `agent/name-of-agent` for new agents
- Commit format: `type: description` (conventional commits)
- Include agent name in commit (e.g., `docs: update plan-specialist agent`)

---

## Cursor/Co-pilot Rules

Rules are loaded from `rules/` directory (see INDEX.md for full list). Key rules:

| Rule | Purpose |
|------|---------|
| `01` | Follow ALL instructions precisely |
| `02` | Real environment: execute commands yourself |
| `08` | JS advanced features (generators, streams, lazy evaluation) |
| `09` | Balance Big O with readability/maintainability |
| `11` | Avoid code comments; prefer self-documenting code |
| `12` | Avoid else statements; prefer inline if expressions |
| `13` | OWASP Top Ten security practices |
| `24` | TypeScript best practices (no `any`, declare return types) |
| `25` | Clean code guidelines |
| `35` | Conventional Commits specification |

---

## Framework-Specific Guidelines

The subsections below are **example conventions for projects that use those stacks** (TypeScript, NestJS, Jest-style tests). They are not universal defaults: when operating on another repository, **infer the real stack** from that project's files and rules; use this section only where it applies.

### TypeScript Standards

- **NO `any`** — Use `unknown` or create proper types
- **Always declare return types** for public functions
- **Use `readonly`** for immutable properties
- **Use `as const`** for literals
- **PascalCase** for types/interfaces, **camelCase** for variables/functions
- **Use verbs** for boolean variables: `isLoading`, `hasError`

### NestJS Architecture

- One module per domain/route
- One controller per main route — humble, no business logic
- DTOs validated with class-validator
- Services handle business logic and persistence
- Core module for global filters, middlewares, guards, interceptors

### Testing Standards (AAA Pattern)

Tests must:
- Follow Arrange-Act-Assert with explicit section comments
- Include optimistic, neutral, and pessimistic scenarios
- Be isolated — no real external services
- Mock dependencies before imports with `jest.mock()`
- Use `inputX`, `mockX`, `actualX`, `expectedX` naming

### Security (OWASP Top Ten)

Flag these patterns:
- Missing access control / authorization checks
- SQL injection risks (string interpolation in queries)
- Hardcoded secrets/API keys
- Weak hashing (MD5, SHA1 for passwords)
- CORS with `origin: '*'`
- Error responses exposing stack traces
- Missing input validation/sanitization
- Missing rate limiting on auth endpoints
- SSRF risks (unvalidated URLs)
- Missing webhook signature verification

### Performance Guidelines

Flag these patterns:
- O(n²): `.find()` or `.includes()` inside loops
- Fetching all DB data to filter in application
- Multiple iterations over same large array
- String concatenation in loops (`str += x`)
- Recursive without memoization
- Accept O(n) for small arrays (< 100)
