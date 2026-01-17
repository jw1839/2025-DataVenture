/**
 * API 클라이언트 설정
 * Axios 인스턴스 및 인터셉터 설정
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:8080';

/**
 * Axios 인스턴스 생성
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터
 * LocalStorage에서 토큰을 가져와 Authorization 헤더에 추가
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      // 'token' 키로 통일 (authStore.ts와 일치)
      const token = localStorage.getItem('token');
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * 에러 처리 및 토큰 만료 시 리다이렉트
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 인증 오류: 토큰 삭제 및 로그인 페이지로 리다이렉트
      if (typeof window !== 'undefined') {
        // 'token' 키로 통일
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 현재 페이지가 로그인/회원가입이 아닐 경우에만 리다이렉트
        const publicPaths = ['/auth/login', '/auth/register', '/'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

