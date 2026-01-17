/**
 * 전역 에러 핸들링 미들웨어
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 커스텀 에러 클래스
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 전역 에러 핸들러
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // AppError인 경우
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Prisma 에러 처리
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // 유니크 제약 조건 위반 (중복 이메일 등)
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        error: 'Conflict',
        message: '이미 존재하는 데이터입니다.',
        field: prismaError.meta?.target,
      });
      return;
    }

    // 레코드를 찾을 수 없음
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        error: 'Not Found',
        message: '요청한 데이터를 찾을 수 없습니다.',
      });
      return;
    }
  }

  // 기본 에러 응답
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 핸들러
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `경로를 찾을 수 없습니다: ${req.method} ${req.path}`,
  });
};

