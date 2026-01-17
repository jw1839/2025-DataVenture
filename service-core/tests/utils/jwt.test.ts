/**
 * JWT 유틸리티 확장 테스트
 * (기존 auth.test.ts의 내용을 포함하고 확장)
 */

import { generateToken, verifyToken, extractTokenFromHeader } from '../../src/utils/jwt';
import { createMockJwtPayload, setupTestEnv } from '../helpers/test-utils';

describe('JWT Utilities', () => {
  beforeAll(() => {
    setupTestEnv();
  });

  describe('generateToken', () => {
    it('유효한 페이로드로 토큰을 생성해야 한다', () => {
      const payload = createMockJwtPayload();
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT는 3개의 부분으로 구성
    });

    it('다양한 역할로 토큰을 생성할 수 있어야 한다', () => {
      const roles = ['CANDIDATE', 'RECRUITER', 'ADMIN'] as const;

      roles.forEach(role => {
        const payload = createMockJwtPayload({ role });
        const token = generateToken(payload);
        const decoded = verifyToken(token);

        expect(decoded?.role).toBe(role);
      });
    });

    it('JWT_SECRET이 없으면 에러를 발생시켜야 한다', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const payload = createMockJwtPayload();

      expect(() => generateToken(payload)).toThrow('JWT_SECRET 환경 변수가 설정되지 않았습니다.');

      process.env.JWT_SECRET = originalSecret;
    });

    it('빈 페이로드로도 토큰을 생성할 수 있어야 한다', () => {
      const payload = {} as any; // any로 캐스팅하여 테스트 목적으로 허용
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('유효한 토큰을 검증하고 페이로드를 반환해야 한다', () => {
      const payload = createMockJwtPayload();
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('유효하지 않은 토큰은 null을 반환해야 한다', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('잘못된 형식의 토큰은 null을 반환해야 한다', () => {
      const malformedToken = 'not-a-jwt-token';
      const decoded = verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('빈 문자열은 null을 반환해야 한다', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });

    it('다른 SECRET으로 생성된 토큰은 검증에 실패해야 한다', () => {
      const originalSecret = process.env.JWT_SECRET;
      
      // 다른 SECRET으로 토큰 생성
      process.env.JWT_SECRET = 'different-secret';
      const payload = createMockJwtPayload();
      const token = generateToken(payload);
      
      // 원래 SECRET으로 복원하고 검증 시도
      process.env.JWT_SECRET = originalSecret;
      const decoded = verifyToken(token);

      expect(decoded).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('Bearer 토큰을 올바르게 추출해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const authHeader = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(authHeader);

      expect(extracted).toBe(token);
    });

    it('Bearer와 토큰 사이의 공백을 처리해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const authHeader = `Bearer  ${token}`; // 공백 2개
      const extracted = extractTokenFromHeader(authHeader);

      expect(extracted).toBe(token);
    });

    it('대소문자를 구분하여 Bearer만 인식해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      // 'Bearer'만 유효
      const validHeader = `Bearer ${token}`;
      expect(extractTokenFromHeader(validHeader)).toBe(token);
      
      // 'bearer', 'BEARER' 등은 무효
      const invalidHeaders = [
        `bearer ${token}`,
        `BEARER ${token}`,
        `BeArEr ${token}`,
      ];
      
      invalidHeaders.forEach(header => {
        expect(extractTokenFromHeader(header)).toBeNull();
      });
    });

    it('Bearer가 없으면 null을 반환해야 한다', () => {
      const authHeader = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const extracted = extractTokenFromHeader(authHeader);

      expect(extracted).toBeNull();
    });

    it('헤더가 없으면 null을 반환해야 한다', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('빈 문자열이면 null을 반환해야 한다', () => {
      const extracted = extractTokenFromHeader('');

      expect(extracted).toBeNull();
    });

    it('Bearer만 있고 토큰이 없으면 null을 반환해야 한다', () => {
      const extracted = extractTokenFromHeader('Bearer');

      expect(extracted).toBeNull();
    });

    it('Bearer 뒤에 공백만 있으면 null을 반환해야 한다', () => {
      const extracted = extractTokenFromHeader('Bearer   ');

      expect(extracted).toBeNull();
    });
  });

  describe('토큰 라이프사이클 통합 테스트', () => {
    it('생성 → 검증 → 추출 전체 플로우가 작동해야 한다', () => {
      // 1. 토큰 생성
      const payload = createMockJwtPayload({
        userId: 'user-456',
        email: 'integration@test.com',
        role: 'RECRUITER',
      });
      const token = generateToken(payload);

      // 2. Authorization 헤더 형식으로 변환
      const authHeader = `Bearer ${token}`;

      // 3. 헤더에서 토큰 추출
      const extractedToken = extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);

      // 4. 추출된 토큰 검증
      const decoded = verifyToken(extractedToken!);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });
  });
});

