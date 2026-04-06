#!/bin/bash
# Lint-on-save hook — triggered after Claude writes a TypeScript file
# Usage: called by PostToolUse Write hook in settings.json

FILE=$1

if [[ "$FILE" == *.ts && "$FILE" != *.spec.ts && "$FILE" != *.d.ts ]]; then
  echo "→ Linting $FILE..."
  npx eslint "$FILE" --fix --quiet 2>&1 | tail -5 || true
fi
