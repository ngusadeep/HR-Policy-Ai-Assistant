import { Injectable } from '@nestjs/common';
import { InputGuard } from './guards/input.guard';
import { ContextGuard, type GuardedChunk } from './guards/context.guard';
import { PromptGuard } from './guards/prompt.guard';
import { ResponseFilter } from './filters/response.filter';

export type { GuardedChunk };

@Injectable()
export class GuardrailsService {
  constructor(
    private readonly inputGuard: InputGuard,
    private readonly contextGuard: ContextGuard,
    private readonly promptGuard: PromptGuard,
    private readonly responseFilter: ResponseFilter,
  ) {}

  /** L1 — validate user input before it enters the pipeline. Throws WsException on violation. */
  validateInput(query: string, sessionId?: string): void {
    this.inputGuard.validate(query, sessionId);
  }

  /** L4 + L5 — enforce token budget, then build a safe XML-fenced context string. */
  buildSafeContext(chunks: GuardedChunk[], maxTokens?: number): string {
    const guarded = this.contextGuard.enforce(chunks, maxTokens);
    return this.promptGuard.buildSafeContext(guarded);
  }

  /** L7 — scrub PII from the assembled LLM response before sending to client or DB. */
  scrubOutput(text: string, sessionId?: string): string {
    return this.responseFilter.scrub(text, sessionId);
  }
}
