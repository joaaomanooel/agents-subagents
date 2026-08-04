# `.cursor/agents/`

This directory hosts Cursor-specific agent overrides. Cursor reads `.cursor/agents/*.md` files separately from the canonical agents in `agents/`.

## When to add a file here

Only when you need to override a canonical agent with Cursor-specific behavior (different prompt, different tool set, etc.). For most agents, the generated `.claude/agents/` files are sufficient because Cursor also reads those.

## When NOT to add a file here

- For features that apply to all platforms. Edit the canonical `agents/<name>.md` instead.
- For instructions that need to be project-wide. Edit `CLAUDE.md` or `rules/*.md`.

## How this differs from `agents/`

| Aspect | `agents/` (canonical) | `.cursor/agents/` (Cursor override) |
|---|---|---|
| Source of truth | yes | no |
| Sync'd to other platforms | yes (`scripts/sync-agents.mjs`) | no |
| Schema | `name`, `description`, `mode`, `capability`, `mcp`, `skills`, `model_preference`, `color` | minimal: `name`, `description` |
| Use case | cross-platform definitions | Cursor-specific behavior |

## Lifecycle

- When the canonical `agents/<name>.md` changes, manually re-evaluate whether the Cursor override still makes sense.
- If the override is no longer needed, delete it. Cursor will then read the generated `.claude/agents/<name>.md` instead.
- If the override contains outdated content, either remove it or update it to keep it useful.
