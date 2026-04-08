import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permissions.guard';
import { ChatSession } from './entities/chat-session.entity';
import { Message } from './entities/message.entity';

export interface SessionSummary {
  id: string;
  collection: string;
  createdAt: string;
  updatedAt: string;
  /** First user message — used as the thread title in the sidebar. */
  firstQuestion: string | null;
  /** Total message count. */
  messageCount: number;
}

export interface MessageDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

@ApiTags('Chat')
@ApiBearerAuth('JWT')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ChatController {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,

    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  @ApiOperation({ summary: 'List all chat sessions ordered by most recent' })
  @ApiResponse({ status: 200, description: 'List of session summaries' })
  @Get('sessions')
  async listSessions(): Promise<SessionSummary[]> {
    const sessions = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.messages', 'm')
      .orderBy('s.updated_at', 'DESC')
      .take(50)
      .getMany();

    return sessions.map((s) => {
      const firstQuestion =
        s.messages.find((m) => m.role === 'user')?.content ?? null;
      return {
        id: s.id,
        collection: s.collection,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        firstQuestion,
        messageCount: s.messages.length,
      };
    });
  }

  @ApiOperation({ summary: 'Get all messages for a session' })
  @ApiResponse({ status: 200, description: 'Ordered list of messages' })
  @Get('sessions/:sessionId/messages')
  async getMessages(
    @Param('sessionId') sessionId: string,
  ): Promise<MessageDto[]> {
    const messages = await this.messageRepo.find({
      where: { session: { id: sessionId } },
      order: { createdAt: 'ASC' },
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }
}
