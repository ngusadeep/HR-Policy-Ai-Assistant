export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwtSecret: process.env.JWT_SECRET,
  jwtResetSecret: process.env.JWT_RESET_SECRET ?? process.env.JWT_SECRET,
  apiPrefix: process.env.API_PREFIX || 'api',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  app: {
    name: process.env.APP_NAME || 'API',
    description: process.env.APP_DESCRIPTION || 'API Description',
  },
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'your-password',
    database: process.env.DB_DATABASE || 'your-database',
    sync: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    collection: process.env.QDRANT_COLLECTION || 'hr_policies',
    vectorSize: parseInt(process.env.QDRANT_VECTOR_SIZE ?? '1536', 10),
    scoreThreshold: parseFloat(process.env.RAG_SCORE_THRESHOLD ?? '0.4'),
  },
  uploadsDir: process.env.UPLOADS_DIR || 'uploads',
  langsmith: {
    apiKey: process.env.LANGSMITH_API_KEY ?? process.env.LANGCHAIN_API_KEY ?? '',
    tracing: process.env.LANGSMITH_TRACING === 'true' || process.env.LANGCHAIN_TRACING_V2 === 'true',
    project: process.env.LANGSMITH_PROJECT ?? process.env.LANGCHAIN_PROJECT ?? 'hr-policy-assistant',
    endpoint: process.env.LANGSMITH_ENDPOINT ?? 'https://api.smith.langchain.com',
  },
  guardrails: {
    groundingCheckEnabled: process.env.GROUNDING_CHECK_ENABLED ?? 'true',
  },
});
