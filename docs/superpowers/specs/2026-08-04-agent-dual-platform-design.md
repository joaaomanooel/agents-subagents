# Dual-Platform Agents Support for opencode and claudecode

Status: Draft (pending user review)
Date: 2026-08-04
Owner: repository maintainers

This spec defines the design for making the agents and rules in this
repository work natively and consistently in both opencode and Claude Code,
without duplicating agent definitions.

---

## Summary

Adopt a hybrid architecture: one canonical agent file in `agents/`, plus
generated platform-specific mirrors in `.opencode/agents/` (opencode) and
`.claude/agents/` (claudecode). A `scripts/sync-agents.mjs` tool emits the
generated files, enforces a schema, runs in pre-commit and CI, and supports
human-friendly diff and audit modes. Rules (`rules/`) become portable by
fixing an `opencode.json` path bug. Scope is explicitly limited to
opencode + claudecode in v1; other platforms can be added later through a
documented extension hook. All 32 current agents are preserved.

## Decisions made

- Architecture: hybrid canonical + generated, not duplicated files.
- Source of truth: `agents/*.md` (manual edits). Generated outputs in
  `.opencode/agents/` and `.claude/agents/` are committed (snapshotable
  fallback when sync script is unavailable).
- Sync script implementation: Node ESM (`scripts/sync-agents.mjs`),
  stdlib-only, no external dependencies.
- Tests use Node's built-in `node --test` runner with native coverage
  (`--experimental-test-coverage`). Minimum 90% coverage required.
- Canonical frontmatter gains optional fields: `capability`, `mode`,
  `model_preference`, `mcp`, `skills`, `color`. Required fields remain
  `name` and `description`.
- AGENTS.md rule about not using `model:` is updated: the rule applies to
  generated files and to canonical files when not declared. Canonical
  files may declare `model_preference` (an alias) — it is the sync
  script's responsibility to translate it per platform.
- Default `mode: subagent`. Override via canonical frontmatter or name
  inference.
- Capability inference fallback by name pattern when canonical does not
  declare one.
- Pre-commit hook and CI check enforce drift detection.
- Documentation in `README.md` (Quick Start), `AGENTS.md` (schema),
  `docs/agents-platforms.md` (extension guide), and `CHANGELOG.md`
  (release notes, populated by the implementation).

## Definitions

- "Canonical agent" = an agent file in `agents/<name>.md` containing a
  neutral frontmatter plus a markdown body. Edited by humans.
- "Generated agent" = a file in `.opencode/agents/<name>.md` or
  `.claude/agents/<name>.md` containing platform-specific frontmatter
  produced by the sync script. Not edited by humans.
- "Capability" = a logical level of agent tool access (`read-only`,
  `code-edit`, `full-bash`) defined canonically, mapped to platform
  permissions during emission.
- "Drift" = any case where a generated file does not match what the
  sync script would emit from the current canonical source.
- "Snapshot" = the committed versions of the generated files
  (`.opencode/agents/` and `.claude/agents/`) themselves. They act as a
  fallback when the sync script cannot run: a fresh clone still has
  usable files even before anyone runs the sync.

## Details

### Architecture

```
agents/                                  CANONICAL (manual edits)
├── staff-orchestrator.md                frontmatter (neutral, optional
├── senior-frontend-developer.md         capability/mode/mcp/skills/model)
├── ...                                  + markdown body
                                         |
                                         v
                              scripts/sync-agents.mjs
                              (Node ESM, stdlib only, with tests)
                                         |
                  +----------------------+----------------------+
                  v                                             v
.opencode/agents/                                            .claude/agents/
├── staff-orchestrator.md                                   ├── staff-orchestrator.md
│   (mode + permission)                                      │   (tools + permissionMode)
├── ...                                                     └── ...
```

Plus rules/ remains a single source of truth, with `opencode.json`
corrected to point at it.

### Canonical frontmatter schema

Required:

