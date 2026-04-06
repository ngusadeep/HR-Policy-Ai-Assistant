import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

const MAX_QUERY_LENGTH = 2000;
const MIN_QUERY_LENGTH = 2;

/**
 * Prompt-injection patterns to block at the input layer (L1).
 * Log internally with full detail; always return a generic message to the client.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|above|all)\s+instructions?/i,
  /forget\s+(everything|all|your)\s+(above|previous)/i,
  /you\s+are\s+now\s+(?:a\s+)?(?:dan|jailbreak|evil|unrestricted)/i,
  /system\s*:\s*you\s+are/i,
  /<\s*system\s*>/i,
  /\[INST\]|\[\/INST\]/,
  /###\s*(Human|Assistant|System)\s*:/i,
  /override\s+(your\s+)?(system|safety|previous)\s+(prompt|instructions?)/i,
  /print\s+(your\s+)?(system|initial)\s+prompt/i,
  /reveal\s+(your\s+)?(instructions?|system\s+prompt)/i,
];

@Injectable()
export class InputGuard {
  private readonly logger = new Logger(InputGuard.name);

  /**
   * L1: Validate user query before it enters the RAG pipeline.
   * Throws WsException on any violation — the gateway catches and surfaces a safe message.
   */
  validate(query: string, sessionId?: string): void {
    if (!query || typeof query !== 'string') {
      throw new WsException('Query must be a non-empty string.');
    }

    if (query.trim().length < MIN_QUERY_LENGTH) {
      throw new WsException('Query is too short.');
    }

    if (query.length > MAX_QUERY_LENGTH) {
      throw new WsException(`Query must not exceed ${MAX_QUERY_LENGTH} characters.`);
    }

    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(query)) {
        this.logger.warn({
          event: 'guardrail_triggered',
          layer: 'L1_input',
          sessionId,
          reason: 'Prompt injection pattern matched',
          pattern: pattern.source,
          // NEVER log the raw query
        });
        throw new WsException('Your message contains disallowed content.');
      }
    }
  }
}
