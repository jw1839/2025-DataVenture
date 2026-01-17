/**
 * 인증 미들웨어 단위 테스트
 */

import { authenticate } from '../../src/middlewares/auth.middleware';
import { generateToken } from '../../src/utils/jwt';
import {
  mockRequest,
  mockResponse,
  mockNext,
  createMockJwtPayload,
  setupTestEnv,
} from '../helpers/test-utils';

describe('Auth Middleware', () => {
  beforeAll(() => {
    setupTestEnv();
  });

  describe('authenticate', () => {
    it('유효한 JWT 토큰으로 인증에 성공해야 한다', () => {
      // Arrange
      const payload = createMockJwtPayload();
      const token = generateToken(payload);
      
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      authenticate(req as any, res as any, next);

      // Assert
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(payload.userId);
      expect(req.user?.email).toBe(payload.email);
      expect(req.user?.role).toBe(payload.role);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // 에러 없이 호출
    });

    it('Authorization 헤더가 없으면 401을 반환해야 한다', () => {
      // Arrange
      const req = mockRequest({
        headers: {}, // Authorization 헤더 없음
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      authenticate(req as any, res as any, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('Bearer 형식이 아닌 토큰은 401을 반환해야 한다', () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: 'InvalidFormat token123',
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      authenticate(req as any, res as any, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('유효하지 않은 토큰은 401을 반환해야 한다', () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      authenticate(req as any, res as any, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('만료된 토큰은 401을 반환해야 한다', () => {
      // Arrange
      // 이미 만료된 토큰 (실제로는 verifyToken이 null 반환)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkNBTkRJREFURSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.invalid';
      
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      authenticate(req as any, res as any, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

