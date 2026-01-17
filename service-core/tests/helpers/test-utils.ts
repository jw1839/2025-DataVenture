/**
 * 테스트 유틸리티 헬퍼
 * - 모킹 함수
 * - 테스트 데이터 생성
 * - DB 초기화 (향후 구현)
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Express Request 모킹 객체 생성
 */
export const mockRequest = (overrides?: Partial<Request>): Partial<Request> => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: 'GET',
    url: '/',
    ...overrides,
  };
};

/**
 * Express Response 모킹 객체 생성
 */
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Express NextFunction 모킹
 */
export const mockNext = (): NextFunction => {
  return jest.fn() as NextFunction;
};

/**
 * JWT 토큰 페이로드 생성 (테스트용)
 * 
 * 참고: iat, exp는 generateToken 함수가 자동으로 설정하므로 여기서는 제외
 */
export const createMockJwtPayload = (overrides?: {
  userId?: string;
  email?: string;
  role?: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
}) => {
  return {
    userId: overrides?.userId || 'test-user-id-123',
    email: overrides?.email || 'test@example.com',
    role: overrides?.role || 'CANDIDATE',
  };
};

/**
 * 테스트용 사용자 데이터 생성
 */
export const createMockUser = (overrides?: {
  id?: string;
  email?: string;
  name?: string;
  role?: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
}) => {
  return {
    id: overrides?.id || 'user-123',
    email: overrides?.email || 'test@example.com',
    name: overrides?.name || '테스트 사용자',
    role: overrides?.role || 'CANDIDATE',
    passwordHash: '$2b$10$hashedPasswordExample',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * 테스트용 채용 공고 데이터 생성
 */
export const createMockJobPosting = (overrides?: {
  id?: string;
  title?: string;
  recruiterId?: string;
}) => {
  return {
    id: overrides?.id || 'job-123',
    recruiterId: overrides?.recruiterId || 'recruiter-123',
    title: overrides?.title || 'Senior Backend Developer',
    description: '백엔드 개발자를 채용합니다.',
    requirements: ['Node.js', 'TypeScript', 'PostgreSQL'],
    preferredSkills: ['AWS', 'Docker', 'Kubernetes'],
    position: 'Backend Developer',
    experienceMin: 3,
    experienceMax: 7,
    salaryMin: 5000,
    salaryMax: 8000,
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * 테스트용 인터뷰 데이터 생성
 */
export const createMockInterview = (overrides?: {
  id?: string;
  candidateId?: string;
  jobPostingId?: string;
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
}) => {
  return {
    id: overrides?.id || 'interview-123',
    candidateId: overrides?.candidateId || 'candidate-123',
    jobPostingId: overrides?.jobPostingId || null,
    status: overrides?.status || 'IN_PROGRESS',
    startedAt: new Date(),
    completedAt: null,
  };
};

/**
 * 테스트용 평가 데이터 생성
 */
export const createMockEvaluation = (overrides?: {
  id?: string;
  interviewId?: string;
}) => {
  return {
    id: overrides?.id || 'evaluation-123',
    interviewId: overrides?.interviewId || 'interview-123',
    technicalScore: 85.5,
    communicationScore: 78.0,
    problemSolvingScore: 82.3,
    overallScore: 82.0,
    strengthsJson: JSON.stringify(['강점 1', '강점 2', '강점 3']),
    weaknessesJson: JSON.stringify(['약점 1', '약점 2']),
    detailedFeedback: '상세 피드백입니다.',
    matchingScore: 88.5,
    matchingReason: '매칭 근거입니다.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * 비동기 에러 처리 헬퍼
 */
export const expectAsyncError = async (
  fn: () => Promise<any>,
  errorMessage?: string
) => {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error: any) {
    expect(error).toBeDefined();
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
  }
};

/**
 * 테스트 환경 변수 설정
 */
export const setupTestEnv = () => {
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';
  process.env.AI_SERVICE_URL = 'http://localhost:8000';
};

/**
 * 테스트 환경 변수 정리
 */
export const cleanupTestEnv = () => {
  // 필요한 경우 환경 변수 초기화
};

