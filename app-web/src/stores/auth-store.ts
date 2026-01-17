/**
 * 인증 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client';
import {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '@/types/auth';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

/**
 * Zustand 인증 스토어
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      /**
       * 로그인
       */
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post<AuthResponse>(
            '/api/v1/auth/login',
            credentials
          );

          const { user, token } = response.data;

          // LocalStorage에 토큰 저장 ('token' 키로 통일)
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ||
            '로그인에 실패했습니다. 다시 시도해주세요.';

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * 회원가입
       */
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<AuthResponse>(
            '/api/v1/auth/register',
            data
          );

          const { user, token } = response.data;

          // LocalStorage에 토큰 저장 ('token' 키로 통일)
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ||
            '회원가입에 실패했습니다. 다시 시도해주세요.';

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * 로그아웃
       */
      logout: () => {
        // LocalStorage에서 토큰 삭제 ('token' 키로 통일)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      /**
       * 현재 사용자 정보 조회
       * 페이지 새로고침 시 사용자 정보를 서버에서 다시 가져옴
       */
      fetchCurrentUser: async () => {
        set({ isLoading: true });

        try {
          const response = await apiClient.get<{ user: User }>(
            '/api/v1/auth/me'
          );

          const { user } = response.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // 인증 오류 시 로그아웃 처리 ('token' 키로 통일)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null, // 자동 로그아웃이므로 에러 메시지 표시 안 함
          });
        }
      },

      /**
       * 에러 메시지 초기화
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * 로딩 상태 설정
       */
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage', // LocalStorage 키
      partialize: (state) => ({
        // token만 persist (user는 서버에서 다시 가져옴)
        token: state.token,
      }),
    }
  )
);

