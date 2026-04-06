# CLAUDE.md — NestJS AI RAG Pipeline

## Project Overview
Production NestJS backend powering an AI RAG chat system with real-time WebSocket streaming, LangChain orchestration, LangSmith observability, Qdrant vector search, and PostgreSQL persistence.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | NestJS 10 + TypeScript 5 |
| LLM Orchestration | LangChain.js + LangSmith tracing |
| Vector DB | Qdrant (self-hosted via Docker) |
| Relational DB | PostgreSQL 15 + TypeORM |
| Cache / Queue | Redis 7 + BullMQ |
| Real-time | WebSockets (`@nestjs/websockets` + `socket.io`) + SSE |
| Auth | JWT (Passport.js) |
| Testing | Jest + Supertest |
| Observability | LangSmith + Winston logger |

## Architecture

```
Client (HTTP / WebSocket)
       │
       ▼
ChatController (REST + SSE)  ←→  ChatGateway (WebSocket)
       │
       ▼
ChatService  ──────────────────────────────────────────────┐
       │                                                   │
       ▼                                                   ▼
RAGModule                                           LangSmith Tracer
  ├── RetrieverService  → EmbeddingService → Qdrant
  ├── AugmentorService  → builds context prompt
  ├── RerankerService   → cross-encoder (optional)
  └── CorrectiveRAGService → LangGraph CRAG loop
       │
       ▼
GeneratorService (LangChain)
  ├── AnthropicProvider  (claude-sonnet)
  └── OpenAIProvider     (gpt-4o)
       │
       ▼
SSE stream / WebSocket emit → Client
```

## Module Map
```
src/
├── modules/
│   ├── chat/          ← ChatController, ChatService, ChatGateway
│   ├── rag/           ← RetrieverSvc, AugmentorSvc, CorrectiveRAGSvc
│   ├── documents/     ← DocumentController, IngestSvc, ChunkerSvc, EmbeddingSvc
│   ├── llm/           ← GeneratorSvc, providers/
│   └── auth/          ← AuthController, JwtStrategy
└── shared/
    ├── vector-store/  ← QdrantService
    ├── cache/         ← RedisService
    └── queue/         ← BullMQ processors
```

## Key Conventions

### NestJS
- Every module is **self-contained** — no cross-module direct imports, only injected services.
- Use `@Injectable({ scope: Scope.DEFAULT })` (singleton). Never request-scoped unless required.
- All DTOs use `class-validator` decorators. Validation pipe is global.
- Configs live in `config/*.config.ts` and are loaded via `@nestjs/config` with Joi validation.

### LangChain
- Always use `RunnableSequence` or LCEL `pipe()` — never raw `chain.call()`.
- Wrap every chain in a `traceable()` from `langsmith/traceable`.
- Use `StreamingCallbackHandler` for SSE/WebSocket token delivery.
- LangSmith project name: `LANGCHAIN_PROJECT` env var.

### WebSockets
- Gateway lives at `chat/chat.gateway.ts` with namespace `/chat`.
- Auth via `WsJwtGuard` on `@UseGuards()` — validate JWT from `handshake.auth.token`.
- Emit events: `token` (streaming chunk), `done` (end of stream), `error`.
- Use `socket.join(sessionId)` rooms for per-session isolation.

### Qdrant
- Collection name: `QDRANT_COLLECTION` env var (default: `documents`).
- Vector size matches embedding model (1536 for OpenAI, 768 for local BGE).
- Always filter by `metadata.tenantId` on search — never cross-tenant leakage.
- Use `QdrantService.upsertBatch()` for ingestion — never single-point inserts.

### PostgreSQL / TypeORM
- Entities use UUID primary keys (`@PrimaryGeneratedColumn('uuid')`).
- Migrations live in `src/database/migrations/` — never `synchronize: true` in production.
- All queries through TypeORM repositories — no raw SQL except in migrations.
- `ChatSession` and `Message` entities track LangSmith run IDs for trace correlation.

### Streaming Pattern (SSE)
```typescript
// ChatController
@Sse('stream')
streamChat(@Body() dto: SendMessageDto): Observable<MessageEvent> {
  return this.chatService.streamChat(dto).pipe(
    map(token => ({ data: { token } } as MessageEvent))
  );
}
```

### Streaming Pattern (WebSocket)
```typescript
// ChatGateway
@SubscribeMessage('chat')
async handleChat(@MessageBody() dto, @ConnectedSocket() client: Socket) {
  const stream = await this.chatService.streamChat(dto);
  for await (const token of stream) {
    client.emit('token', { token });
  }
  client.emit('done');
}
```

## Environment Variables
```env
# App
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/rag_db

# Redis
REDIS_URL=redis://localhost:6379

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=documents

# LLM
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-20250514

# Embeddings
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# LangSmith
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=nestjs-rag-pipeline

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

## Dev Commands
```bash
npm run start:dev          # Hot reload dev server
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage
npm run lint               # ESLint
npm run build              # Production build
docker-compose up -d       # Start postgres + redis + qdrant
npm run migration:run      # Run TypeORM migrations
npm run migration:generate # Generate new migration
```

## Guardrails Architecture

Every user request passes through 7 ordered layers before a response is delivered:

```
L1 InputGuard       → length, encoding, injection pattern match
L2 QueryClassifier  → intent: on_topic | off_topic | harmful  (fast LLM)
L3 RetrieverGuard   → score threshold, tenantId filter, zero-docs handler
L4 ContextGuard     → token budget cap (MAX_CONTEXT_TOKENS=6000)
L5 PromptGuard      → XML fence, injection instruction, no raw interpolation
     ↓ LLM Call
L6 OutputGuard      → grounding check via LLM judge (GROUNDING_CHECK_ENABLED)
L7 ResponseFilter   → PII scrub (email, phone, ID), forbidden pattern check
```

All guardrail events are logged as `WARN` with `event: 'guardrail_triggered'` and
traced to LangSmith with `tags: ['guardrail']`. PII is **never** logged.

The `GuardrailsModule` is the single entry point — `ChatService` calls
`guardrails.runInputPipeline()` and `guardrails.runOutputPipeline()`. Guards are
never called ad-hoc from controllers directly.

See `.claude/agents/guardrails.md` and `.claude/skills/guardrails/SKILL.md`
for full implementation patterns.

## Critical Rules
1. **Never read `.env` files directly** — always use `ConfigService`.
2. **Never `synchronize: true`** in TypeORM production config.
3. **Never expose LangSmith run IDs** to clients — internal use only.
4. **Always validate WebSocket payloads** — treat WS messages as untrusted input.
5. **Always set `timeout` on LLM calls** — default 60s via `TimeoutInterceptor`.
6. **Never upsert single Qdrant vectors** in a loop — always batch.
7. **Never `git push --force`** on `main` or `develop`.
