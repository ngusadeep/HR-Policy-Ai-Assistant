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
  /ignore\s+all\s+previous/i,
  /forget\s+(everything|all|your)\s+(above|previous)/i,
  /you\s+are\s+now\s+(?:a\s+)?(?:dan|jailbreak|evil|unrestricted)/i,
  /act\s+as\s+(if\s+)?you\s+(are|were)/i,
  /disregard\s+(your\s+|all\s+|the\s+)?system/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /system\s*:\s*you\s+are/i,
  /<\s*system\s*>/i,
  /\[INST\]|\[\/INST\]/,
  /###\s*(Human|Assistant|System)\s*:/i,
  /override\s+(your\s+)?(system|safety|previous)\s+(prompt|instructions?)/i,
  /print\s+(your\s+)?(system|initial)\s+prompt/i,
  /reveal\s+(your\s+)?(instructions?|system\s+prompt)/i,
  /new\s+instructions?\s*:/i,
  /\[system\]/i,
];

/**
 * Off-topic patterns to block at the input layer (L1).
 * Returns a scope-explanation message rather than an error.
 */
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(recipe|cooking|baking|movie|film|cricket|football|soccer|weather|forecast)\b/i,
  /\b(stock|crypto|bitcoin|ethereum|forex|trading|investment)\b/i,
  /\b(politics|election|government|religion|faith|prayer)\b/i,
  /\b(joke|riddle|poem|story|song|lyrics)\b/i,
  /\b(dating|relationship|romantic|girlfriend|boyfriend)\b/i,
];

const OFF_TOPIC_MESSAGE =
  "Sorry, I can't help with that one! But if you have any questions about HR policies — like leave, benefits, conduct, or anything workplace-related — I'm happy to help with those!";

@Injectable()
export class InputGuard {
  private readonly logger = new Logger(InputGuard.name);

  /**
   * L1: Validate user query before it enters the RAG pipeline.
   * Throws WsException on any violation — the gateway catches and surfaces a safe message.
   * For off-topic inputs, throws with a friendly scope-explanation message.
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
        throw new WsException('I can only answer questions about company HR policies. Please rephrase your question.');
      }
    }

    for (const pattern of OFF_TOPIC_PATTERNS) {
      if (pattern.test(query)) {
        this.logger.warn({
          event: 'guardrail_triggered',
          layer: 'L1_input',
          sessionId,
          reason: 'Off-topic pattern matched',
          pattern: pattern.source,
        });
        throw new WsException(OFF_TOPIC_MESSAGE);
      }
    }
  }
}
