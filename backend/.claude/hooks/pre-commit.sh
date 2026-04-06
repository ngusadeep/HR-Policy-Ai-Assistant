#!/bin/bash
# Pre-commit hook — runs before every commit
# Claude must pass all checks before committing

set -e

echo "🔍 Running pre-commit checks..."

# 1. Lint
echo "→ ESLint..."
npm run lint --silent
echo "  ✓ Lint passed"

# 2. TypeScript type check
echo "→ TypeScript..."
npx tsc --noEmit --skipLibCheck
echo "  ✓ Type check passed"

# 3. Unit tests
echo "→ Unit tests..."
npm run test --silent -- --passWithNoTests
echo "  ✓ Tests passed"

# 4. Secret scan — block commits with exposed API keys
echo "→ Secret scan..."
if git diff --cached --name-only | xargs grep -l "sk-ant-\|sk-proj-\|ls__\|ANTHROPIC_API_KEY=\|OPENAI_API_KEY=" 2>/dev/null; then
  echo "  ✗ BLOCKED: Possible secret detected in staged files"
  exit 1
fi
echo "  ✓ No secrets found"

# 5. Block direct process.env access outside config files
echo "→ Config hygiene..."
VIOLATIONS=$(git diff --cached --name-only | grep "\.ts$" | grep -v "config\/" | xargs grep -l "process\.env\." 2>/dev/null || true)
if [ -n "$VIOLATIONS" ]; then
  echo "  ⚠ Warning: process.env used outside config/ in: $VIOLATIONS"
  echo "    Use ConfigService instead. Continuing..."
fi

echo ""
echo "✅ All pre-commit checks passed."
