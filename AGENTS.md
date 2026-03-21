# AGENTS.md

This repository contains AI agent definitions used by opencode and similar tools.

## Preferred agents (pilot)

For new flows, prefer **implementation-planner**, **unified-code-reviewer**, and **docs-context-agent**. They supersede the paired legacy agents listed in the tree below. After the pilot period, legacy duplicates may be removed; until then, treat **ai-dev-planner**, **plan-specialist**, **ai-code-reviewer**, **code-reviewer**, **context-docs**, and **docs-context-keeper** as **deprecated in transition**.

## Frontmatter: do not use `model`

Do **not** add a `model` key (e.g. `model: fast`) to agent frontmatter. Tooling selects models outside these files; keeping frontmatter free of `model` avoids drift and duplicate sources of truth.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Build, Lint, and Test Commands](#build-lint-and-test-commands)
- [Code Style Guidelines](#code-style-guidelines)
- [Cursor/Co-pilot Rules](#cursurcopilot-rules)
- [Framework-Specific Guidelines](#framework-specific-guidelines)

## Repository Structure

```text
agents/
├── implementation-planner.md   # Preferred: LLM-optimized implementation plans (en-US)
├── unified-code-reviewer.md    # Preferred: plan-aware + deep checklist review (en-US)
├── docs-context-agent.md       # Preferred: .docs maintenance + session summaries (en-US)
├── ai-code-reviewer.md         # Legacy (transition); use unified-code-reviewer
├── ai-dev-planner.md           # Legacy (transition); use implementation-planner
├── ai-test-engineer.md         # Integration/E2E test strategy agent
├── ai-ux-writer.md             # UX writing agent
├── code-reviewer.md            # Legacy (transition); use unified-code-reviewer
├── context-docs.md             # Legacy (transition); use docs-context-agent
├── docs-context-keeper.md      # Legacy (transition); use docs-context-agent
├── plan-specialist.md          # Legacy (transition); use implementation-planner
└── architecture-haiku-team.md  # Architecture Haiku workshop facilitator

rules/
├── 01-follow-all-instructions.md   # Core: obey all instructions precisely
├── 02-real-environment-execute-commands.md  # Execute commands yourself
├── 08-javascript-advanced-features.md
├── 09-performance-big-o-balanced.md
├── 13-owasp-top-ten.md
├── 24-typescript-best-practices.md
├── 25-clean-code-guidelines.md
└── ... (37 total rules)
```

## Build, Lint, and Test Commands

This is a **markdown-only repository** containing agent definition files. No build, lint, or test commands exist.

**Working with this repository**: Edit markdown files directly. Agent definitions follow YAML frontmatter.

---

## Code Style Guidelines

### File Organization

- One agent definition per markdown file
- YAML frontmatter required fields:
  ```yaml
  ---
  name: agent-name        # kebab-case identifier
  description: "Description of when to use this agent"
  ---
  ```
- Optional: `readonly`, `is_background`
- Do **not** add `model` in agent frontmatter (see above)

### Naming Conventions

- Agent names: **kebab-case** (e.g., `plan-specialist`, `ai-test-engineer`)
- File names: Match agent name with `.md` extension
- Descriptions: One sentence, start with verb ("Expert that...", "Use when...")

### Markdown Formatting

- ATX-style headers (`#`, `##`, `###`)
- Code blocks with language identifier (```typescript, ```bash)
- Tables for structured data, lists for checklists
- Horizontal rules (`---`) for section separation

### Content Structure

1. **Frontmatter** — YAML block with metadata
2. **Role definition** — "You are..." statement
3. **Guidelines** — Numbered or bulleted constraints
4. **Expected output format** — Detailed structure for agent responses
5. **Invocation** — When and how to invoke the agent

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
