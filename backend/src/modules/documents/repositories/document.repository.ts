import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Document } from '../entities/document.entity';

@Injectable()
export class DocumentRepository extends BaseRepository<Document> {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {
    super(documentRepository);
  }

  async findAllWithUploader(): Promise<Document[]> {
    return this.documentRepository.find({
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdWithUploader(id: number): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });
  }
}
