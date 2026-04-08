import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from 'src/modules/chat/entities/chat-session.entity';
import { Message } from 'src/modules/chat/entities/message.entity';
import type { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class ChatSessionRepository {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async findOrCreate(sessionId: string, user: User | null, collection: string): Promise<ChatSession> {
    const existing = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (existing) return existing;

    const session = this.sessionRepo.create({ id: sessionId, collection, user });
    return this.sessionRepo.save(session);
  }

  async appendMessages(
    session: ChatSession,
    turns: Array<{ role: 'user' | 'assistant'; content: string; langsmithRunId?: string }>,
  ): Promise<void> {
    const entities = turns.map((t) =>
      this.messageRepo.create({
        role: t.role,
        content: t.content,
        langsmithRunId: t.langsmithRunId ?? null,
        session,
      }),
    );
    await this.messageRepo.save(entities);
  }

  getHistory(sessionId: string): Promise<Message[]> {
    return this.messageRepo.find({
      where: { session: { id: sessionId } },
      order: { createdAt: 'ASC' },
    });
  }
}
