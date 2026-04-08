import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Document } from 'src/modules/documents/entities/document.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Message } from 'src/modules/chat/entities/message.entity';
import { ChatSession } from 'src/modules/chat/entities/chat-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, User, Message, ChatSession])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
