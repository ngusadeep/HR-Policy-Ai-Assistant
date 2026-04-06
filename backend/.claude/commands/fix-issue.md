# Command: /fix-issue

Fix a GitHub issue end-to-end: diagnose, implement, test, and open a PR.

## Usage
```
/fix-issue #<issue-number>
/fix-issue #42
```

## Steps

1. **Fetch issue details**
   ```bash
   gh issue view $ISSUE_NUMBER --json title,body,labels,assignees
   ```

2. **Identify affected module**
   - RAG issue? → `src/modules/rag/`
   - WebSocket issue? → `src/modules/chat/chat.gateway.ts`
   - Ingest/embedding? → `src/modules/documents/`
   - LLM/streaming? → `src/modules/llm/`
   - DB/migration? → `src/database/`

3. **Check LangSmith if LLM-related**
   - Open `https://smith.langchain.com/projects/$LANGCHAIN_PROJECT`
   - Find failed run matching the issue report

4. **Implement the fix**
   - Follow patterns in `CLAUDE.md` and relevant `rules/*.md`
   - Keep changes minimal and focused

5. **Write or update tests**
   - Follow patterns in `.claude/agents/test-writer.md`
   - Run: `npm run test -- --testPathPattern=<affected-module>`

6. **Run lint and build**
   ```bash
   npm run lint
   npm run build
   ```

7. **Commit and open PR**
   ```bash
   git checkout -b fix/issue-$ISSUE_NUMBER
   git add .
   git commit -m "fix(#$ISSUE_NUMBER): <short description>"
   gh pr create --title "fix(#$ISSUE_NUMBER): <title>" --body "Closes #$ISSUE_NUMBER\n\n## Changes\n<list>\n\n## Testing\n<how tested>"
   ```
