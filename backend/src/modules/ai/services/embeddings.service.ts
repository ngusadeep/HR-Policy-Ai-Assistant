import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Wire LangSmith tracing via environment variables (LangChain reads these automatically)
    const langsmithKey = this.configService.get<string>('langsmith.apiKey', '');
    const tracing = this.configService.get<boolean>('langsmith.tracing', false);
    if (tracing && langsmithKey) {
      // LangChain SDK reads these specific env var names
      process.env['LANGCHAIN_API_KEY'] = langsmithKey;
      process.env['LANGCHAIN_TRACING_V2'] = 'true';
      process.env['LANGCHAIN_PROJECT'] = this.configService.get<string>('langsmith.project', 'hr-policy-assistant');
      process.env['LANGCHAIN_ENDPOINT'] = this.configService.get<string>('langsmith.endpoint', 'https://api.smith.langchain.com');
    }

    this.embeddings = new OpenAIEmbeddings({
      apiKey: this.configService.getOrThrow<string>('openai.apiKey'),
      model: this.configService.get<string>('openai.embeddingModel', 'text-embedding-3-small'),
    });
  }

  /**
   * Embed a list of text chunks in one batched API call.
   * Returns a vector (number[]) for each input string.
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }

  /**
   * Embed a single query string (used at query time).
   */
  async embedQuery(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }
}
