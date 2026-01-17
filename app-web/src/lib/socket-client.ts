/**
 * Socket.IO 클라이언트 설정
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

let socket: Socket | null = null;

/**
 * Socket.IO 연결 생성
 * @returns Socket 인스턴스
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false, // 수동 연결
      transports: ['websocket', 'polling'], // WebSocket 우선, 폴백은 polling
    });

    // 연결 이벤트 로깅
    socket.on('connect', () => {
      console.log('[Socket.IO] 연결됨:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] 연결 해제됨:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] 연결 오류:', error);
    });
  }

  return socket;
};

/**
 * Socket.IO 연결
 */
export const connectSocket = (): void => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Socket.IO 연결 해제
 */
export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

/**
 * Socket.IO 이벤트 리스너 등록 (타입 안전)
 */
export const onSocketEvent = <T = any>(
  event: string,
  handler: (data: T) => void
): void => {
  const socket = getSocket();
  socket.on(event, handler);
};

/**
 * Socket.IO 이벤트 리스너 제거
 */
export const offSocketEvent = (event: string, handler?: (...args: any[]) => void): void => {
  const socket = getSocket();
  if (handler) {
    socket.off(event, handler);
  } else {
    socket.off(event);
  }
};

/**
 * Socket.IO 이벤트 발생
 */
export const emitSocketEvent = <T = any>(event: string, data?: T): void => {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn('[Socket.IO] 연결되지 않음. 이벤트 발생 실패:', event);
  }
};

