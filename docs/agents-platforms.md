# Agent Platforms

This repository emits agents in two formats. This document explains how to add a third.

## How platforms are mapped

Each canonical agent in `agents/<name>.md` is consumed by the sync script `scripts/sync-agents.mjs`. The script validates the frontmatter (using the `ValidatorChain`) and emits one output per registered platform (using the `Platform` registry).

- `.opencode/agents/` — opencode native format
- `.claude/agents/` — Claude Code native format

Both outputs contain the same markdown body; only the YAML frontmatter differs to match each platform's expected schema.

## Adding a new platform

1. Create `scripts/sync-agents/lib/platforms/<platform>.mjs` extending the `Platform` base class from `lib/platform.mjs`:

```js
import { Platform } from '../platform.mjs';
import { registerPlatform, getPlatform } from '../registry.mjs';

class MyPlatform extends Platform {
  get name() { return 'my-platform'; }
  get outputDir() { return '.my-platform/agents'; }

  mapCapability(capability) {
    // return platform-specific frontmatter fragment for the capability
  }

  emit(canonical, body) {
    // build full file content (frontmatter + body)
  }
}

registerPlatform(new MyPlatform());

// optional function wrapper for backwards-compat callers
export function emitMyPlatform(canonical, body) {
  return getPlatform('my-platform').emit(canonical, body);
}
```

2. Import the platform from `scripts/sync-agents/index.mjs` (line `import './lib/platforms/<platform>.mjs';`) so it auto-registers when the sync tool runs.

3. Add tests in `scripts/sync-agents/lib/platforms/__tests__/<platform>.test.mjs` covering:

   - Each capability (`read-only`, `code-edit`, `full-bash`)
   - Each `mode` (`primary`, `subagent`)
   - Body passthrough
   - At least one no-op case (e.g. `model_preference` behavior)

4. Run `node --test scripts/sync-agents/lib/platforms/__tests__/<platform>.test.mjs` to verify locally.

5. Coverage of the new platform must remain at the configured threshold (≥ 90% lines/functions).

## Canonical frontmatter schema

Required:

- `name` — kebab-case, matches filename.
- `description` — verb-leading sentence; ≥ 80 chars recommended.

Optional (validated by `ValidatorChain`):

- `mode` — `primary` or `subagent`. Defaults to `subagent`.
- `capability` — `read-only`, `code-edit`, or `full-bash`. Defaults to inferred from name.
- `mcp` — array of MCP server names.
- `skills` — array of skill names.
- `model_preference` — `opus`, `sonnet`, `haiku`, or `inherit`.
- `color` — hex string or named theme color.

## Architecture patterns in use

- **Strategy pattern** — `Platform` is the strategy; each concrete platform implements `emit()`.
- **Registry pattern** — `lib/registry.mjs` holds the registered platforms; `syncAgents()` iterates over `listPlatforms()` without knowing concrete types.
- **Chain of Responsibility** — `lib/validators/chain.mjs` runs validators in order, accumulating errors and warnings. New validators can be added without modifying `validate()`.

## Tests

Tests live in `__tests__/` folders colocated with their modules. Run them all with:

```bash
node --test --experimental-test-coverage 'scripts/**/*.test.mjs'
```

Coverage thresholds in `scripts/coverage-thresholds.json`:

- lines: 90
- branches: 85
- functions: 90
- statements: 90
