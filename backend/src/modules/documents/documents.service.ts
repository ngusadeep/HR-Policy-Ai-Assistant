import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentRepository } from './repositories/document.repository';
import { DocumentStatus } from './entities/document.entity';
import { DocumentResponseDto } from './dto/document-response.dto';
import { IngestionService } from './services/ingestion.service';
import type { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly ingestionService: IngestionService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Save file metadata to DB, then run the ingestion pipeline asynchronously.
   * Returns the DB record immediately (status=processing); ingestion continues in background.
   */
  async upload(
    file: Express.Multer.File,
    collection: string,
    uploadedBy: User,
  ): Promise<DocumentResponseDto> {
    // Create DB record
    const doc = await this.documentRepository.save({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storedPath: file.path,
      collection,
      status: DocumentStatus.PROCESSING,
      chunkCount: 0,
      uploadedBy,
    });

    // Run ingestion in background (no await) so the HTTP response returns immediately
    this.runIngestion(doc.id, file.path, file.mimetype, collection, file.originalname).catch(
      (err: unknown) => this.logger.error(`Background ingestion failed for doc ${doc.id}`, err),
    );

    const created = await this.documentRepository.findByIdWithUploader(doc.id);
    return new DocumentResponseDto(created!);
  }

  async findAll(): Promise<DocumentResponseDto[]> {
    const docs = await this.documentRepository.findAllWithUploader();
    return docs.map((d) => new DocumentResponseDto(d));
  }

  async findOne(id: number): Promise<DocumentResponseDto> {
    const doc = await this.documentRepository.findByIdWithUploader(id);
    if (!doc) throw new NotFoundException(`Document not found: ${id}`);
    return new DocumentResponseDto(doc);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const doc = await this.documentRepository.findByIdWithUploader(id);
    if (!doc) throw new NotFoundException(`Document not found: ${id}`);

    // Remove vectors from Qdrant
    try {
      await this.ingestionService.deleteFromVectorStore(id, doc.collection);
    } catch (err) {
      this.logger.warn(`Could not delete Qdrant vectors for doc ${id}:`, err);
    }

    // Remove file from disk
    try {
      if (fs.existsSync(doc.storedPath)) fs.unlinkSync(doc.storedPath);
    } catch (err) {
      this.logger.warn(`Could not delete file for doc ${id}:`, err);
    }

    const deleted = await this.documentRepository.deleteById(id);
    return { deleted };
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async runIngestion(
    docId: number,
    filePath: string,
    mimeType: string,
    collection: string,
    sourceName: string,
  ): Promise<void> {
    try {
      const { chunkCount } = await this.ingestionService.ingest(
        filePath,
        mimeType,
        docId,
        collection,
        sourceName,
      );
      await this.documentRepository.save({
        id: docId,
        status: DocumentStatus.INDEXED,
        chunkCount,
        errorMessage: null,
      });
      this.logger.log(`Document ${docId} indexed: ${chunkCount} chunks`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.documentRepository.save({
        id: docId,
        status: DocumentStatus.FAILED,
        errorMessage: message,
      });
      this.logger.error(`Document ${docId} ingestion failed: ${message}`);
    }
  }
}
