# CLAUDE.md

Project-level context for Claude Code and opencode. Both tools load this file via `opencode.json` instructions or Claude Code's default discovery.

## Repository overview

This repository stores AI agent definitions and shared rule files used by opencode and Claude Code. The canonical agents live in `agents/` and are emitted to two platforms via `scripts/sync-agents.mjs`:

- `.opencode/agents/` — opencode format
- `.claude/agents/` — Claude Code format

## Conventions

- Agent definitions are Markdown with YAML frontmatter. Required fields: `name`, `description`. Optional fields: `mode`, `capability`, `mcp`, `skills`, `model_preference`, `color`.
- `model:` and `maxSteps:` are forbidden in frontmatter (runtime tooling selects).
- Description should start with a verb or role descriptor (e.g. "Use this agent when...", "Reviews code for...", "X specialist that...").
- Capability levels: `read-only` (auditors, reviewers, planners), `code-edit` (testers, writers), `full-bash` (senior-*, orchestrators).
- Names are kebab-case.

## Tooling

- `node scripts/sync-agents.mjs` — sync canonical agents to both platforms
- `node scripts/sync-agents.mjs --check` — CI mode (exit 1 on drift)
- `node scripts/sync-agents.mjs --diff` — unified diff
- `node scripts/sync-agents.mjs --audit` — resolved configs vs declared
- `node scripts/sync-agents.mjs --list` — compact table
- `bash scripts/hooks/pre-commit` — pre-commit quality gate (sync + 5 gates)
- `node --test 'scripts/**/*.test.mjs'` — 165 unit tests, 96.99% coverage

## Quality gates

`scripts/quality-gates/orchestrator.mjs` runs five gates:

- `sync-drift` — generated files match canonical
- `secrets` — no AWS/GitHub/Slack/bearer/private-key tokens
- `forbidden-fields` — no `model:` or `maxSteps:` in frontmatter
- `big-o` — no nested-loop smells
- `complexity` — functions below complexity threshold (12)

All five must pass before commit. CI runs the same on ubuntu/macos/windows.

## Sync workflow

When you edit an agent in `agents/`, run `node scripts/sync-agents.mjs` to regenerate both `.opencode/agents/` and `.claude/agents/`. Commit the canonical + both generated files together.

## When you should NOT use this repo

- Direct edits to generated files (`.opencode/agents/`, `.claude/agents/`) — these are regenerated and will be overwritten.
- Adding agents without `capability` declared — the validator will warn.
- Adding `model:` or `maxSteps:` to frontmatter — forbidden-fields gate will fail.

## Style for agent prompts

- Lead with the agent's role and responsibility: "You are X with Y years of experience..."
- Use bullet points for guidelines, numbered lists for sequenced steps.
- Prefer self-documenting code examples over comments.
- Section structure: Core Competencies → Behavioral Guidelines → Output Format → Invocation.
- End with explicit invocation guidance.
