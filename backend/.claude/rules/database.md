# Rules: Database (PostgreSQL + Qdrant)

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

## Qdrant

### Collection Setup
```typescript
// Always create collection with explicit config
await qdrantClient.createCollection(collectionName, {
  vectors: {
    size: this.config.getOrThrow<number>('EMBEDDING_DIMENSIONS'),
    distance: 'Cosine',
  },
  optimizers_config: { default_segment_number: 2 },
  replication_factor: 1,
});
```

### Upsert Pattern
```typescript
// Always batch — never single-point upsert in a loop
await qdrantClient.upsert(collectionName, {
  wait: true,
  points: chunks.map((chunk, i) => ({
    id: uuidv4(),
    vector: vectors[i],
    payload: {
      text: chunk.text,
      tenantId: chunk.tenantId,       // MANDATORY
      documentId: chunk.documentId,
      chunkIndex: chunk.index,
      metadata: chunk.metadata,
    },
  })),
});
```

### Search Pattern
```typescript
// Always include tenantId filter
const results = await qdrantClient.search(collectionName, {
  vector: queryVector,
  limit: topK,
  score_threshold: scoreThreshold,
  filter: {
    must: [{ key: 'tenantId', match: { value: tenantId } }],
  },
  with_payload: true,
});
```
