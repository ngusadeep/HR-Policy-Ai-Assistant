# Rules: WebSockets

Rules for the `ChatGateway` and all Socket.IO logic.

## Gateway Setup
```typescript
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.CORS_ORIGIN, credentials: true },
})
@UseGuards(WsJwtGuard)
@UseFilters(WsExceptionFilter)
@UsePipes(new WsValidationPipe())
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  afterInit() { this.logger.log('ChatGateway initialized'); }
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
```

## Authentication
```typescript
// WsJwtGuard — validate JWT from handshake, not from message payload
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth?.token;
    if (!token) throw new WsException('Missing token');
    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload; // attach to socket for downstream use
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
```

## Session Room Pattern
```typescript
@SubscribeMessage('join-session')
async handleJoin(@MessageBody() dto: JoinSessionDto, @ConnectedSocket() client: Socket) {
  // Verify session belongs to the authenticated user
  const session = await this.chatService.validateSession(dto.sessionId, client.data.user.sub);
  await client.join(dto.sessionId); // join room for session isolation
  client.emit('joined', { sessionId: dto.sessionId });
}
```

## Streaming Pattern
```typescript
@SubscribeMessage('chat')
async handleChat(
  @MessageBody() dto: SendMessageDto,
  @ConnectedSocket() client: Socket,
) {
  // tenantId ALWAYS from JWT — never from client message
  const { sub: userId, tenantId } = client.data.user;

  try {
    const stream = this.chatService.streamChat({ ...dto, userId, tenantId });
    for await (const token of stream) {
      client.emit('token', { token });
    }
    client.emit('done');
  } catch (err) {
    this.logger.error({ message: 'WS stream error', sessionId: dto.sessionId, error: err.message });
    client.emit('error', { message: 'Stream failed. Please try again.' });
    // Never expose raw error messages — sanitize before emitting
  }
}
```

## Event Contract
| Direction | Event | Payload |
|---|---|---|
| Client → Server | `join-session` | `{ sessionId: string }` |
| Client → Server | `chat` | `{ query: string, sessionId: string, topK?: number }` |
| Server → Client | `token` | `{ token: string }` |
| Server → Client | `done` | `{}` |
| Server → Client | `error` | `{ message: string }` |
| Server → Client | `joined` | `{ sessionId: string }` |

## Rules
- Never use `server.emit()` (broadcast to all) — always `client.emit()` or `server.to(room).emit()`.
- Always validate DTO with `WsValidationPipe` — treat WS messages as untrusted.
- `tenantId` and `userId` come from `client.data.user` (set by `WsJwtGuard`) — never from the message body.
- Catch all errors in message handlers — uncaught errors kill the entire socket.
- Log connection/disconnection events with `client.id` for debugging.
- Keep message handlers thin — delegate to `ChatService` for all logic.
