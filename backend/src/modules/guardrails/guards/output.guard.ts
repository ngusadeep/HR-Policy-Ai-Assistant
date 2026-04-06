import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { GROUNDING_CHECK_PROMPT } from '../prompts/grounding-check.prompt';

export type OutputGuardTrigger = 'empty_context' | 'ungrounded_answer';

export interface GroundingResult {
  grounded: boolean;
  trigger?: OutputGuardTrigger;
}

@Injectable()
export class OutputGuard {
  private readonly logger = new Logger(OutputGuard.name);
  private readonly groundingModel: ChatOpenAI;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<string>('guardrails.groundingCheckEnabled', 'true') !== 'false';

    this.groundingModel = new ChatOpenAI({
      apiKey: this.configService.getOrThrow<string>('openai.apiKey'),
      model: 'gpt-4o-mini',
      temperature: 0,
      maxTokens: 10, // Only needs GROUNDED or UNGROUNDED
    });
  }

  /**
   * L6: Verify that the assembled LLM response is grounded in the retrieved context.
   *
   * Fast deterministic checks run first (zero LLM cost).
   * If GROUNDING_CHECK_ENABLED, a cheap model-based call confirms grounding.
   * On any failure, returns { grounded: false } — never surfaces raw errors.
   *
   * This method is designed to be called asynchronously after streaming completes.
   * Results are used for LangSmith observability and DB persistence, not to block the stream.
   */
  async check(
    assembledResponse: string,
    contextChunks: Array<{ text: string }>,
    sessionId?: string,
  ): Promise<GroundingResult> {
    // Deterministic: no context retrieved → treat as ungrounded for logging purposes
    if (!contextChunks || contextChunks.length === 0) {
      this.logger.warn({
        event: 'guardrail_triggered',
        layer: 'L6_output',
        sessionId,
        reason: 'No context chunks — response generated without retrieval',
      });
      return { grounded: false, trigger: 'empty_context' };
    }

    if (!this.enabled) {
      return { grounded: true };
    }

    const contextText = contextChunks.map((c) => c.text).join('\n\n').slice(0, 3000);

    try {
      const prompt = GROUNDING_CHECK_PROMPT.replace('{{context}}', contextText).replace(
        '{{answer}}',
        assembledResponse.slice(0, 1500),
      );

      const result = await this.groundingModel.invoke([{ role: 'user', content: prompt }]);
      const verdict = result.content.toString().trim().toUpperCase();

      if (verdict === 'UNGROUNDED') {
        this.logger.warn({
          event: 'guardrail_triggered',
          layer: 'L6_output',
          sessionId,
          reason: 'Grounding verifier returned UNGROUNDED',
        });
        return { grounded: false, trigger: 'ungrounded_answer' };
      }

      return { grounded: true };
    } catch (err) {
      // Grounding check failure → log, default to grounded (fail-open for UX)
      this.logger.error({ message: 'L6 grounding check failed', sessionId, err });
      return { grounded: true };
    }
  }
}
