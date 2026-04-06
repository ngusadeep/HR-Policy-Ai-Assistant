import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { DocumentRepository } from './repositories/document.repository';
import { IngestionService } from './services/ingestion.service';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { AiModule } from 'src/modules/ai/ai.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    AiModule,
    UsersModule,
  ],
  providers: [DocumentRepository, IngestionService, DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService, IngestionService],
})
export class DocumentsModule {}