- `name` (string, kebab-case, must match filename without `.md`).
- `description` (string, one sentence, start with verb or "Use").

Optional:

- `mode` (`primary` | `subagent`). Default: `subagent`.
- `capability` (`read-only` | `code-edit` | `full-bash`). Default:
  inferred from name (see Inference table).
- `mcp` (array of MCP server names).
- `skills` (array of skill names).
- `model_preference` (`opus` | `sonnet` | `haiku` | `inherit`).
  Default: `inherit` (omitted in both outputs).
- `color` (hex string or named theme token).

### Mapping table (canonical -> opencode / claudecode)

| Canonical                 | opencode output                                                          | claudecode output                                          |
| ------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `name: foo`               | top-level `description:` (frontmatter kept compatible)                   | `name: foo` (top-level)                                    |
| `mode: subagent`          | `mode: subagent`                                                         | omitted (default)                                          |
| `mode: primary`           | `mode: primary`                                                          | omitted (claudecode uses subagents only)                   |
| `capability: read-only`   | `permission: { edit: deny, bash: deny }`                                 | `tools: Read, Grep, Glob`                                  |
| `capability: code-edit`   | `permission: { bash: ask }`                                              | `tools: Read, Grep, Glob, Bash, Edit, Write`               |
| `capability: full-bash`   | no extra permission (defaults)                                           | `tools: Read, Grep, Glob, Bash, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill` |
| `model_preference: opus`  | omitted (opencode uses global config)                                    | `model: opus`                                              |
| `model_preference: sonnet`| omitted                                                                  | `model: sonnet`                                            |
| `model_preference: inherit`| omitted                                                                 | omitted                                                    |
| `mcp: [pencil]`           | omitted (servers come from `opencode.json`)                              | `mcpServers: [pencil]`                                     |
| `skills: [foo]`           | omitted (no preload in opencode frontmatter, prompt footer note only)    | `skills: [foo]`                                            |
| `color: "#3B82F6"`        | `color: "#3B82F6"`                                                       | `color: blue` (claude enum)                                |

### Capability inference (fallback when not declared)

| Name pattern contains        | Inferred capability |
| ---------------------------- | ------------------- |
| `review`, `audit`, `analyze` | `read-only`         |
| `plan`, `architect`, `design`| `read-only`         |
| `test`, `e2e`, `playwright`  | `code-edit`         |
| `senior`, `staff-`           | `full-bash`         |
| `orchestrator`               | `full-bash`         |
| other                        | `code-edit`         |

### Sync script behavior

- CLI:
  - `node scripts/sync-agents.mjs` (default sync)
  - `--check` (CI mode, exit 1 on drift)
  - `--diff` (unified diff, no writes)
  - `--audit` (resolved vs declared configurations)
  - `--list` (compact table of all agents)
  - `--agent=<name>` (single agent)
  - `--prune` (remove orphan generated files)
  - `--dry-run` (no writes)
  - `--watch` (resync on change, debounce 200 ms)
  - `--interactive` / `--interactive=batch` (confirm per agent or once)
  - `--json` (machine output)
  - `--strict` (warnings become errors)
  - `--debounce=<ms>` (watch debounce)
  - `--stats` (print ms per agent)
- Reads `agents/*.md`. Parses frontmatter with a regex-based extractor
  (delimiter `---`, no YAML library needed).
- For each agent: validates against the schema, applies defaults,
  applies inferences, emits two outputs.
- Validations:
  - `name` matches `^[a-z][a-z0-9-]*[a-z0-9]$` and matches filename.
  - `description` non-empty, starts with verb or "Use".
  - `capability` ∈ {read-only, code-edit, full-bash}.
  - `mode` ∈ {primary, subagent}.
  - `model_preference` ∈ {opus, sonnet, haiku, inherit}.
  - `mcp` entries reference servers configured in `opencode.json`.
  - `skills` entries reference existing skills in `skills/`.
- Errors include line/column when sourced from YAML. Warnings include
  context (e.g., inferred capability).
