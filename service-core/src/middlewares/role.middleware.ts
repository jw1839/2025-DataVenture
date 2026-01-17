/**
 * 역할 기반 접근 제어 미들웨어
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

/**
 * 특정 역할만 허용하는 미들웨어 팩토리
 * @param allowedRoles 허용된 역할 배열
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('권한이 없습니다.', 403);
    }

    next();
  };
};

/**
 * 구직자 전용 미들웨어
 */
export const requireCandidate = requireRole('CANDIDATE');

/**
 * 채용담당자 전용 미들웨어
 */
export const requireRecruiter = requireRole('RECRUITER');

/**
 * 관리자 전용 미들웨어
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * 구직자 또는 채용담당자 미들웨어
 */
export const requireCandidateOrRecruiter = requireRole('CANDIDATE', 'RECRUITER');

