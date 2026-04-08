import { createHash } from 'crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 500;

interface CacheEntry {
  vector: number[];
  expiresAt: number;
}

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private embeddings: OpenAIEmbeddings;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Wire LangSmith tracing via environment variables (LangChain reads these automatically)
    const langsmithKey = this.configService.get<string>('langsmith.apiKey', '');
    const tracing = this.configService.get<boolean>('langsmith.tracing', false);
    if (tracing && langsmithKey) {
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
   * Embed a single query string.
   * Results are cached in-memory by SHA-256 hash of the text (TTL: 5 min, max: 500 entries).
   * Identical repeated queries skip the OpenAI API call entirely.
   */
  async embedQuery(text: string): Promise<number[]> {
    const key = createHash('sha256').update(text).digest('hex');
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug({ message: 'Embedding cache hit', key: key.slice(0, 8) });
      return cached.vector;
    }

    const vector = await this.embeddings.embedQuery(text);

    // Evict oldest entry when at capacity
    if (this.cache.size >= CACHE_MAX_SIZE) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(key, { vector, expiresAt: Date.now() + CACHE_TTL_MS });
    return vector;
  }
}
