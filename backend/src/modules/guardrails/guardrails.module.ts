import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InputGuard } from './guards/input.guard';
import { ContextGuard } from './guards/context.guard';
import { PromptGuard } from './guards/prompt.guard';
import { ResponseFilter } from './filters/response.filter';
import { OutputGuard } from './guards/output.guard';
import { GuardrailsService } from './guardrails.service';

@Module({
  imports: [ConfigModule],
  providers: [InputGuard, ContextGuard, PromptGuard, ResponseFilter, OutputGuard, GuardrailsService],
  exports: [GuardrailsService],
})
export class GuardrailsModule {}
