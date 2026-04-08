# Command: /deploy

Run pre-deploy checks and produce a deployment-ready build.

## Usage
```
/deploy          ← full check + build
/deploy --check  ← checks only, no build
```

## Pre-Deploy Checklist

### 1. Tests
```bash
npm run test
npm run test:e2e
```
All tests must pass. Zero failures allowed.

### 2. Lint & Type Check
```bash
npm run lint
npx tsc --noEmit
```

### 3. Security Checks
```bash
npm audit --audit-level=high
git grep -r "process\.env\." src/ --include="*.ts"  # should only be in config files
```

### 4. Migration Check
```bash
npm run migration:show  # verify pending migrations exist and are ordered correctly
```
Never deploy without running migrations first: `npm run migration:run`

### 5. Environment Variables
Verify these are set in production:
- `DATABASE_URL`
- `REDIS_URL`
- `CHROMA_URL` + `CHROMA_COLLECTION`
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- `LANGCHAIN_API_KEY` + `LANGCHAIN_PROJECT`
- `JWT_SECRET`
- `NODE_ENV=production`

### 6. Build
```bash
npm run build
```
Output: `dist/` directory.

### 7. Docker Build (if applicable)
```bash
docker build -t nestjs-rag:latest .
docker run --rm nestjs-rag:latest node dist/main.js  # smoke test
```

## DO NOT DEPLOY IF
- Any test is failing
- `npm audit` reports critical vulnerabilities
- Pending TypeORM migrations exist but haven't been run
- `LANGCHAIN_TRACING_V2=true` without `LANGCHAIN_API_KEY` set (causes silent failures)
