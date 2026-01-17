/**
 * CSRF (Cross-Site Request Forgery) 방어 미들웨어
 * 
 * SameSite 쿠키와 Origin/Referer 검증을 통한 CSRF 공격 방어
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 허용된 Origin 목록
 * 환경 변수에서 로드하거나 기본값 사용
 */
const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (origins) {
    return origins.split(',').map(o => o.trim());
  }
  
  // 기본 허용 Origin
  return [
    'http://localhost:3000',  // 로컬 개발
    'http://localhost:8080',  // service-core
    'https://flex-ai-recruiter.vercel.app',  // 프로덕션 (예시)
  ];
};

/**
 * Origin 검증 미들웨어
 * 
 * HTTP 요청의 Origin 또는 Referer 헤더를 검증하여
 * 허용된 출처에서만 요청을 수락한다.
 */
export const verifyOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // GET, HEAD, OPTIONS는 CSRF 공격 대상이 아니므로 통과
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const allowedOrigins = getAllowedOrigins();

  // Origin 또는 Referer가 없으면 거부 (일부 브라우저에서는 없을 수 있음)
  if (!origin && !referer) {
    console.warn('[CSRF] Origin/Referer 헤더가 없습니다:', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    
    // 개발 환경에서는 경고만 출력하고 통과
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    return res.status(403).json({
      error: 'CSRF 검증 실패: Origin 헤더가 필요합니다.',
    });
  }

  // Origin 또는 Referer가 허용 목록에 있는지 확인
  const requestOrigin = origin || (referer ? new URL(referer).origin : '');
  
  if (!allowedOrigins.includes(requestOrigin)) {
    console.warn('[CSRF] 허용되지 않은 Origin:', {
      requestOrigin,
      allowedOrigins,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    
    return res.status(403).json({
      error: 'CSRF 검증 실패: 허용되지 않은 출처입니다.',
    });
  }

  // 검증 통과
  next();
};

/**
 * CSRF 토큰 기반 검증 (향후 구현)
 * 
 * 더 강력한 CSRF 방어가 필요한 경우 토큰 기반 검증 추가 가능
 * 예: csurf 라이브러리 사용
 */

/*
import csrf from 'csurf';

// CSRF 토큰 생성 미들웨어
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

// CSRF 토큰을 응답에 포함하는 헬퍼
export const setCsrfToken = (req: Request, res: Response) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false,  // JavaScript에서 읽을 수 있어야 함
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};
*/

/**
 * 쿠키 보안 옵션
 * 
 * JWT를 쿠키에 저장하는 경우 사용
 */
export const secureCookieOptions = {
  httpOnly: true,  // JavaScript에서 접근 불가 (XSS 방어)
  secure: process.env.NODE_ENV === 'production',  // HTTPS 전용
  sameSite: 'strict' as const,  // CSRF 방어
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7일
};

