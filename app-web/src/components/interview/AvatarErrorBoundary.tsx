'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Fallback 아바타 동적 로드
const AIAvatar3D = dynamic(() => import('./AIAvatar3D'), {
  ssr: false,
});

interface Props {
  children: ReactNode;
  isSpeaking?: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'surprised';
  className?: string;
  mousePosition?: { x: number; y: number };
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * GLTF 아바타 로딩 에러를 처리하는 Error Boundary
 * 에러 발생 시 fallback 3D 아바타로 자동 전환
 */
class AvatarErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    // 에러가 발생하면 fallback UI를 표시하도록 상태 업데이트
    console.error('[AvatarErrorBoundary] GLTF 아바타 로딩 에러:', error);
    console.error('[AvatarErrorBoundary] 에러 스택:', error.stack);
    return { 
      hasError: true, 
      errorMessage: error.message 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (프로덕션에서는 에러 트래킹 서비스로 전송 가능)
    console.group('[AvatarErrorBoundary] 에러 상세');
    console.error('에러 메시지:', error.message);
    console.error('에러 이름:', error.name);
    console.error('에러 스택:', error.stack);
    console.error('컴포넌트 스택:', errorInfo.componentStack);
    console.error('타임스탬프:', new Date().toISOString());
    
    // 추가 디버깅 정보
    if (typeof window !== 'undefined') {
      console.info('브라우저 정보:', {
        userAgent: navigator.userAgent,
        webgl: (() => {
          try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            return gl ? 'supported' : 'not supported';
          } catch {
            return 'error checking';
          }
        })()
      });
    }
    console.groupEnd();
  }

  public render() {
    if (this.state.hasError) {
      // GLTF 로딩 실패 시 fallback 아바타 렌더링
      console.warn('[AvatarErrorBoundary] Fallback 아바타로 전환');
      return (
        <AIAvatar3D
          isSpeaking={this.props.isSpeaking}
          emotion={this.props.emotion}
          className={this.props.className}
          mousePosition={this.props.mousePosition}
        />
      );
    }

    return this.props.children;
  }
}

export default AvatarErrorBoundary;

