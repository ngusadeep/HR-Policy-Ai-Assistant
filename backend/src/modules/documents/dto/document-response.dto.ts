import type { Document } from '../entities/document.entity';

export class DocumentResponseDto {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  collection: string;
  status: string;
  chunkCount: number;
  errorMessage: string | null;
  uploadedBy: { id: number; firstName: string; lastName: string } | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(doc: Document) {
    this.id = doc.id;
    this.originalName = doc.originalName;
    this.mimeType = doc.mimeType;
    this.size = doc.size;
    this.collection = doc.collection;
    this.status = doc.status;
    this.chunkCount = doc.chunkCount;
    this.errorMessage = doc.errorMessage;
    this.uploadedBy = doc.uploadedBy
      ? { id: doc.uploadedBy.id, firstName: doc.uploadedBy.firstName, lastName: doc.uploadedBy.lastName }
      : null;
    this.createdAt = doc.createdAt;
    this.updatedAt = doc.updatedAt;
  }
}
