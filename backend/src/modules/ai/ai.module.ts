import { Module } from '@nestjs/common';
import { EmbeddingsService } from './services/embeddings.service';
import { QdrantService } from './services/qdrant.service';

@Module({
  providers: [EmbeddingsService, QdrantService],
  exports: [EmbeddingsService, QdrantService],
})
export class AiModule {}
