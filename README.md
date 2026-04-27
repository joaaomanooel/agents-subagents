# Agents and Rules Repository

Welcome. This repository stores AI agent definitions and shared rule files used by OpenCode, opencode, and similar assistant-driven workflows.

It is a markdown-only project: the main goal here is not to ship application code, but to define how agents should think, respond, review, plan, and collaborate inside real development environments.

## What This Project Does

- Defines specialized agents for planning, code review, testing, UX, security, performance, and multi-disciplinary collaboration.
- Centralizes reusable rule files that shape assistant behavior across repositories and tasks.
- Keeps agent instructions explicit, versioned, and easy to evolve in plain Markdown.

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
agents/       Agent definitions in Markdown with YAML frontmatter
rules/        Shared behavior and quality rules
skills/       Project-local skills and reusable workflow guidance
AGENTS.md     Maintainer-facing conventions for this repository
opencode.json Tooling configuration for opencode
```

### `agents/`

Each file in `agents/` defines one agent, usually with:

- YAML frontmatter metadata,
- a clear role definition,
- operational guidelines,
- expected output structure,
- invocation guidance.

Examples of agent categories in this repository:

- planning and implementation,
- code review,
- testing,
- UX and design systems,
- security and performance,
- collaborative and workshop-style agents.

### `rules/`

The `rules/` directory contains reusable behavioral constraints and engineering standards, such as:

- instruction-following,
- real-environment execution,
- clean code principles,
- TypeScript conventions,
- OWASP-aware security practices,
- testing and review expectations.

If you want a quick inventory, start with `rules/INDEX.md`.

### `skills/`

The `skills/` directory is for project-local skills that package focused guidance for recurring tasks.

Current local skill:

- `skills/test-engineer-js/SKILL.md` - JavaScript and TypeScript testing guidance focused on trustworthy, behavior-oriented tests.

## How This Repo Is Meant To Be Used

1. Pick or create an agent in `agents/` for a specific responsibility.
2. Keep broad behavioral guidance in `rules/` instead of duplicating it across many agents.
3. Use `AGENTS.md` as the source of truth for repository conventions.
4. Update documentation when responsibilities, naming, or preferred workflows change.

## Writing Guidelines

When editing this repository, keep these conventions in mind:

- One agent per Markdown file.
- Agent names use kebab-case.
- File names should match the agent name.
- Required frontmatter fields are `name` and `description`.
- Do not add a `model` field to agent frontmatter.
- Write agent descriptions and documentation in English (en-US).

Example frontmatter:

```yaml
---
name: example-agent
description: Expert that explains when and how this agent should be used.
---
```

## Tooling Notes

`opencode.json` configures the local workspace behavior for opencode, including:

- edit permissions,
- watched paths and ignore rules,
- local MCP integrations.

At the moment, the configuration includes local integrations for:

- `pencil`
- `agent-skills`

## Development Workflow

There is no build, lint, or test pipeline for this repository.

In practice, working here usually means:

- editing Markdown files directly,
- keeping structure and wording consistent,
- reviewing diffs carefully before committing.

## Where To Start

If this is your first time in the repository, a good reading order is:

1. `README.md`
2. `AGENTS.md`
3. `agents/implementation-planner.md`
4. `agents/unified-code-reviewer.md`
5. `rules/INDEX.md`

## Contributing

Friendly, focused changes work best here.

- Prefer small edits over broad rewrites.
- Keep agent scope clear and specific.
- Reuse existing rules when possible instead of copying guidance into multiple files.
- Preserve naming consistency and repository conventions.

If you are adding a new agent, make it easy for future maintainers to answer two questions quickly: what problem does this agent solve, and when should it be used instead of another one?
