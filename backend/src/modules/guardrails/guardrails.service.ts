import { Injectable } from '@nestjs/common';
import { InputGuard, type ValidateResult } from './guards/input.guard';
import { ContextGuard, type GuardedChunk } from './guards/context.guard';
import { PromptGuard } from './guards/prompt.guard';
import { ResponseFilter } from './filters/response.filter';
import { OutputGuard, type GroundingResult } from './guards/output.guard';

export type { GuardedChunk };

@Injectable()
export class GuardrailsService {
  constructor(
    private readonly inputGuard: InputGuard,
    private readonly contextGuard: ContextGuard,
    private readonly promptGuard: PromptGuard,
    private readonly responseFilter: ResponseFilter,
    private readonly outputGuard: OutputGuard,
  ) {}

  /**
   * L1 — validate user input before it enters the pipeline.
   * Returns { isGreeting: true } when the input is a simple greeting (caller must skip RAG).
   * Throws WsException on any policy violation.
   */
  validateInput(query: string, sessionId?: string): ValidateResult {
    return this.inputGuard.validate(query, sessionId);
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

  /**
   * L6 — verify the assembled LLM response is grounded in the retrieved context.
   * Designed to be called asynchronously after streaming completes (fire-and-forget).
   * Results feed LangSmith observability and DB analytics — they do not block the stream.
   */
  checkGrounding(
    assembledResponse: string,
    chunks: GuardedChunk[],
    sessionId?: string,
  ): Promise<GroundingResult> {
    return this.outputGuard.check(assembledResponse, chunks, sessionId);
  }
}
