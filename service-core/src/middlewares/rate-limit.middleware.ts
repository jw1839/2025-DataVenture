/**
 * Rate Limiting 미들웨어
 * 
 * API 엔드포인트별로 세분화된 요청 제한을 적용하여
 * DDoS 공격 및 무분별한 API 호출을 방어한다.
 */

import rateLimit from 'express-rate-limit';

/**
 * 전역 Rate Limiter
 * 모든 요청에 적용되는 기본 제한
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 1000, // 최대 1000 요청
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true, // RateLimit-* 헤더 포함
  legacyHeaders: false, // X-RateLimit-* 헤더 제거
  skipSuccessfulRequests: false, // 성공한 요청도 카운트
});

/**
 * 인증 API Rate Limiter
 * 로그인/회원가입 등 인증 관련 엔드포인트에 적용
 * 
 * 브루트 포스 공격 방어를 위해 매우 엄격하게 제한
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // 최대 10 요청
  message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // IP 기반으로 제한
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

/**
 * 회원가입 Rate Limiter
 * 스팸 계정 생성 방지
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 5, // 최대 5 계정 생성
  message: '회원가입 시도 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * 인터뷰 시작 Rate Limiter
 * 인터뷰 세션 생성 제한
 */
export const interviewStartLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 10, // 최대 10개 인터뷰 시작
  message: '인터뷰 시작 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // 사용자 ID 기반으로 제한 (인증된 요청)
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

/**
 * AI 질문 생성 Rate Limiter
 * OpenAI API 비용 관리를 위한 제한
 */
export const aiQuestionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 30, // 최대 30 요청 (인터뷰 진행 중 빠른 응답 고려)
  message: 'AI 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * 채용 공고 생성 Rate Limiter
 * 스팸 공고 방지
 */
export const jobPostingCreateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24시간
  max: 20, // 최대 20개 공고 생성
  message: '하루 공고 생성 한도를 초과했습니다. 내일 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

/**
 * 공고 조회 Rate Limiter
 * 크롤링 방지 (상대적으로 너그럽게 설정)
 */
export const jobPostingReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 100, // 최대 100 요청
  message: '조회 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
});

/**
 * 평가 조회 Rate Limiter
 */
export const evaluationReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 50, // 최대 50 요청
  message: '평가 조회 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 추천 시스템 Rate Limiter
 * 매칭 알고리즘 호출 제한 (연산 비용이 높음)
 */
export const recommendationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10분
  max: 30, // 최대 30 요청
  message: '추천 요청이 너무 많습니다. 10분 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

/**
 * 테스트 콘솔 Rate Limiter
 * 개발/테스트 환경에서만 사용
 */
export const testConsoleLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 200, // 테스트용으로 높게 설정
  message: '테스트 요청이 너무 많습니다.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'production', // 프로덕션에서는 비활성화
});

/**
 * Rate Limiter 적용 예시
 * 
 * import { authLimiter, jobPostingCreateLimiter } from './middlewares/rate-limit.middleware';
 * 
 * // 인증 라우트에 적용
 * router.post('/auth/login', authLimiter, authController.login);
 * router.post('/auth/register', registerLimiter, authController.register);
 * 
 * // 채용 공고 라우트에 적용
 * router.post('/jobs', authenticateJWT, jobPostingCreateLimiter, jobPostingController.create);
 * router.get('/jobs', jobPostingReadLimiter, jobPostingController.getAll);
 * 
 * // 인터뷰 라우트에 적용
 * router.post('/interviews', authenticateJWT, interviewStartLimiter, interviewController.start);
 */

