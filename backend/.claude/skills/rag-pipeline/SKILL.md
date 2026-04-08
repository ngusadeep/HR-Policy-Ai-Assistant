# SKILL: RAG Pipeline Debugging & Tuning

When retrieval quality is poor or the pipeline is slow/failing.

## Retrieval Quality Issues

### Symptom: AI answers are wrong or hallucinated
1. Check LangSmith trace — are the retrieved docs relevant to the query?
2. If docs are irrelevant → lower `scoreThreshold` (try 0.65) or increase `topK`
3. If docs are relevant but answer is wrong → check prompt — is context properly injected?
4. Add reranker: `RerankerService` with cross-encoder to reorder top-k before augmentation

### Symptom: Chroma returns 0 results
```typescript
// Debug: log raw scores before threshold filtering
const vector = await embeddingsService.embedQuery(query);
const results = await chromaService.searchByVector(vector, 12, collection, 0); // threshold=0 to see all
console.log('Raw scores:', results.map(r => r.score));
// If all scores < RAG_SCORE_THRESHOLD → lower threshold in .env
// If empty collection → check ingestion completed successfully
// curl http://localhost:8000/api/v1/collections/hr_policies/count
```

### Symptom: Same query, slightly different results each time
- Chroma HNSW search is approximate — expected for large collections
- For small collections (< 10k vectors) results should be deterministic

## Performance Tuning

### Query embedding cache (Redis)
```typescript
async embedQuery(query: string): Promise<number[]> {
  const cacheKey = `embed:${createHash('sha256').update(query).digest('hex')}`;
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const vector = await this.openai.embeddings.create({ input: query, model: this.embeddingModel });
  await this.redis.setex(cacheKey, 300, JSON.stringify(vector.data[0].embedding));
  return vector.data[0].embedding;
}
```

### Parallel retrieval + history fetch
```typescript
// Don't await sequentially — run in parallel
const [docs, chatHistory] = await Promise.all([
  this.retrieverService.retrieve(query, tenantId, { topK }),
  this.chatService.getHistory(sessionId),
]);
```

### BullMQ ingest processor tuning
```typescript
// For large documents
@Processor('ingest', { concurrency: 3 })
export class IngestProcessor {
  @Process({ name: 'ingest-document' })
  async process(job: Job<IngestJobData>) {
    // Process in chunks to avoid memory pressure
    const BATCH_SIZE = 50;
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      const vectors = await this.embedding.embedDocuments(batch.map(c => c.text));
      await this.chromaService.addDocuments(
        batch.map((c, i) => ({ text: c.text, metadata: c.metadata })),
        batch.map((c) => c.id),
        collection,
      );
      await job.progress(Math.round(((i + BATCH_SIZE) / allChunks.length) * 100));
    }
  }
}
```

## Corrective RAG Decision Logic
```
query → retrieve → grade relevance (LLM judge)
  → ALL_RELEVANT   → augment → generate
  → PARTIALLY_RELEVANT → refine query → re-retrieve → augment → generate  
  → NOT_RELEVANT   → web search fallback → augment → generate
  (max 2 iterations)
```

## LangSmith Query for Slow Runs
In LangSmith dashboard:
- Filter: `project = nestjs-rag-pipeline` + `latency > 5000ms`
- Look at: which step is slowest (retrieval? embedding? LLM?)
- Common bottleneck: embedding (cache it) or large context (trim it)
