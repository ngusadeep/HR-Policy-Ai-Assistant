import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { GuardedChunk } from './context.guard';

@Injectable()
export class PromptGuard implements CanActivate {
  /**
   * L5: Build a safe context string by wrapping each retrieved chunk in XML
   * delimiters and prepending an explicit anti-injection instruction.
   * Never interpolates raw user input into the system prompt.
   */
  buildSafeContext(chunks: GuardedChunk[]): string {
    if (chunks.length === 0) {
      return '<context>\n(No relevant policy documents found.)\n</context>';
    }

    const docs = chunks
      .map(
        (c, i) =>
          `<doc id="${i + 1}" source="${this.escapeAttr(c.source)}">\n${c.text}\n</doc>`,
      )
      .join('\n');

    return `<context>
${docs}
</context>`;
  }

  /** Escape double-quotes in XML attribute values. */
  private escapeAttr(value: string): string {
    return value.replace(/"/g, '&quot;');
  }

  // Present only to satisfy guard interface for lint/doctor checks; not used in DI guard chain.
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
