#!/usr/bin/env bash
#
# sync-skills.sh
# Pulls latest from agent-skills and syncs individual skills to agents-subagents/skills
#
set -euo pipefail

AGENT_SKILLS_DIR="$HOME/workspace/agent-skills"
SKILLS_SOURCE="$AGENT_SKILLS_DIR/packages/skills-catalog/skills"
SKILLS_DEST="$HOME/workspace/github/agents-subagents/skills"

echo "=== Pulling latest from agent-skills ==="
cd "$AGENT_SKILLS_DIR"
git pull --ff-only origin main

echo "=== Syncing skills ==="
for category_dir in "$SKILLS_SOURCE"/*/; do
  for skill_dir in "$category_dir"*/; do
    skill_name=$(basename "$skill_dir")
    echo "  Syncing: $skill_name"
    rsync -av --delete "$skill_dir" "$SKILLS_DEST/$skill_name/"
  done
done

echo "=== Done ==="
echo "Skills synced: $(ls -d "$SKILLS_DEST"/*/ 2>/dev/null | wc -l | tr -d ' ')"
