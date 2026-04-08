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

async function send(client: WebSocket, data: object): Promise<void> {
  if (client.readyState !== 1 /* OPEN */) return;
  await new Promise<void>((resolve, reject) => {
    client.send(JSON.stringify(data), (err?: Error) => {
      if (err) return reject(err);
      resolve();
    });
  });
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
      let validateResult: { isGreeting: boolean };
      try {
        validateResult = this.guardrails.validateInput(lastUser.content, sessionId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid input.';
        await send(client, { type: 'error', sessionId, message: msg });
        return;
      }

      // Greetings bypass RAG — stream a natural LLM response with no retrieval.
      if (validateResult.isGreeting) {
        try {
          const greetingStream = await this.chatRagService.streamGreeting(lastUser.content, sessionId);
          const greetingTokens: string[] = [];

          for await (const token of greetingStream) {
            const safe = this.guardrails.scrubOutput(token, sessionId);
            greetingTokens.push(safe);
            await send(client, { type: 'token', sessionId, text: safe });
          }

          await send(client, { type: 'done', sessionId });

          const greetingContent = greetingTokens.join('');
          const sessionRecord = await this.chatSessionRepo
            .findOrCreate(sessionId, null, collection)
            .catch(() => null);
          if (sessionRecord) {
            void this.chatSessionRepo
              .appendMessages(sessionRecord, [
                { role: 'user', content: lastUser.content },
                { role: 'assistant', content: greetingContent },
              ])
              .catch((err: unknown) =>
                this.logger.warn({ message: 'Could not persist greeting message', sessionId, err }),
              );
          }
        } catch (err) {
          this.logger.error('Greeting stream error', err);
          await send(client, { type: 'error', sessionId, message: 'An error occurred. Please try again.' });
        }
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

      // ── L6 pre-stream: if no chunks were retrieved, skip the LLM and send fallback ──
      if (sources.length === 0) {
        this.logger.warn({ message: 'No context chunks — skipping LLM, sending fallback', sessionId });
        const fallback = 'I could not find a reliable answer in the uploaded HR documents.';
        await send(client, { type: 'token', sessionId, text: fallback });
        await send(client, { type: 'done', sessionId });

        if (sessionRecord && lastUser) {
          void this.chatSessionRepo
            .appendMessages(sessionRecord, [
              { role: 'user', content: lastUser.content },
              { role: 'assistant', content: fallback },
            ])
            .catch((err: unknown) =>
              this.logger.warn({ message: 'Could not persist fallback message', sessionId, err }),
            );
        }
        return;
      }

      // Collect assistant tokens to persist the full response after streaming
      const assistantTokens: string[] = [];

      for await (const token of stream) {
        if (task.cancelled) break;
        // ── L7: scrub PII from each token before it reaches the client ────────
        const safe = this.guardrails.scrubOutput(token, sessionId);
        assistantTokens.push(safe);
        await send(client, { type: 'token', sessionId, text: safe });
      }

      if (!task.cancelled) {
        await send(client, { type: 'sources', sessionId, sources });
        await send(client, { type: 'done', sessionId });

        const assistantContent = assistantTokens.join('');

        // Persist user message + assistant response in DB (fire-and-forget)
        if (sessionRecord && lastUser) {
          void this.chatSessionRepo
            .appendMessages(sessionRecord, [
              { role: 'user', content: lastUser.content },
              { role: 'assistant', content: assistantContent },
            ])
            .catch((err: unknown) =>
              this.logger.warn({ message: 'Could not persist chat messages', sessionId, err }),
            );
        }

        // ── L6 post-stream: async grounding check for observability ──────────
        // Runs after the stream is delivered — does not block the client response.
        void this.guardrails
          .checkGrounding(assistantContent, sources, sessionId)
          .then((result) => {
            if (!result.grounded) {
              this.logger.warn({
                event: 'guardrail_triggered',
                layer: 'L6_output',
                sessionId,
                trigger: result.trigger,
                message: 'Post-stream grounding check failed — investigate for hallucination',
              });
            }
          })
          .catch((err: unknown) =>
            this.logger.warn({ message: 'Grounding check threw unexpectedly', sessionId, err }),
          );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      this.logger.error(`Chat error for session ${sessionId}:`, err);
      await send(client, { type: 'error', sessionId, message });
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
