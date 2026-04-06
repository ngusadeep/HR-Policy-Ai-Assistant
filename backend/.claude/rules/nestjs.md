# Rules: NestJS

Always follow these patterns when writing NestJS code for this project.

## Module Structure
- Every feature module exports only what other modules need — keep the surface minimal.
- `SharedModule` (vector-store, cache, queue) is `@Global()` — never re-import it in feature modules.
- Use `forRootAsync()` with `ConfigService` for any module that needs env config (TypeORM, BullMQ, etc.).

## Controllers
- Controllers only: parse input, call service, return result. Zero business logic.
- Use `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse` on every endpoint.
- SSE endpoints return `Observable<MessageEvent>` — never a plain `Promise<string>`.
- Apply `@UseGuards(JwtAuthGuard)` and `@UseInterceptors(TimeoutInterceptor)` on all chat routes.

## Services
- All services are singleton scope (`DEFAULT`). Document any deviation.
- Inject `Logger` from `@nestjs/common` — `private readonly logger = new Logger(ServiceName.name)`.
- Use `this.config.getOrThrow<string>('KEY')` — this throws at startup if missing, not at runtime.
- Wrap external calls (Qdrant, LLM APIs) in try/catch and throw NestJS `HttpException` or custom exceptions.

## DTOs
```typescript
// Always use class-validator
export class SendMessageDto {
  @IsString() @MinLength(1) @MaxLength(2000)
  query: string;

  @IsUUID()
  sessionId: string;

  @IsOptional() @IsInt() @Min(1) @Max(20)
  topK?: number = 4;
}
```

## Global Setup (main.ts)
```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.useGlobalInterceptors(new LoggingInterceptor(), new TimeoutInterceptor(60_000));
app.useGlobalFilters(new HttpExceptionFilter(), new WsExceptionFilter());
app.use(helmet());
app.enableCors({ origin: configService.getOrThrow('CORS_ORIGIN') });
app.useWebSocketAdapter(new IoAdapter(app));
```

## Logging
```typescript
// Use structured logging — always include context
this.logger.log({ message: 'RAG retrieval complete', sessionId, docsFound: docs.length, durationMs });
this.logger.error({ message: 'LLM stream failed', sessionId, error: err.message });
// NEVER log: query text, user messages, retrieved doc content, API keys
```
