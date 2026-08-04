#!/usr/bin/env bash
# sync-agents-fallback.sh — POSIX copy-only fallback for environments without node.
#
# Performs ONLY file copies of canonical agents/*.md into both target dirs.
# Does NOT apply platform-specific mapping (capability → permission/tools),
# does NOT run validators. Files retain canonical frontmatter.
#
# Usage: scripts/sync-agents-fallback.sh [ROOT]
#   ROOT defaults to current directory.
set -euo pipefail

ROOT="${1:-$PWD}"
SRC="$ROOT/agents"
OUT_OPENCODE="$ROOT/.opencode/agents"
OUT_CLAUDE="$ROOT/.claude/agents"

if [ ! -d "$SRC" ]; then
  echo "[error] $SRC not found" >&2
  exit 1
fi

mkdir -p "$OUT_OPENCODE" "$OUT_CLAUDE"

count=0
for f in "$SRC"/*.md; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  cp "$f" "$OUT_OPENCODE/$base"
  cp "$f" "$OUT_CLAUDE/$base"
  count=$((count + 1))
done

echo "[ok] copied $count agents (no platform mapping applied — frontmatter unchanged)"
echo "[info] For permission/tools mapping, run scripts/sync-agents.mjs with Node 18+."
