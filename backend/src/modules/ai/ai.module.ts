import { Module } from '@nestjs/common';
import { EmbeddingsService } from './services/embeddings.service';
import { ChromaService } from './services/chroma.service';

@Module({
  providers: [EmbeddingsService, ChromaService],
  exports: [EmbeddingsService, ChromaService],
})
export class AiModule {}
