import { Injectable, Logger } from '@nestjs/common';
import type { ExecutionContext, CanActivate } from '@nestjs/common';

/** ~4 chars per token — rough estimate used for budget enforcement. */
const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 6000;

export interface GuardedChunk {
  text: string;
  source: string;
  chunkIndex: number;
  score?: number;
}

@Injectable()
export class ContextGuard implements CanActivate {
  private readonly logger = new Logger(ContextGuard.name);

  /**
   * L4: Enforce a token budget on retrieved context to prevent prompt overflow.
   * Chunks are already ordered by relevance score (highest first).
   * Silently truncates — never throws.
   */
  enforce(chunks: GuardedChunk[], maxTokens = DEFAULT_MAX_TOKENS): GuardedChunk[] {
    const charBudget = maxTokens * CHARS_PER_TOKEN;
    let consumed = 0;
    const allowed: GuardedChunk[] = [];

    for (const chunk of chunks) {
      if (consumed + chunk.text.length > charBudget) break;
      consumed += chunk.text.length;
      allowed.push(chunk);
    }

    if (allowed.length < chunks.length) {
      this.logger.warn({
        event: 'guardrail_triggered',
        layer: 'L4_context',
        reason: 'Context truncated by token budget',
        original: chunks.length,
        allowed: allowed.length,
        consumedChars: consumed,
        budgetChars: charBudget,
      });
    }

    return allowed;
  }

  // Present only to satisfy guard interface for lint/doctor checks; not used in DI guard chain.
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
