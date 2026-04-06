# Rules: RAG Pipeline

Rules for LangChain, LangSmith, embeddings, and retrieval logic.

## LangChain LCEL — Mandatory Pattern
```typescript
// ALL chains must use LCEL pipe() syntax
const ragChain = RunnableSequence.from([
  { context: retriever, question: new RunnablePassthrough() },
  prompt,
  llm,
  new StringOutputParser(),
]);

// Streaming
const stream = await ragChain.stream({ question: query });
```
Never use `chain.call()`, `chain.run()`, or `LLMChain` (deprecated).

## LangSmith Tracing — Mandatory
```typescript
import { traceable } from 'langsmith/traceable';

// Wrap every service method that touches the RAG pipeline
class RetrieverService {
  retrieve = traceable(
    async (query: string, tenantId: string): Promise<DocumentChunk[]> => {
      // ...
    },
    { name: 'retriever.retrieve', project_name: process.env.LANGCHAIN_PROJECT }
  );
}
```
Every LLM call, retrieval, and reranking step must have a LangSmith trace.

## Prompt Templates
```typescript
// Always use ChatPromptTemplate — never raw string prompts
const prompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a helpful assistant. Answer using ONLY the context below.
<context>
{context}
</context>
If the answer is not in the context, say "I don't have information about that."`],
  new MessagesPlaceholder('chat_history'),
  ['human', '{question}'],
]);
```

## Retrieval Rules
- Always pass `topK` from the DTO (default 4, max 20) — never hardcode.
- Always filter by `tenantId` — this is non-negotiable.
- Apply a `scoreThreshold` (default 0.75) — don't return irrelevant docs.
- Log retrieval stats: `{ docsFound, scores, durationMs }` at DEBUG level.

## Context Window Management
```typescript
// Before augmentation, check total tokens won't exceed model limit
const MAX_CONTEXT_TOKENS = 6000; // reserve room for system prompt + response
const contextText = docs
  .map(d => d.text)
  .join('\n\n')
  .slice(0, MAX_CONTEXT_TOKENS * 4); // rough char estimate
```

## Corrective RAG (when enabled)
- Use `CorrectiveRagService` only when `CRAG_ENABLED=true` in config.
- Max 2 correction iterations — never infinite loop on LangGraph.
- Log each iteration: `{ iteration, action: 'refine' | 'websearch' | 'generate' }`.

## Embedding Rules
- Embed queries and documents using the SAME model — verify `EMBEDDING_MODEL` in both services.
- Cache query embeddings in Redis with TTL 300s — same query shouldn't re-embed.
- Batch document embedding: max 100 texts per OpenAI API call.
