import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from 'src/modules/documents/entities/document.entity';
import { User, UserStatus } from 'src/modules/users/entities/user.entity';
import { Message } from 'src/modules/chat/entities/message.entity';
import { ChatSession } from 'src/modules/chat/entities/chat-session.entity';

export interface RecentQueryItem {
  sessionId: string;
  question: string;
  askedAt: string;
}

export interface RecentDocumentItem {
  id: number;
  name: string;
  status: DocumentStatus;
  chunkCount: number;
  uploadedBy: string | null;
  uploadedAt: string;
}

export interface DashboardStats {
  documentCount: number;
  indexedDocumentCount: number;
  queryThisMonth: number;
  activeUserCount: number;
  recentDocuments: RecentDocumentItem[];
  recentQueries: RecentQueryItem[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,

    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      documentCount,
      indexedDocumentCount,
      queryThisMonth,
      activeUserCount,
      recentDocuments,
      recentQueries,
    ] = await Promise.all([
      // Total documents
      this.documentRepo.count(),

      // Indexed documents
      this.documentRepo.count({ where: { status: DocumentStatus.INDEXED } }),

      // User messages this month (= queries sent to the AI)
      this.messageRepo
        .createQueryBuilder('m')
        .where('m.role = :role', { role: 'user' })
        .andWhere('m.created_at >= :start', { start: startOfMonth })
        .getCount(),

      // Active users
      this.userRepo.count({ where: { status: UserStatus.ACTIVE } }),

      // Last 5 documents
      this.documentRepo.find({
        relations: ['uploadedBy'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),

      // Last 5 user messages (recent queries)
      this.messageRepo.find({
        where: { role: 'user' },
        relations: ['session'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      documentCount,
      indexedDocumentCount,
      queryThisMonth,
      activeUserCount,
      recentDocuments: recentDocuments.map((d) => ({
        id: d.id,
        name: d.originalName,
        status: d.status,
        chunkCount: d.chunkCount,
        uploadedBy: d.uploadedBy
          ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}`
          : null,
        uploadedAt: d.createdAt.toISOString(),
      })),
      recentQueries: recentQueries.map((m) => ({
        sessionId: m.session.id,
        question: m.content,
        askedAt: m.createdAt.toISOString(),
      })),
    };
  }
}
