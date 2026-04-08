import { Catch, Logger, type ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import type { WebSocket } from 'ws';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const client = host.switchToWs().getClient<WebSocket>();
    const message =
      exception instanceof WsException
        ? exception.getError()
        : exception instanceof Error
          ? exception.message
          : 'An unexpected error occurred.';

    this.logger.error('WebSocket exception', exception instanceof Error ? exception.stack : String(exception));

    // Never expose internal error details to the client
    const safeMessage =
      exception instanceof WsException ? String(message) : 'An error occurred. Please try again.';

    await this.safeSend(client, { type: 'error', message: safeMessage });
  }

  private async safeSend(client: WebSocket, payload: object): Promise<void> {
    if (client.readyState !== 1 /* OPEN */) return;
    await new Promise<void>((resolve, reject) => {
      client.send(JSON.stringify(payload), err => {
        if (err) {
          this.logger.warn('Failed to send WS error message', err);
          return reject(err);
        }
        resolve();
      });
    });
  }
}
