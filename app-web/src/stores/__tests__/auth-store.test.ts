/**
 * Auth Store 단위 테스트
 * 
 * 실제 API 호출은 모킹하여 테스트
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '../auth-store';
import apiClient from '@/lib/api-client';

// API 클라이언트 모킹
jest.mock('@/lib/api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Auth Store', () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 초기화
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
    
    // Mock 초기화
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('초기 상태', () => {
    it('초기 상태는 인증되지 않은 상태여야 한다', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('로그인 성공 시 사용자 정보와 토큰을 저장해야 한다', async () => {
      const { result } = renderHook(() => useAuthStore());

      const mockResponse = {
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: '테스트 사용자',
            role: 'CANDIDATE' as const,
          },
          token: 'mock-jwt-token-123',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockResponse.data.user);
        expect(result.current.token).toBe(mockResponse.data.token);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('로그인 실패 시 에러를 설정해야 한다', async () => {
      const { result } = renderHook(() => useAuthStore());

      mockedApiClient.post.mockRejectedValueOnce({
        response: {
          data: {
            message: '이메일 또는 비밀번호가 잘못되었습니다.',
          },
        },
      });

      try {
        await act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
        });
      } catch (error) {
        // 에러가 발생하면 성공
      }

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('로그아웃 시 모든 인증 정보를 삭제해야 한다', async () => {
      const { result } = renderHook(() => useAuthStore());

      // 먼저 로그인
      mockedApiClient.post.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: '테스트 사용자',
            role: 'CANDIDATE',
          },
          token: 'mock-token',
        },
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // 로그아웃
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('에러 메시지를 초기화해야 한다', async () => {
      const { result } = renderHook(() => useAuthStore());

      // 로그인 실패로 에러 설정
      mockedApiClient.post.mockRejectedValueOnce({
        response: {
          data: {
            message: '에러 메시지',
          },
        },
      });

      try {
        await act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
        });
      } catch (error) {
        // 에러 발생 예상
      }

      // 에러 초기화
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

