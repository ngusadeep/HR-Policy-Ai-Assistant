# Rules: Database (PostgreSQL + Chroma)

## PostgreSQL / TypeORM

### Hard Rules
- `synchronize: false` always — even in development. Use migrations.
- `dropSchema: false` always — never in any config.
- Entities use `@PrimaryGeneratedColumn('uuid')` — no auto-increment integers.
- All multi-table writes must be in a transaction.

### Migration Workflow
```bash
# Generate after entity changes
npm run migration:generate -- src/database/migrations/AddMessageTokenCount

# Review the generated file before running
cat src/database/migrations/<timestamp>-AddMessageTokenCount.ts

# Run
npm run migration:run
```
Never edit a migration file that has already been run in any environment.

### Entity Conventions
```typescript
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'text' }) content: string;
  @Column({ type: 'varchar', length: 10 }) role: 'user' | 'assistant';
  @Column({ type: 'int', nullable: true }) inputTokens?: number;
  @Column({ type: 'int', nullable: true }) outputTokens?: number;
  @Column({ type: 'varchar', nullable: true }) langsmithRunId?: string; // for trace correlation

  @ManyToOne(() => ChatSession, s => s.messages, { onDelete: 'CASCADE' })
  session: ChatSession;

  @CreateDateColumn() createdAt: Date;
}
```

### Repository Pattern
```typescript
// Always inject via @InjectRepository
constructor(
  @InjectRepository(Message) private messageRepo: Repository<Message>,
) {}

// Use QueryBuilder for complex queries
const sessions = await this.sessionRepo
  .createQueryBuilder('s')
  .leftJoinAndSelect('s.messages', 'm')
  .where('s.userId = :userId', { userId })
  .orderBy('s.updatedAt', 'DESC')
  .take(20)
  .getMany();
```

## Chroma

### Collection Setup
Collections are created automatically by `ChromaService.getStore()` with cosine distance.
No manual collection creation needed — `getOrCreateCollection` handles it.

### Add Documents Pattern
```typescript
// Always use addDocuments() — Chroma embeds internally via OpenAIEmbeddings
await chromaService.addDocuments(
  chunks.map((c, i) => ({
    text: c.text,
    metadata: {
      documentId: c.documentId,
      chunkIndex: i,
      source: c.sourceName,
    },
  })),
  chunks.map((_, i) => `doc-${documentId}-chunk-${i}`),
  collectionName,
);
```

### Search Pattern
```typescript
// Pass pre-computed vector from EmbeddingsService (has in-memory cache)
const queryVector = await embeddingsService.embedQuery(query);
const results = await chromaService.searchByVector(queryVector, topK, collectionName);
// results: Array<{ payload: Record<string, unknown>; score: number }>
// score is cosine similarity in [0, 1] — higher is more relevant
```

### Delete Pattern
```typescript
// Delete all chunks for a document by metadata filter
await chromaService.deleteByDocumentId(documentId, collectionName);
```
