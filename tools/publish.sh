#!/usr/bin/env bash
# Validate every batch, rebuild, refuse to publish on errors or silently removed works, then commit and push.
# Usage: tools/publish.sh "commit message"   (set ALLOW_REMOVED=1 to accept intentional removals)
set -euo pipefail
cd "$(dirname "$0")/.."
msg="${1:?commit message required}"
python3 tools/validate.py --all > /tmp/sri-validate.txt || { grep -v "^   note" /tmp/sri-validate.txt | grep -v "^✓"; echo "✗ validation failed — not publishing"; exit 1; }
if ls data/orgs/*.json >/dev/null 2>&1; then
  python3 tools/validate_orgs.py --all > /tmp/sri-orgs.txt || { grep -v "^✓" /tmp/sri-orgs.txt; echo "✗ organization validation failed — not publishing"; exit 1; }
fi
python3 tools/build_data.py 2>&1 | tee /tmp/sri-build.txt | grep -E "creators=|REMOVED|unknown work" || true
if grep -q "REMOVED" /tmp/sri-build.txt && [ "${ALLOW_REMOVED:-0}" != "1" ]; then
  echo "✗ works were removed since the last build (see data/dropped.json) — set ALLOW_REMOVED=1 if intended"; exit 1
fi
if grep -q "unknown work" /tmp/sri-build.txt; then
  grep "unknown work" /tmp/sri-build.txt; echo "✗ a collection lists a work that does not exist — not publishing"; exit 1
fi
git add -A
git commit -q -m "$msg

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
git pull --rebase --autostash -q   # GitHub may commit to CNAME when the Pages domain is changed
git push -q
git log --oneline | head -1
