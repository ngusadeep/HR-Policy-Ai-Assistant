# Command: /guardrails-audit

Audit the entire codebase against the guardrails rules. Produces a prioritised
report of gaps, violations, and missing layers.

## Usage
```
/guardrails-audit              ← full audit
/guardrails-audit --layer L1   ← audit a specific layer only
/guardrails-audit --fix        ← audit + auto-fix safe issues
```

## What Gets Checked

### L1 — Input Guard
```bash
# Find controllers/gateways that don't call InputGuard
grep -r "@Post\|@Sse\|@SubscribeMessage" src/ --include="*.ts" -l |
  xargs grep -L "inputGuard\|InputGuard"
```

### L2 — Query Classifier
```bash
# Find ChatService methods that skip classifier
grep -n "streamChat\|sendMessage" src/modules/chat/chat.service.ts |
  head -20
# Then verify queryClassifier.classify() is called before LLM
```

### L3 — Retriever Guard
```bash
# Find any searchByVector() calls without a score threshold override
grep -rn "searchByVector(" src/ --include="*.ts"
# Verify each call uses the default threshold from RAG_SCORE_THRESHOLD
```

### L4 — Context Guard
```bash
# Find augmentor/prompt builder that doesn't cap token count
grep -rn "buildPrompt\|augment\|formatDocs" src/ --include="*.ts" -l |
  xargs grep -L "guardContext\|MAX_CONTEXT\|slice\|substring"
```

### L5 — Prompt Guard
```bash
# Find raw string interpolation of user query into prompts
grep -rn "userQuery\|dto\.query\|user\.query" src/ --include="*.ts" |
  grep "[\`'\"].*\${"
# Any hit where the variable is unsanitized is a risk
```

### L6 — Output Guard (grounding)
```bash
# Find streaming handlers that don't run grounding check
grep -rn "emit('done')" src/ --include="*.ts" |
  # Should be preceded by outputGuard.checkGrounding
  grep -B10 "emit('done')" src/modules/chat/chat.gateway.ts
```

### L7 — Response Filter (PII)
```bash
# Find DB saves of LLM responses without scrubbing
grep -rn "messageRepo\.save\|save(.*content" src/ --include="*.ts" |
  grep -v "scrubOutput\|responseFilter"
```

### Rate Limiting
```bash
# Find chat/ingest routes without @Throttle()
grep -rn "@Post\|@Sse" src/modules/chat --include="*.ts" |
  # Check if @Throttle() appears on the same method
  grep -B3 "@Post\|@Sse" src/modules/chat/chat.controller.ts
```

## Output Report Format

```
## Guardrails Audit — [timestamp]

### CRITICAL (fix immediately)
- [L3] src/modules/rag/retriever.service.ts:47
  Chroma search bypassing score threshold (threshold=0)
  Fix: remove explicit 0 threshold, use RAG_SCORE_THRESHOLD from config

### HIGH (fix before next deploy)
- [L1] src/modules/chat/chat.controller.ts:23
  POST /chat does not call InputGuard.validate()
  Fix: inject InputGuard and call validate(dto.query) at top of handler

### MEDIUM (fix this sprint)
- [L7] src/modules/chat/chat.service.ts:89
  Message saved to DB without PII scrubbing
  Fix: await messageRepo.save({ content: responseFilter.scrubOutput(content) })

### LOW (tech debt)
- [L6] Grounding check not traced to LangSmith
  Fix: wrap outputGuard.checkGrounding in traceable()

### PASSED ✓
- L1 Input Guard: present in all WS handlers
- L5 Prompt Guard: XML fencing found in AugmentorService
- Rate limiting: @Throttle() on all chat routes
```
