import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// pdf-parse v1 is a plain CJS function — import via require to avoid ESM interop issues.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse');
import { ChromaService } from 'src/modules/ai/services/chroma.service';

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

  constructor(private readonly chromaService: ChromaService) {}

  /**
   * Full ingestion pipeline: read file → extract text → split → add to Chroma.
   * Chroma handles embedding internally via OpenAIEmbeddings (configured in ChromaService).
   *
   * @param filePath    Absolute path to the uploaded file on disk.
   * @param mimeType    MIME type used to choose the text extractor.
   * @param documentId  DB id stored in each chunk's metadata for later deletion.
   * @param collection  Chroma collection name.
   * @param sourceName  Original filename stored in each chunk's metadata.
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

    // 3. Build chunk objects with metadata and stable IDs
    const docs = chunks.map((chunkText, index) => ({
      text: chunkText,
      metadata: {
        documentId,
        chunkIndex: index,
        source: sourceName,
      } as Record<string, unknown>,
    }));

    const ids = chunks.map((_, index) => this.chunkId(documentId, index));

    // 4. Add to Chroma — embedding is handled by ChromaService internally
    await this.chromaService.addDocuments(docs, ids, collection);
    this.logger.log(`Document ${documentId}: added ${docs.length} chunks to "${collection}"`);

    return { chunkCount: docs.length };
  }

  /**
   * Remove all Chroma chunks for a given document.
   */
  async deleteFromVectorStore(documentId: number, collection: string): Promise<void> {
    await this.chromaService.deleteByDocumentId(documentId, collection);
    this.logger.log(`Document ${documentId}: chunks deleted from "${collection}"`);
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
   * Stable string chunk ID — ChromaDB requires string IDs.
   */
  private chunkId(documentId: number, chunkIndex: number): string {
    return `doc-${documentId}-chunk-${chunkIndex}`;
  }
}
