import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface QdrantPoint {
  id: string | number;
  vector: number[];
  payload: Record<string, unknown>;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private defaultCollection: string;
  private vectorSize: number;
  private url: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.url = this.configService.getOrThrow<string>('qdrant.url');
    this.client = new QdrantClient({
      url: this.url,
    });
    this.defaultCollection = this.configService.get<string>('qdrant.collection', 'hr_policies');
    this.vectorSize = this.configService.get<number>('qdrant.vectorSize', 1536);
  }

  /**
   * Creates a Qdrant collection if it does not already exist.
   */
  async ensureCollection(name?: string): Promise<void> {
    const collection = name ?? this.defaultCollection;
    try {
      await this.client.getCollection(collection);
    } catch (error: unknown) {
      if (!this.isCollectionMissingError(error)) {
        throw this.wrapError('reach Qdrant while checking the collection', error);
      }

      this.logger.log(`Creating Qdrant collection: ${collection}`);
      try {
        await this.client.createCollection(collection, {
          vectors: { size: this.vectorSize, distance: 'Cosine' },
        });
      } catch (createError: unknown) {
        throw this.wrapError(`create Qdrant collection "${collection}"`, createError);
      }
    }
  }

  /**
   * Upsert a batch of pre-computed vector points into the collection.
   */
  async upsert(points: QdrantPoint[], collection?: string): Promise<void> {
    const col = collection ?? this.defaultCollection;
    await this.ensureCollection(col);
    try {
      await this.client.upsert(col, {
        wait: true,
        points: points.map((p) => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload,
        })),
      });
    } catch (error: unknown) {
      throw this.wrapError(`upsert vectors into Qdrant collection "${col}"`, error);
    }
  }

  /**
   * Delete all vector points belonging to a specific document.
   */
  async deleteByDocumentId(documentId: number, collection?: string): Promise<void> {
    const col = collection ?? this.defaultCollection;
    try {
      await this.client.delete(col, {
        wait: true,
        filter: {
          must: [{ key: 'documentId', match: { value: documentId } }],
        },
      });
    } catch (error: unknown) {
      throw this.wrapError(
        `delete document ${documentId} vectors from Qdrant collection "${col}"`,
        error,
      );
    }
  }

  /**
   * Search for nearest neighbours to the query vector.
   * Results below `scoreThreshold` are discarded by Qdrant before returning.
   */
  async search(
    queryVector: number[],
    limit = 6,
    collection?: string,
    scoreThreshold?: number,
    filter?: Record<string, unknown>,
  ) {
    const col = collection ?? this.defaultCollection;
    const threshold =
      scoreThreshold ?? this.configService.get<number>('qdrant.scoreThreshold', 0.4);
    // Ensure collection exists before searching (avoids 404 when no docs uploaded yet)
    await this.ensureCollection(col);
    try {
      return await this.client.search(col, {
        vector: queryVector,
        limit,
        score_threshold: threshold,
        with_payload: true,
        ...(filter ? { filter } : {}),
      });
    } catch (error: unknown) {
      throw this.wrapError(`search Qdrant collection "${col}"`, error);
    }
  }

  private isCollectionMissingError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const candidate = error as { status?: unknown; message?: unknown };
    return (
      candidate.status === 404 ||
      (typeof candidate.message === 'string' &&
        candidate.message.toLowerCase().includes('not found'))
    );
  }

  private wrapError(action: string, error: unknown): Error {
    const detail = error instanceof Error ? error.message : String(error);
    return new Error(
      `Unable to ${action}. Check that Qdrant is running and reachable at ${this.url}. ` +
        `Original error: ${detail}`,
    );
  }
}
