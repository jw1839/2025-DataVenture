/**
 * Prisma Client 싱글톤 패턴
 * 모든 컨트롤러에서 동일한 Prisma 인스턴스 사용
 */

import { PrismaClient } from '@prisma/client';

// Prisma 클라이언트 싱글톤 인스턴스
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 종료 시 Prisma 연결 정리
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

