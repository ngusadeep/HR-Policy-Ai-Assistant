import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

export type MessageRole = 'user' | 'assistant';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  /** LangSmith run ID — for correlating this message to its trace (never sent to client). */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'langsmith_run_id' })
  langsmithRunId: string | null;

  @ManyToOne(() => ChatSession, (s) => s.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
