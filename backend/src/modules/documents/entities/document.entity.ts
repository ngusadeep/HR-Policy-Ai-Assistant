import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

export enum DocumentStatus {
  PROCESSING = 'processing',
  INDEXED = 'indexed',
  FAILED = 'failed',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  /** Original filename as uploaded by the user. */
  @Column()
  originalName: string;

  /** MIME type (application/pdf, text/plain, text/markdown). */
  @Column()
  mimeType: string;

  /** File size in bytes. */
  @Column({ type: 'int' })
  size: number;

  /** Path on disk where the file is stored (relative to uploads dir). */
  @Column()
  storedPath: string;

  /** Chroma collection the chunks were ingested into. */
  @Column({ default: 'hr_policies' })
  collection: string;

  /** Current ingestion status. */
  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PROCESSING })
  status: DocumentStatus;

  /** Number of chunks ingested into Chroma (0 while processing). */
  @Column({ default: 0 })
  chunkCount: number;

  /** Error detail if ingestion failed. */
  @Column({ nullable: true, type: 'text' })
  errorMessage: string | null;

  /** Admin who uploaded this document. */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  uploadedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
