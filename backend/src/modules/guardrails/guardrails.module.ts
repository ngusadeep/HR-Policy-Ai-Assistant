import { Module } from '@nestjs/common';
import { InputGuard } from './guards/input.guard';
import { ContextGuard } from './guards/context.guard';
import { PromptGuard } from './guards/prompt.guard';
import { ResponseFilter } from './filters/response.filter';
import { GuardrailsService } from './guardrails.service';

@Module({
  providers: [InputGuard, ContextGuard, PromptGuard, ResponseFilter, GuardrailsService],
  exports: [GuardrailsService],
})
export class GuardrailsModule {}
