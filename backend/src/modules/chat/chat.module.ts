import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatRagService } from './services/chat-rag.service';
import { AiModule } from 'src/modules/ai/ai.module';
import { GuardrailsModule } from 'src/modules/guardrails/guardrails.module';
import { ChatSession } from './entities/chat-session.entity';
import { Message } from './entities/message.entity';
import { ChatSessionRepository } from './repositories/chat-session.repository';

@Module({
  imports: [
    AiModule,
    GuardrailsModule,
    TypeOrmModule.forFeature([ChatSession, Message]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwtSecret'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, ChatRagService, ChatSessionRepository],
  exports: [ChatSessionRepository],
})
export class ChatModule {}
