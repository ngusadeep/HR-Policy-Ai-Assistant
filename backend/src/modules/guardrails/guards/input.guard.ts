import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

const MAX_QUERY_LENGTH = 2000;
const MIN_QUERY_LENGTH = 2;

/**
 * Greeting / small-talk patterns — matched against the full (trimmed) input.
 * When matched, the query bypasses all other L1 checks and is routed
 * to a static greeting response without touching the RAG pipeline.
 *
 * Covers: basic greetings, wellbeing questions, identity questions, capability questions.
 */
const GREETING_PATTERNS: RegExp[] = [
  // Simple greetings — tolerant of common typos (hellow, helow, helo, helloooo, etc.)
  /^(hi+|he+l+o+w?|hey+|howdy|greetings|yo+)[!?.,\s]*$/i,
  /^good\s+(morning|afternoon|evening|day)[!?.,\s]*$/i,
  /^(hi+|he+l+o+w?|hey+)\s+there[!?.,\s]*$/i,

  // Wellbeing / small talk
  /^how\s+are\s+you(\s+(doing|going|today))?[!?.,\s]*$/i,
  /^how('s|\s+is)\s+(it\s+going|everything|your\s+day)[!?.,\s]*$/i,
  /^(what'?s\s+up|sup|wassup)[!?.,\s]*$/i,

  // Identity / capability questions
  /^who\s+are\s+you[!?.,\s]*$/i,
  /^what\s+are\s+you[!?.,\s]*$/i,
  /^what\s+can\s+you\s+(do|help\s+(me\s+)?with)[!?.,\s]*$/i,
  /^(tell\s+me\s+about\s+yourself|introduce\s+yourself)[!?.,\s]*$/i,
  /^(are\s+you\s+(a\s+)?(bot|ai|assistant|robot))[!?.,\s]*$/i,
];

/**
 * Prompt-injection patterns to block at the input layer (L1).
 * Log internally with full detail; always return a generic message to the client.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|above|all)\s+instructions?/i,
  /ignore\s+all\s+previous/i,
  /forget\s+(everything|all|your)\s+(above|previous)/i,
  /you\s+are\s+now\s+(?:a\s+)?(?:dan|jailbreak|evil|unrestricted)/i,
  // Narrow: only block when followed by a known jailbreak persona — avoids blocking
  // legitimate HR hypotheticals like "what if I act as a team lead?"
  /act\s+as\s+(if\s+)?you\s+(are|were)\s+(now\s+)?(a\s+)?(dan|jailbreak|evil|unrestricted|unfiltered|different\s+(?:ai|assistant|model|bot)|another\s+(?:ai|assistant|model|bot))/i,
  /disregard\s+(your\s+|all\s+|the\s+)?system\s+(prompt|instructions?|rules?)/i,
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


export interface ValidateResult {
  isGreeting: boolean;
}

@Injectable()
export class InputGuard {
  private readonly logger = new Logger(InputGuard.name);

  /**
   * L1: Validate user query before it enters the RAG pipeline.
   * Returns { isGreeting: true } for simple greetings — caller must skip RAG.
   * Throws WsException on any violation — the gateway catches and surfaces a safe message.
   */
  validate(query: string, sessionId?: string): ValidateResult {
    if (!query || typeof query !== 'string') {
      throw new WsException('Query must be a non-empty string.');
    }

    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      throw new WsException('Query is too short.');
    }

    if (query.length > MAX_QUERY_LENGTH) {
      throw new WsException(`Query must not exceed ${MAX_QUERY_LENGTH} characters.`);
    }

    // Check greetings BEFORE off-topic so "Hello" is never incorrectly blocked.
    for (const pattern of GREETING_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { isGreeting: true };
      }
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

    return { isGreeting: false };
  }
}
