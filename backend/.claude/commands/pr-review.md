# Command: /pr-review

Review a pull request against project standards.

## Usage
```
/pr-review #<pr-number>
/pr-review #37
```

## Steps

```bash
gh pr view $PR_NUMBER --json title,body,files,additions,deletions
gh pr diff $PR_NUMBER
```

## Review Dimensions

### Correctness
- Does the change solve the stated problem?
- Are edge cases handled? (empty Qdrant results, LLM timeout, malformed WS payload)
- Are all changed services covered by tests?

### Architecture
- Does the change follow module boundaries? (no cross-module class imports)
- Is new business logic in a service, not a controller or gateway?
- Are new LangChain chains using LCEL + `traceable()`?

### Performance
- Any N+1 Qdrant upserts? Should be batched.
- Any synchronous heavy operations in a WS message handler? Should be async.
- Any missing Redis caching for repeated embedding calls?

### Security (from `.claude/agents/security-auditor.md`)
- tenantId always from JWT, never from user input
- No secrets in code or logs
- WS payloads validated via DTO

### Code Quality
- No `any` types in public service interfaces
- `Logger` used instead of `console.log`
- Config from `ConfigService`, not `process.env`

## Output Format
```
## PR Review: #<number> — <title>

**Overall**: ✅ Approve | ⚠️ Request Changes | 🔴 Block

### Issues
- [critical] <file>:<line> — <issue>
- [warn] <file>:<line> — <issue>

### Suggestions
- <optional improvement>

### Tests
- Coverage adequate: yes/no
- Missing test cases: <list if any>
```