- Output modes: default human-readable (✓/✗/⚠), `--json` for CI.
- Performance SLOs:
  - 32-agent sync: < 500 ms
  - `--check`: < 300 ms
  - `--diff`: < 200 ms
  - `--audit --list`: < 100 ms
  - single agent: < 50 ms
  - memory: < 50 MB

### Tests (`scripts/sync-agents.test.mjs`)

At least 30 cases covering:

- Frontmatter parsing (valid, no frontmatter, malformed, BOM, multiline
  description, unclosed `---`)
- Capability inference (one case per pattern)
- opencode emission for each (capability × mode) combination
- Claude Code emission for each (capability × mode) combination
- Drift detection (in-sync, canonical-divergent, emitted-divergent)
- Prune (orphan in opencode, orphan in claudecode, both)
- New agent (no emitted counterpart) emits fresh
- Removed agent (canonical gone) detected on `--check`
- Name validation (kebab-case, uppercase, dot, underscore, leading hyphen)
- Error reporting (line + context included)
- Idempotency (running twice is no-op on second run)
- SLO assertions (sync < 500 ms with fixture of 32 agents)
- Color mapping (hex to claude enum, hex passthrough for opencode)

Coverage thresholds in `scripts/coverage-thresholds.json`:

```json
{ "lines": 90, "branches": 85, "functions": 90, "statements": 90 }
```

CI fails below thresholds.

### Fallback without node

- `scripts/sync-agents-fallback.sh` (POSIX bash, ~30 lines)
- Performs only file copy from `agents/` to `.opencode/agents/` and
  `.claude/agents/`, no schema awareness.
- Generated snapshot committed alongside source guarantees users without
  node still have a usable state.
- README notes: users in node-less environments should rely on the
  committed snapshot.

### Multi-platform support

- Path handling uses `path.join` / `path.resolve`.
- Line endings normalized to LF in canonical and emitted files.
- `.gitattributes` with `* text=auto eol=lf`.
- Editor fallback: `$EDITOR` honored, `vi` (unix) / `notepad`
  (windows) otherwise.
- `fs.watch` cross-platform (validated in CI matrix: ubuntu, macos,
  windows).
- Shebang `#!/usr/bin/env node`.
- CI matrix verifies behavior across the three major platforms.

### Error handlers

- Top-level `uncaughtException` and `unhandledRejection` mapped to
  fatal error with exit 1.
- `SIGINT` and `SIGTERM` exit 4 (cancelled).
- Specific error codes:
  - `ENOENT`: file not found
  - `EACCES`: permission denied (with chmod hint)
  - `ENOSPC`: no space
  - `EISDIR`: is a directory
  - YAML parse error: line + message
  - editor timeout (>30 s): resync and try again
- Result type `{ ok, value } | { ok, error }` used across async
  boundaries; no `throw` crosses CLI edges.

### Rule coverage (rules/)

- `opencode.json` `instructions` field is corrected to
  `["rules/*.md"]`. Current paths (`.cursor/rules/*.md`,
  `.config/opencode/rules/*.md`) are removed because the files do not
  exist.
- Rules are plain markdown, so no schema or generation is needed.
- claudecode consumes `CLAUDE.md` for project rules; this spec does not
  change that behavior.

### Documentation updates

| File                         | Change                                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| `README.md`                  | Add "Quick Start" section with sync workflow and command table.   |
| `AGENTS.md`                  | Document optional frontmatter fields and updated `model:` policy. |
| `docs/agents-platforms.md`   | New. Extension guide for adding a third platform.                 |
| `CHANGELOG.md`               | New. `Unreleased` section populated by implementation.            |
| `.github/workflows/agents-check.yml` | New. Runs `sync-agents.mjs --check` on push and PR.       |
| `.gitignore`                 | Ignore `.opencode/.DS_Store` and editor backup files.             |
| `.gitattributes`             | New. Force LF line endings on text files.                         |

