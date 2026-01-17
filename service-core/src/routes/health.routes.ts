/**
 * 헬스 체크 라우트
 * 
 * Docker 헬스 체크, 로드 밸런서, 모니터링 시스템 사용
 */

import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

/**
 * 기본 헬스 체크
 * GET /health
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'service-core',
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * 상세 헬스 체크 (DB 연결 포함)
 * GET /health/detailed
 */
router.get('/health/detailed', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // 데이터베이스 연결 확인
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'service-core',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'up',
          responseTime: `${responseTime}ms`,
        },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
        uptime: `${Math.round(process.uptime())}s`,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'service-core',
      error: 'Database connection failed',
    });
  }
});

/**
 * Readiness 체크 (서비스가 트래픽을 받을 준비가 되었는지)
 * GET /health/ready
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // DB 연결 확인
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Liveness 체크 (프로세스가 살아있는지)
 * GET /health/live
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;

