import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsExceptionFilter } from 'src/common/filters/ws-exception.filter';
import { Server } from 'ws';
import type { WebSocket } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatRagService } from './services/chat-rag.service';
import { ChatQueryPayload } from './dto/chat-message.dto';
import { GuardrailsService } from 'src/modules/guardrails/guardrails.service';
import { ChatSessionRepository } from './repositories/chat-session.repository';

/** Active stream tasks — keyed by sessionId so we can cancel. */
const activeTasks = new Map<string, { cancelled: boolean }>();

function send(client: WebSocket, data: object): void {
  if (client.readyState === 1 /* OPEN */) {
    client.send(JSON.stringify(data));
  }
}

@WebSocketGateway({
  path: '/ws/chat',
  cors: { origin: '*' },
})
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatRagService: ChatRagService,
    private readonly guardrails: GuardrailsService,
    private readonly chatSessionRepo: ChatSessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Validate JWT from query param on connection. */
  handleConnection(client: WebSocket & { sessionId?: string }, req: { url?: string }) {
    try {
      const url = new URL(req.url ?? '', 'ws://localhost');
      const token = url.searchParams.get('token');
      if (!token) throw new Error('Missing token');
      this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('jwtSecret'),
      });
      this.logger.log('WebSocket client connected');
    } catch {
      this.logger.warn('WebSocket rejected: invalid token');
      client.close(4001, 'Unauthorized');
    }
  }

  handleDisconnect(client: WebSocket & { sessionId?: string }) {
    if (client.sessionId) {
      const task = activeTasks.get(client.sessionId);
      if (task) task.cancelled = true;
      activeTasks.delete(client.sessionId);
    }
    this.logger.log('WebSocket client disconnected');
  }

  @SubscribeMessage('query')
  async handleQuery(
    @ConnectedSocket() client: WebSocket & { sessionId?: string },
    @MessageBody() payload: ChatQueryPayload,
  ): Promise<void> {
    const { sessionId, messages, collection = 'hr_policies' } = payload;

    // ── L1: Input guardrail — validate the latest user message ───────────────
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      try {
        this.guardrails.validateInput(lastUser.content, sessionId);
      } catch (err) {
        // WsExceptionFilter will send the safe error message to the client
        const msg = err instanceof Error ? err.message : 'Invalid input.';
        send(client, { type: 'error', sessionId, message: msg });
        return;
      }
    }

    // Cancel any existing stream for this session
    const prev = activeTasks.get(sessionId);
    if (prev) prev.cancelled = true;

    const task = { cancelled: false };
    activeTasks.set(sessionId, task);
    client.sessionId = sessionId;

    // Ensure a DB session record exists (fire-and-forget — don't block the stream)
    const sessionRecord = await this.chatSessionRepo
      .findOrCreate(sessionId, null, collection)
      .catch((err: unknown) => {
        this.logger.warn({ message: 'Could not persist chat session', sessionId, err });
        return null;
      });

    try {
      const { stream, sources } = await this.chatRagService.query(messages, collection, sessionId);

      // Collect assistant tokens to persist the full response after streaming
      const assistantTokens: string[] = [];

      for await (const token of stream) {
        if (task.cancelled) break;
        // ── L7: scrub PII from each token before it reaches the client ────────
        const safe = this.guardrails.scrubOutput(token, sessionId);
        assistantTokens.push(safe);
        send(client, { type: 'token', sessionId, text: safe });
      }

      if (!task.cancelled) {
        send(client, { type: 'sources', sessionId, sources });
        send(client, { type: 'done', sessionId });

        // Persist user message + assistant response in DB (fire-and-forget)
        if (sessionRecord && lastUser) {
          const assistantContent = assistantTokens.join('');
          this.chatSessionRepo
            .appendMessages(sessionRecord, [
              { role: 'user', content: lastUser.content },
              { role: 'assistant', content: assistantContent },
            ])
            .catch((err: unknown) =>
              this.logger.warn({ message: 'Could not persist chat messages', sessionId, err }),
            );
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      this.logger.error(`Chat error for session ${sessionId}:`, err);
      send(client, { type: 'error', sessionId, message });
    } finally {
      activeTasks.delete(sessionId);
    }
  }

  @SubscribeMessage('cancel')
  handleCancel(
    @MessageBody() payload: { sessionId: string },
  ): void {
    const task = activeTasks.get(payload.sessionId);
    if (task) {
      task.cancelled = true;
      activeTasks.delete(payload.sessionId);
    }
  }
}
