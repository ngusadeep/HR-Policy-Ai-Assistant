import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsIn,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}

/** Payload validated on the 'query' WebSocket event. */
export class ChatQueryPayload {
  @IsUUID()
  sessionId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @IsString()
  collection?: string;
}

/** Server → client token event. */
export interface TokenEvent {
  type: 'token';
  sessionId: string;
  text: string;
}

/** Server → client sources event (sent after streaming finishes). */
export interface SourcesEvent {
  type: 'sources';
  sessionId: string;
  sources: Array<{ source: string; chunkIndex: number }>;
}

/** Server → client done event. */
export interface DoneEvent {
  type: 'done';
  sessionId: string;
}

/** Server → client error event. */
export interface ErrorEvent {
  type: 'error';
  sessionId: string;
  message: string;
}
