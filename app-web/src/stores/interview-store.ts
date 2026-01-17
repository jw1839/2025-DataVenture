/**
 * 인터뷰 상태 관리 (Zustand + Socket.IO)
 */

import { create } from 'zustand';
import {
  Interview,
  InterviewMessage,
  InterviewState,
  InterviewStartData,
  InterviewStartedEvent,
  InterviewMessageData,
  InterviewQuestionEvent,
  InterviewErrorEvent,
  InterviewEndData,
  InterviewEndedEvent,
} from '@/types/interview';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  onSocketEvent,
  offSocketEvent,
  emitSocketEvent,
} from '@/lib/socket-client';

interface InterviewStore extends InterviewState {
  // Actions
  startInterview: (data: InterviewStartData) => void;
  sendMessage: (content: string) => void;
  endInterview: () => void;
  clearError: () => void;
  disconnect: () => void;
}

/**
 * Zustand 인터뷰 스토어
 */
export const useInterviewStore = create<InterviewStore>((set, get) => ({
  // Initial State
  currentInterview: null,
  messages: [],
  isConnected: false,
  isProcessing: false,
  error: null,

  // Actions
  /**
   * 인터뷰 시작
   */
  startInterview: (data: InterviewStartData) => {
    const socket = getSocket();

    // Socket.IO 연결
    if (!socket.connected) {
      connectSocket();
    }

    // 이벤트 핸들러 등록
    setupSocketHandlers(set, get);

    // 인터뷰 시작 이벤트 발생
    emitSocketEvent('interview:start', data);

    set({
      isProcessing: true,
      error: null,
    });
  },

  /**
   * 메시지 전송
   */
  sendMessage: (content: string) => {
    const { currentInterview } = get();

    if (!currentInterview) {
      set({ error: '인터뷰가 시작되지 않았습니다.' });
      return;
    }

    const messageData: InterviewMessageData = {
      interviewId: currentInterview.id,
      content,
      contentType: 'TEXT',
    };

    // 사용자 메시지를 즉시 UI에 추가
    const userMessage: InterviewMessage = {
      id: `temp-${Date.now()}`,
      role: 'CANDIDATE',
      content,
      contentType: 'TEXT',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isProcessing: true,
      error: null,
    }));

    // Socket.IO로 메시지 전송
    emitSocketEvent('interview:message', messageData);
  },

  /**
   * 인터뷰 종료
   */
  endInterview: () => {
    const { currentInterview } = get();

    if (!currentInterview) {
      return;
    }

    const endData: InterviewEndData = {
      interviewId: currentInterview.id,
    };

    emitSocketEvent('interview:end', endData);

    set({
      isProcessing: true,
    });
  },

  /**
   * 에러 초기화
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Socket.IO 연결 해제
   */
  disconnect: () => {
    // 이벤트 핸들러 제거
    const socket = getSocket();
    socket.off('interview:started');
    socket.off('interview:question');
    socket.off('interview:processing');
    socket.off('interview:ended');
    socket.off('interview:error');

    disconnectSocket();

    set({
      isConnected: false,
      isProcessing: false,
    });
  },
}));

/**
 * Socket.IO 이벤트 핸들러 설정
 */
function setupSocketHandlers(
  set: any,
  get: () => InterviewStore
): void {
  const socket = getSocket();

  // 연결 상태
  socket.on('connect', () => {
    set({ isConnected: true });
  });

  socket.on('disconnect', () => {
    set({ isConnected: false });
  });

  // 인터뷰 시작됨
  onSocketEvent<InterviewStartedEvent>('interview:started', (data) => {
    console.log('[Interview Store] 인터뷰 시작됨:', data);

    set({
      currentInterview: data.interview,
      messages: [data.firstQuestion],
      isProcessing: false,
      error: null,
    });
  });

  // AI 질문 수신
  onSocketEvent<InterviewQuestionEvent>('interview:question', (data) => {
    console.log('[Interview Store] AI 질문 수신:', data);

    const aiMessage: InterviewMessage = {
      id: data.id,
      role: data.role,
      content: data.content,
      contentType: data.contentType,
      createdAt: data.createdAt,
    };

    set((state: InterviewState) => ({
      messages: [...state.messages, aiMessage],
      isProcessing: false,
    }));
  });

  // AI 처리 중
  onSocketEvent<{ message: string }>('interview:processing', (data) => {
    console.log('[Interview Store] AI 처리 중:', data.message);
    set({ isProcessing: true });
  });

  // 인터뷰 종료됨
  onSocketEvent<InterviewEndedEvent>('interview:ended', (data) => {
    console.log('[Interview Store] 인터뷰 종료됨:', data);

    set({
      isProcessing: false,
    });

    // 잠시 후 평가 페이지로 이동 (상위 컴포넌트에서 처리)
  });

  // 에러 발생
  onSocketEvent<InterviewErrorEvent>('interview:error', (data) => {
    console.error('[Interview Store] 에러:', data.message);

    set({
      error: data.message,
      isProcessing: false,
    });
  });
}

