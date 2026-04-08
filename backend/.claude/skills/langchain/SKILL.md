# SKILL: LangChain.js Patterns

Situational intelligence for working with LangChain.js in this NestJS RAG project.

## Core Import Map
```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { traceable } from 'langsmith/traceable';
import { Client as LangSmithClient } from 'langsmith';
```

## RAG Chain (full pattern)
```typescript
const retriever = RunnableLambda.from(async (query: string) =>
  this.retrieverService.retrieve(query, tenantId, { topK })
);

const formatDocs = (docs: Document[]) =>
  docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join('\n\n');

const ragChain = RunnableSequence.from([
  {
    context: retriever.pipe(formatDocs),
    question: new RunnablePassthrough(),
    chat_history: () => chatHistory, // from DB
  },
  prompt,
  llm,
  new StringOutputParser(),
]);

// Stream tokens
const stream = await ragChain.stream(userQuery);
```

## Streaming with Callbacks (for WebSocket emit)
```typescript
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';

class WsStreamingHandler extends BaseCallbackHandler {
  name = 'WsStreamingHandler';
  constructor(private readonly socket: Socket) { super(); }

  handleLLMNewToken(token: string) {
    this.socket.emit('token', { token });
  }

  handleLLMEnd() {
    this.socket.emit('done');
  }

  handleLLMError(err: Error) {
    this.socket.emit('error', { message: err.message });
  }
}

// Usage
await ragChain.invoke(query, { callbacks: [new WsStreamingHandler(client)] });
```

## Chat History (TypeORM → LangChain messages)
```typescript
const messages = await this.messageRepo.find({ where: { session: { id: sessionId } }, order: { createdAt: 'ASC' } });

const chatHistory = messages.map(m =>
  m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
);
```

## Document Ingestion Pipeline
```typescript
// Chunking
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' '],
});
const chunks = await splitter.createDocuments([rawText], [{ source, tenantId }]);

// Embedding
const vectors = await embeddings.embedDocuments(chunks.map(c => c.pageContent));

// Add to Chroma (always batch — Chroma handles embedding internally)
await this.chromaService.addDocuments(
  chunks.map((c, i) => ({ text: c.pageContent, metadata: c.metadata })),
  chunks.map((_, i) => `doc-${documentId}-chunk-${i}`),
  collection,
);
```

## LangSmith Run Saving (for correlating with DB messages)
```typescript
const runId = crypto.randomUUID();
await ragChain.invoke(query, {
  callbacks: [new LangSmithClient().createRunTree({ name: 'rag-pipeline', run_type: 'chain', id: runId })],
});
// Save runId to message entity for trace correlation
await this.messageRepo.save({ ...messageData, langsmithRunId: runId });
```
