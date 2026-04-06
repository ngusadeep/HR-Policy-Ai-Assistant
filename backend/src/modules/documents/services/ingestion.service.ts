import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// pdf-parse v1 is a plain CJS function — import via require to avoid ESM interop issues.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse');
import { EmbeddingsService } from 'src/modules/ai/services/embeddings.service';
import { QdrantService, type QdrantPoint } from 'src/modules/ai/services/qdrant.service';

export interface IngestionResult {
  chunkCount: number;
}

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 64;

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });

  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
  ) {}

  /**
   * Full ingestion pipeline: read file → extract text → split → embed → upsert.
   *
   * @param filePath  Absolute path to the uploaded file on disk.
   * @param mimeType  MIME type used to choose the parser.
   * @param documentId  DB id used as Qdrant payload for later deletion.
   * @param collection  Qdrant collection name.
   * @param sourceName  Original filename stored in each chunk's payload.
   */
  async ingest(
    filePath: string,
    mimeType: string,
    documentId: number,
    collection: string,
    sourceName: string,
  ): Promise<IngestionResult> {
    // 1. Extract raw text
    const text = await this.extractText(filePath, mimeType);
    if (!text.trim()) {
      throw new Error('No text could be extracted from the uploaded file.');
    }

    // 2. Split into chunks
    const chunks = await this.splitter.splitText(text);
    this.logger.log(`Document ${documentId}: ${chunks.length} chunks from "${sourceName}"`);

    // 3. Embed in batches of 100 (OpenAI rate-limit friendly)
    const BATCH = 100;
    const points: QdrantPoint[] = [];

    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const vectors = await this.embeddingsService.embedDocuments(batch);

      for (let j = 0; j < batch.length; j++) {
        const vector = vectors[j];
        if (!vector) continue; // skip if embedding returned undefined
        const globalIndex = i + j;
        points.push({
          id: this.pointId(documentId, globalIndex),
          vector,
          payload: {
            documentId,
            chunkIndex: globalIndex,
            source: sourceName,
            text: batch[j] ?? '',
          },
        });
      }
    }

    // 4. Upsert into Qdrant
    await this.qdrantService.upsert(points, collection);
    this.logger.log(`Document ${documentId}: upserted ${points.length} vectors into "${collection}"`);

    return { chunkCount: points.length };
  }

  /**
   * Remove all Qdrant vectors for a given document.
   */
  async deleteFromVectorStore(documentId: number, collection: string): Promise<void> {
    await this.qdrantService.deleteByDocumentId(documentId, collection);
    this.logger.log(`Document ${documentId}: vectors deleted from "${collection}"`);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async extractText(filePath: string, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      const buffer = fs.readFileSync(filePath);
      const { text } = await pdfParse(buffer);
      return text;
    }

    // Plain text and markdown
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Generate a stable numeric Qdrant point ID from document id + chunk index.
   * Qdrant accepts 64-bit unsigned ints; we combine both values.
   */
  private pointId(documentId: number, chunkIndex: number): number {
    // Keep it within 53-bit JS safe integer range: documentId * 1_000_000 + chunkIndex
    return documentId * 1_000_000 + chunkIndex;
  }
}
