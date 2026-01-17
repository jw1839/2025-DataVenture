/**
 * JWT 인증 미들웨어
 * 요청 헤더의 JWT 토큰을 검증하고, req 객체에 사용자 정보를 추가한다.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';

/**
 * Express Request 타입 확장
 * req.user에 인증된 사용자 정보를 담기 위함
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT 인증 미들웨어
 * Authorization 헤더의 Bearer 토큰을 검증한다.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Authorization 헤더에서 토큰 추출
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '인증 토큰이 제공되지 않았습니다.',
      });
      return;
    }

    // 토큰 검증
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '유효하지 않거나 만료된 토큰입니다.',
      });
      return;
    }

    // req 객체에 사용자 정보 추가
    req.user = payload;

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '인증 처리 중 오류가 발생했습니다.',
    });
  }
};

/**
 * 역할 기반 접근 제어 미들웨어
 * 특정 역할을 가진 사용자만 접근 가능하도록 제한한다.
 * @param allowedRoles 허용된 역할 목록
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '인증이 필요합니다.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: '접근 권한이 없습니다.',
      });
      return;
    }

    next();
  };
};

/**
 * authenticateToken - authenticate의 별칭
 * Sprint 8-9에서 일관성을 위해 추가
 */
export const authenticateToken = authenticate;