### CI / pre-commit

- pre-commit hook calls `node scripts/sync-agents.mjs --check` and
  blocks commit on drift or errors.
- GitHub Action on push and PR runs the same check on
  ubuntu-latest, macos-latest, windows-latest.
- Hook installation documented in `README.md` (manual or husky).

### Versioning and PR split

- Initial release is `v1.0.0`. SemVer afterwards.
- Recommended PR sequence:
  1. `feat(agents): dual-platform foundation` (script + tests + docs).
     ~500 lines diff.
  2. `fix(opencode): correct instructions path` (path fix +
     `model:` removal from senior-*).
  3. `feat(agents): emit platform-specific files` (apply schema to
     32 canonicals and emit 64 generated files).
  4. `chore(ci): drift detection` (pre-commit + GitHub Action).
- Each PR is revertible independently. No PR deletes canonical files.

### Risks and mitigations

| Risk                                             | Mitigation                                                |
| ------------------------------------------------ | --------------------------------------------------------- |
| PT-BR description escaping to platforms          | Sync warns if description does not start with a verb pattern (Use / Expert / Reviews / Audits / Plans / Implements / Designs / Creates / etc.). |
| Senior agents break description-start-with-verb rule | Manual review and `--strict` in CI flag reject descriptions not starting with verb or "Use". |
| `$EDITOR` unset                                  | Fall back to `vi` / `notepad` with warning.               |
| Editors not honoring LF                          | `.gitattributes` + sync normalizes output.                |
| Drift slipping into main                         | pre-commit + CI both run `--check`.                       |
| No-node environment                              | snapshot files committed + fallback shell.                |
| Windows path quirks                              | All path operations use Node `path` module; CI validates. |

### Definition of Done (v1)

Blocking:

- 0 agents with `model:` in canonical frontmatter.
- `node scripts/sync-agents.mjs --check` exits 0 in CI.
- Coverage >= 90% on the sync script.
- All 32 canonicals have valid `name`/`description`.
- All senior-* and staff-* declare `capability: full-bash`.
- `opencode.json` parses as JSON.
- `rules/*.md` referenced from `opencode.json` exists.

Non-blocking (warnings):

- Capability inferred (not declared) shows in audit, not error by
  default.
- Description shorter than 80 chars shows warning.
- Unknown MCP server or skill name shows warning.

### Rollback plan

- Each atomic PR allows granular revert.
- Worst case: `git revert` the merge commit + `git clean -fd
  .opencode/agents/ .claude/agents/`.
- Canonical files are never deleted by the sync script.

### Smoke test (post-implementation)

```bash
git clone <repo> test && cd test
node -e "JSON.parse(require('fs').readFileSync('opencode.json'))" && echo "opencode.json OK"
! grep -r '^model:' agents/ && echo "no model: in frontmatter"
node scripts/sync-agents.mjs --check && echo "in sync"
node --test --experimental-test-coverage scripts/sync-agents.test.mjs
node scripts/sync-agents.mjs --interactive --dry-run </dev/null
```

All five must pass for the release to be considered green.

## Notes

- This spec intentionally avoids touching agents' prompt bodies. The
  refactor affects only frontmatter, file locations, and tooling.
- The sync script is "dumb" — it parses, validates, emits. No business
  logic lives in tooling.
- Future platforms (Cursor, Copilot, Windsurf) can be added by writing
  one emitter module + a mapping table. The runtime, test runner,
  CI/pre-commit, and CLI flags are reusable.

## References

- `agents/` directory: 32 current agent files (legacy + preferred trio +
  senior-suite staged).
- `scripts/sync-skills.sh`: existing model for a sync shell script.
- `opencode.json`: current configuration with broken paths.
- `AGENTS.md`: current conventions; will be updated by implementation.
- opencode documentation: https://opencode.ai/docs/agents/
- claudecode documentation: https://docs.claude.com/en/docs/claude-code/sub-agents
