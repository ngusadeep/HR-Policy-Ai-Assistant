import { Catch, Logger, type ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import type { WebSocket } from 'ws';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
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

    if (client.readyState === 1 /* OPEN */) {
      client.send(JSON.stringify({ type: 'error', message: safeMessage }));
    }
  }
}
