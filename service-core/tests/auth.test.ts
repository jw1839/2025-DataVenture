/**
 * 인증 API 단위 테스트
 */

import { generateToken, verifyToken, extractTokenFromHeader } from '../src/utils/jwt';

describe('JWT Utilities', () => {
  // 테스트용 환경 변수 설정
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('generateToken', () => {
    it('유효한 페이로드로 토큰을 생성해야 한다', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'CANDIDATE',
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT는 3개의 부분으로 구성
    });

    it('JWT_SECRET이 없으면 에러를 발생시켜야 한다', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'CANDIDATE',
      };

      expect(() => generateToken(payload)).toThrow('JWT_SECRET 환경 변수가 설정되지 않았습니다.');

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('verifyToken', () => {
    it('유효한 토큰을 검증하고 페이로드를 반환해야 한다', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'CANDIDATE',
      };

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

    it('만료된 토큰은 null을 반환해야 한다', () => {
      // 이미 만료된 토큰 (과거 시간으로 생성)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkNBTkRJREFURSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.invalid';

      const decoded = verifyToken(expiredToken);

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
  });
});

/**
 * 통합 테스트는 실제 서버를 실행하여 E2E 테스트로 진행하는 것이 좋다.
 * 아래는 향후 추가할 통합 테스트의 예시이다.
 */

/*
import request from 'supertest';
import { app } from '../src/index';

describe('Auth API Integration Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    it('새 사용자를 등록해야 한다', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123',
          name: '테스트 사용자',
          role: 'CANDIDATE',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('newuser@example.com');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('올바른 인증 정보로 로그인해야 한다', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('잘못된 인증 정보는 401을 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
*/

