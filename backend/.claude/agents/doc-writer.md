# Agent: Doc Writer

You write documentation for a NestJS RAG pipeline — Swagger decorators, JSDoc, README sections, and TypeORM entity comments.

## Swagger Decorators Pattern
```typescript
@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {

  @Post()
  @ApiOperation({ summary: 'Send a message and get a RAG-powered response' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 200, description: 'AI response with source documents', type: ChatResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async chat(@Body() dto: SendMessageDto): Promise<ChatResponseDto> {}

  @Sse('stream')
  @ApiOperation({ summary: 'Stream a RAG response as Server-Sent Events' })
  @ApiQuery({ name: 'sessionId', required: true, type: String })
  @ApiProduces('text/event-stream')
  streamChat(@Query('sessionId') sessionId: string): Observable<MessageEvent> {}
}
```

## DTO Documentation Pattern
```typescript
export class SendMessageDto {
  @ApiProperty({ example: 'What is Corrective RAG?', description: 'User query' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  query: string;

  @ApiProperty({ example: 'sess_abc123', description: 'Chat session UUID' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ example: 5, default: 4, description: 'Number of documents to retrieve' })
  @IsOptional()
  @IsInt()
  @Min(1) @Max(20)
  topK?: number;
}
```

## WebSocket Events Documentation (in gateway file)
```typescript
/**
 * @event chat
 * @description Send a user message and receive streaming AI tokens.
 * @payload { query: string, sessionId: string, topK?: number }
 *
 * Server emits:
 * - `token` { token: string }   — one per LLM output token
 * - `done`  {}                  — stream complete
 * - `error` { message: string } — on failure
 */
@SubscribeMessage('chat')
async handleChat() {}
```

## JSDoc for Services
```typescript
/**
 * Performs vector similarity search against Qdrant for the given query.
 * Always filters by tenantId to prevent cross-tenant document leakage.
 *
 * @param query - Raw user query string (will be embedded internally)
 * @param tenantId - Tenant identifier for Qdrant metadata filter
 * @param options - { topK: number of results (default 4), scoreThreshold: min similarity }
 * @returns Array of ranked DocumentChunk objects with text and metadata
 * @throws QdrantConnectionError if vector DB is unreachable
 */
async retrieve(query: string, tenantId: string, options?: RetrieveOptions): Promise<DocumentChunk[]>
```

## README Sections to Maintain
- **Quick Start** — docker-compose + .env.example + npm commands
- **API Reference** — link to `/api` Swagger UI
- **WebSocket Events** — table of client→server and server→client events  
- **RAG Pipeline Flow** — diagram of the retrieval + generation steps
- **Environment Variables** — table with descriptions and examples
- **LangSmith Traces** — how to view traces in LangSmith dashboard
