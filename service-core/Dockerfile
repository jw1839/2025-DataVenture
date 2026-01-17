# Node.js 기반 Backend Core API Dockerfile
FROM node:20-slim AS base

# Prisma를 위한 OpenSSL 및 필수 라이브러리 설치
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 의존성 설치 단계
FROM base AS deps
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./
COPY prisma ./prisma/

# 의존성 설치
RUN npm ci

# Prisma Client 생성
RUN npx prisma generate

# 빌드 단계
FROM base AS builder
WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# TypeScript 빌드
RUN npm run build

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 실행 단계
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 보안을 위한 non-root 사용자 생성 (Debian)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /bin/bash expressjs

# 빌드된 파일과 필요한 의존성 복사
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=expressjs:nodejs /app/prisma ./prisma

USER expressjs

EXPOSE 8080

ENV PORT=8080

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]

