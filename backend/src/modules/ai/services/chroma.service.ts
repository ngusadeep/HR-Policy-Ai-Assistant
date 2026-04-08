import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

export interface ChromaSearchResult {
  payload: Record<string, unknown>;
  /** Cosine similarity in [0, 1] — higher is more relevant. */
  score: number;
}

/**
 * ChromaService wraps LangChain's Chroma vector store.
 *
 * Two operations:
 *   - addDocuments()  : ingestion — Chroma embeds text internally via OpenAIEmbeddings.
 *   - searchByVector(): retrieval — accepts a pre-computed query vector (from
 *                        EmbeddingsService with its in-memory cache) and calls
 *                        similaritySearchVectorWithScore() so no second embed happens.
 *
 * Score note: LangChain Chroma returns raw cosine *distance* (0 = identical,
 * 1 = orthogonal) from similaritySearchVectorWithScore().
 * We convert: similarity = 1 − distance, then apply the configured threshold.
 */
@Injectable()
export class ChromaService implements OnModuleInit {
  private readonly logger = new Logger(ChromaService.name);
  private embeddings: OpenAIEmbeddings;
  private defaultCollection: string;
  private chromaUrl: string;
  private scoreThreshold: number;

  // One Chroma instance per collection name, created on first use.
  private readonly stores = new Map<string, Chroma>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.chromaUrl = this.configService.getOrThrow<string>('chroma.url');
    this.defaultCollection = this.configService.get<string>('chroma.collection', 'hr_policies');
    this.scoreThreshold = this.configService.get<number>('chroma.scoreThreshold', 0.6);

    this.embeddings = new OpenAIEmbeddings({
      apiKey: this.configService.getOrThrow<string>('openai.apiKey'),
      model: this.configService.get<string>('openai.embeddingModel', 'text-embedding-3-small'),
    });

    this.logger.log(`ChromaService ready — server: ${this.chromaUrl}`);
  }

  /**
   * Return the Chroma vector store for a collection, creating it on first use.
   * Collections are created with cosine distance (hnsw:space = cosine).
   */
  private getStore(collection: string): Chroma {
    const existing = this.stores.get(collection);
    if (existing) return existing;

    const store = new Chroma(this.embeddings, {
      collectionName: collection,
      url: this.chromaUrl,
      collectionMetadata: { 'hnsw:space': 'cosine' },
    });

    this.logger.log(`Chroma: initialised store for collection "${collection}"`);
    this.stores.set(collection, store);
    return store;
  }

  /**
   * Add document chunks to the vector store.
   * Chroma embeds the text internally — no pre-computed vectors needed.
   *
   * @param chunks   Array of { text, metadata } objects — one per chunk.
   * @param ids      Stable string IDs (e.g. "doc-{documentId}-chunk-{index}").
   * @param collection  Target collection name.
   */
  async addDocuments(
    chunks: Array<{ text: string; metadata: Record<string, unknown> }>,
    ids: string[],
    collection?: string,
  ): Promise<void> {
    const col = collection ?? this.defaultCollection;
    const store = this.getStore(col);

    const docs: Document[] = chunks.map((c) => ({
      pageContent: c.text,
      metadata: c.metadata,
    }));

    this.logger.log(`Chroma: upserting ${docs.length} chunks into collection "${col}"`);
    await store.addDocuments(docs, { ids });
    this.logger.log(`Chroma: upsert complete — ${docs.length} chunks stored in "${col}"`);
  }

  /**
   * Search using a pre-computed query vector (supplied by EmbeddingsService).
   * Results below the configured score threshold are discarded.
   */
  async searchByVector(
    queryVector: number[],
    limit = 6,
    collection?: string,
    scoreThreshold?: number,
  ): Promise<ChromaSearchResult[]> {
    const store = this.getStore(collection ?? this.defaultCollection);
    const threshold = scoreThreshold ?? this.scoreThreshold;

    // Fetch extra so threshold filtering doesn't cut us short.
    const raw: [Document, number][] = await store.similaritySearchVectorWithScore(
      queryVector,
      limit * 2,
    );

    return raw
      .map(([doc, distance]) => ({
        payload: { ...doc.metadata, text: doc.pageContent } as Record<string, unknown>,
        score: 1 - distance, // cosine distance → similarity
      }))
      .filter((r) => r.score >= threshold)
      .slice(0, limit);
  }

  /**
   * Delete all chunks belonging to a specific document by metadata filter.
   */
  async deleteByDocumentId(documentId: number, collection?: string): Promise<void> {
    const store = this.getStore(collection ?? this.defaultCollection);
    await store.delete({ filter: { documentId } });
  }
}
