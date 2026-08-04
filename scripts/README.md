# Sync Agents

Node tool that emits dual-platform agent mirrors for opencode and Claude Code. Pure stdlib, no external dependencies.

## Quick start

```bash
node scripts/sync-agents.mjs                # sync everything
node scripts/sync-agents.mjs --check        # CI mode (exit 1 on drift)
node scripts/sync-agents.mjs --diff         # show what would change
node scripts/sync-agents.mjs --audit        # resolved vs declared
node scripts/sync-agents.mjs --list        # compact agent table
node scripts/sync-agents.mjs --agent=foo    # sync one agent
node scripts/sync-agents.mjs --interactive  # confirm per agent
node scripts/sync-agents.mjs --prune        # remove orphan generated
node scripts/sync-agents.mjs --watch        # resync on changes
node scripts/sync-agents.mjs --dry-run      # log without writing
```

## Fallback for node-less environments

```bash
./scripts/sync-agents-fallback.sh
```

POSIX-only copy with no platform-specific mapping. Generated snapshot is committed so consumers without node still have a usable state.

## Tests

```bash
node --test --experimental-test-coverage 'scripts/**/*.test.mjs'
```

- 159 tests across 24 files
- Coverage: 97%+ lines, 90%+ functions
- Coverage thresholds in `scripts/coverage-thresholds.json`

## Architecture

- `Strategy + Registry` (`lib/platform/`) — opencode and claudecode implementations registered at runtime.
- `Chain of Responsibility` (`lib/validator/`) — frontmatter validators composed in a chain.
- `Result<T>` (`lib/core/result.mjs`) — `{ ok, value } | { ok: false, error }` instead of throws crossing CLI edges.

Subdomain layout:

- `lib/core/` — Result, IO, CLI, Errors primitives
- `lib/parser/` — Frontmatter parsing + name inference
- `lib/validator/` — Validator chain + individual validators
- `lib/platform/` — Strategy pattern (opencode, claudecode)
- `lib/orchestrator/` — sync, watch, prune, interactive

## Quality gates

`scripts/quality-gates/orchestrator.mjs` runs:

- `sync-drift` — `scripts/sync-agents.mjs --check`
- `secrets` — regex scan for known token formats with redaction
- `forbidden-fields` — flags `model:` and `maxSteps:` in frontmatter
- `big-o` — heuristic for nested-loop smells (`.find`, `.includes`, etc.)
- `complexity` — counts decision points per function

Invoke via `bash scripts/hooks/pre-commit` or programmatically:

```js
import { runQualityGate, formatGateReport } from './scripts/quality-gates/orchestrator.mjs';
const result = await runQualityGate('.', { complexityThreshold: 12 });
console.log(formatGateReport(result));
```

## Adding a new platform

See `docs/agents-platforms.md`. The Strategy pattern means adding a platform is one file in `scripts/sync-agents/lib/platforms/` plus one import in `scripts/sync-agents/index.mjs`.

## Requirements

Tested on Node 18+ and Bun. No external dependencies.
