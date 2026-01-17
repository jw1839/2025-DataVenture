/**
 * flex-AI-Recruiter - Core API (Node.js + Express)
 * Service 1: 사용자 인증, CRUD, Socket.IO 실시간 채팅
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// 미들웨어
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// 라우터
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import interviewRoutes from './routes/interview.routes';
import evaluationRoutes from './routes/evaluation.routes';
import jobPostingRoutes from './routes/jobPosting.routes';
import applicationRoutes from './routes/application.routes';
import dashboardRoutes from './routes/dashboard.routes';
import recommendationRoutes from './routes/recommendation.routes';
import healthRoutes from './routes/health.routes';

// Sprint 8-9 신규 라우터
import candidateProfileRoutes from './routes/profile/candidate';
import recruiterProfileRoutes from './routes/profile/recruiter';
import newInterviewRoutes from './routes/interview';
import newEvaluationRoutes from './routes/evaluation';
import notificationRoutes from './routes/notification';
import searchRoutes from './routes/search';
import uploadRoutes from './routes/upload';

// 환경 변수 로딩
dotenv.config();

// Prisma Client 초기화
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Express 앱 생성
const app: Express = express();
const httpServer = createServer(app);

// Socket.IO 서버 생성
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ===== Middleware =====
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
// 보안 헤더
app.use(helmet());
// 요청 제한 (기본 15분 1000회)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 1000),
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 업로드된 파일 정적 제공
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 요청 로깅 (개발 환경)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ===== Health Check =====
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'flex-AI-Recruiter Core API',
    status: 'healthy',
    version: '0.1.0',
  });
});

app.use('/', healthRoutes);

// ===== API 라우터 =====
// 기존 라우터
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/evaluations', evaluationRoutes);
app.use('/api/v1/jobs', jobPostingRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);

// Sprint 8-9 신규 라우터
app.use('/api/v1/profile/candidate', candidateProfileRoutes);
app.use('/api/v1/profile/recruiter', recruiterProfileRoutes);
app.use('/api/v1/interview', newInterviewRoutes);
app.use('/api/v1/evaluation', newEvaluationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Socket.IO 핸들러
import { registerInterviewHandlers } from './socket/interview.handler';

// ===== Socket.IO 이벤트 핸들러 =====
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // 인터뷰 이벤트 핸들러 등록
  registerInterviewHandlers(socket);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ===== 에러 핸들링 =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== 서버 시작 =====
const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  flex-AI-Recruiter Core API                          ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║  Port: ${PORT}                                        ║
║  Socket.IO: Enabled                                   ║
║  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not Configured'}                                ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n[Shutdown] Closing server gracefully...');
  
  // Socket.IO 연결 종료
  io.close(() => {
    console.log('[Shutdown] Socket.IO closed');
  });

  // HTTP 서버 종료
  httpServer.close(() => {
    console.log('[Shutdown] HTTP server closed');
  });

  // Prisma 연결 종료
  await prisma.$disconnect();
  console.log('[Shutdown] Database disconnected');

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
