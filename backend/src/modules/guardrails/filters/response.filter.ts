import { Injectable, Logger } from '@nestjs/common';

/** PII patterns scrubbed from LLM output before it reaches the client or DB. */
const PII_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  // International phone numbers (7–15 digits, optional separators)
  { pattern: /(\+?\d[\d\s\-().]{7,}\d)/g, replacement: '[PHONE]' },
  // Credit / debit card numbers
  { pattern: /\b(?:\d[ -]?){13,16}\b/g, replacement: '[CARD]' },
  // Tanzanian NIDA — 20-digit national ID
  { pattern: /\b\d{20}\b/g, replacement: '[ID]' },
  // Generic 8-digit ID-like patterns
  { pattern: /\b\d{8}\b/g, replacement: '[ID]' },
];

@Injectable()
export class ResponseFilter {
  private readonly logger = new Logger(ResponseFilter.name);

  /**
   * L7: Scrub PII from assembled LLM output before persisting or streaming.
   * Fast regex pass — never an additional LLM call.
   * PII is never logged.
   */
  scrub(text: string, sessionId?: string): string {
    let result = text;
    let redacted = false;

    for (const { pattern, replacement } of PII_RULES) {
      const replaced = result.replace(pattern, replacement);
      if (replaced !== result) {
        redacted = true;
      }
      result = replaced;
    }

    if (redacted) {
      this.logger.warn({
        event: 'guardrail_triggered',
        layer: 'L7_output',
        sessionId,
        reason: 'PII pattern scrubbed from LLM response',
        // NEVER log the raw or scrubbed text
      });
    }

    return result;
  }
}
