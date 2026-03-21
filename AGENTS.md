# AGENTS.md

This repository contains AI agent definitions used by opencode and similar tools.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Build, Lint, and Test Commands](#build-lint-and-test-commands)
- [Code Style Guidelines](#code-style-guidelines)
- [Framework-Specific Guidelines](#framework-specific-guidelines)

## Repository Structure

```text
agents/
├── ai-code-reviewer.md      # Code review agent
├── ai-dev-planner.md        # Development planning agent
├── ai-test-engineer.md      # Test generation agent
├── ai-ux-writer.md          # UX writing agent
├── code-reviewer.md         # Alternative code review agent
├── context-docs.md          # Context documentation agent
├── docs-context-keeper.md   # Documentation keeper agent
└── plan-specialist.md       # Planning specialist agent
```

## Build, Lint, and Test Commands

This is a **markdown-only repository** containing agent definition files. There are no build, lint, or test commands because there is no executable code.

- No `npm`, `yarn`, or `pnpm` commands
- No build process
- No test runner
- No linting

**Working with this repository**: Edit markdown files directly. Agent definitions follow YAML frontmatter with `name`, `description`, and optional `readonly`/`is_background` fields.

## Code Style Guidelines

These guidelines apply when modifying agent definition files in this repository and inform the agents defined here.

### File Organization

- One agent definition per markdown file
- Use YAML frontmatter with required fields:
  ```yaml
  ---
  name: agent-name        # kebab-case identifier
  description: "Description of when to use this agent"
  ---
  ```
- Optional frontmatter fields: `readonly`, `is_background`

### Naming Conventions

- Agent names: **kebab-case** (e.g., `plan-specialist`, `ai-test-engineer`)
- File names: Match agent name with `.md` extension
- Descriptions: One sentence, start with verb ("Expert that...", "Use when...")

### Markdown Formatting

- Use ATX-style headers (`#`, `##`, `###`)
- Code blocks with language identifier (```typescript, ```bash, etc.)
- Tables for structured data
- Lists for checklists and requirements
- Horizontal rules (`---`) for section separation

### Content Structure

Follow these patterns from existing agents:

1. **Frontmatter** — YAML block with metadata
2. **Role definition** — "You are..." statement
3. **Guidelines** — Numbered or bulleted constraints
4. **Expected output format** — Detailed structure for agent responses
5. **Invocation** — When and how to invoke the agent

### Clean Code Principles

When creating agents that review code, follow these principles:

- **Clean Code**: Self-documenting names, no comments explaining logic
- **Avoid Else**: Use early returns, guard clauses
- **Humbleness**: Controllers coordinate, don't contain business logic
- **Performance**: Flag O(n²), require Map/Set for collections > 100
- **Security**: OWASP Top Ten awareness
- **Testing**: AAA pattern (Arrange-Act-Assert)
- **TypeScript**: No `any`, always declare return types, use `readonly`

### Output Language

- Agent descriptions: **English (en-US)**
- Internal content: **English (en-US)** as default
- Code and technical terms: Keep in original language

### Agent Invocation Patterns

From `ai-test-engineer.md`:

- **Automatic** — When user mentions "add tests", "add E2E tests"
- **Explicit** — "Use the ai-test-engineer subagent to..."
- **Handoff** — From AI-DevPlanner validation sections

### Integration Patterns

Skills are loaded via the `skill` tool. From `ai-dev-planner.md`, agents should reference each other:

| Skill | Integration |
|-------|-------------|
| tlc-spec-driven | Plan output under `.specs/` |
| docs-writer | Save under `docs/` |
| create-adr | Record architectural decisions |
| learning-opportunities | Optional exercises after work |
| the-fool | Optional red-team before execution |

### Version Control

- Branch naming: `agent/name-of-agent` for new agents
- Use meaningful commit messages
- Group related changes
- Include agent name in commit (e.g., `docs: update plan-specialist agent`)
- PR title format: `type: description` (e.g., `feat: add new planner agent`)
- Follow conventional commits

### Best Practices for Agent Definitions

1. **Be specific** — Avoid vague wording, "as needed", "if necessary"
2. **Include paths** — Always reference full relative paths
3. **Actionable** — Every instruction must be executable
4. **Single responsibility** — One agent, one purpose
5. **Clear invocation** — Explicit triggers (automatic vs explicit)

### Quality Criteria

Good agent definitions should:
- Have clear, specific descriptions
- Define exact output formats
- Include constraints and boundaries
- Specify when NOT to use the agent
- Provide examples of input/output when helpful

### Security Awareness (OWASP Top Ten)

Agents should flag:
- Missing access control checks (authorization)
- SQL injection risks (string interpolation in queries)
- Hardcoded secrets/API keys
- Weak hashing (MD5, SHA1 for passwords)
- CORS with `origin: '*'`
- Error responses exposing stack traces in production
- Missing input validation/sanitization
- Missing rate limiting on auth endpoints
- SSRF risks (unvalidated URLs)
- Missing webhook signature verification

### Performance Guidelines

Flag these patterns:
- O(n²) patterns: `.find()` or `.includes()` inside loops
- Fetching all data from DB to filter in application
- Multiple iterations over same large array
- String concatenation in loops (`str += x`)
- Recursive algorithms without memoization
- Accept O(n) for small arrays (< 100) — readability over micro-optimization
- Paginate in database, not in application

### Testing Standards (AAA Pattern)

Tests must:
- Follow Arrange-Act-Assert with explicit section comments
- Include optimistic, neutral, and pessimistic test scenarios
- Be isolated — no real external services
- Use descriptive `describe()` blocks and test names
- Mock dependencies before imports with `jest.mock()`
- Use `inputX`, `mockX`, `actualX`, `expectedX` naming convention

---

## Framework-Specific Guidelines

The following sections contain guidelines for specific frameworks. These are optional and should be used when working with the corresponding technology.

### TypeScript Standards

When reviewing TypeScript code, enforce:
- **NO `any`** — Use `unknown` or create proper types
- **Always declare return types** for public functions
- **Use `readonly`** for immutable properties
- **Use `as const`** for literals
- **Prefer interfaces** for object shapes, types for unions/intersections
- **PascalCase** for types/interfaces, **camelCase** for variables/functions, **UPPERCASE** for constants
- **Use verbs** for boolean variables: `isLoading`, `hasError`, `canDelete`

### NestJS Architecture Guidelines

For NestJS codebases:
- One module per domain/route
- One controller per main route — humble, no business logic
- DTOs validated with class-validator
- Services handle business logic and persistence
- Entities with TypeORM
- Core module for global filters, middlewares, guards, interceptors
- Shared module for cross-module utilities
