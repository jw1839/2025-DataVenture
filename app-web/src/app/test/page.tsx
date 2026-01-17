'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { getSocket, connectSocket, emitSocketEvent, onSocketEvent, offSocketEvent } from '@/lib/socket-client';
import { useAuthStore } from '@/stores/auth-store';

export default function TestConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const [interviewId, setInterviewId] = useState<string>('');
  const { user, token, isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore();

  const addLog = (m: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`]);

  useEffect(() => {
    if (!user && token && !isLoading) {
      fetchCurrentUser();
    }
  }, [user, token, isLoading, fetchCurrentUser]);

  const startInterview = async () => {
    if (!user) {
      if (token) {
        await fetchCurrentUser();
      } else {
        addLog('로그인이 필요합니다.');
        return;
      }
    }

    // 중복 리스너 제거 후 재등록
    offSocketEvent('interview:started');
    offSocketEvent('interview:question');
    offSocketEvent('interview:processing');
    offSocketEvent('interview:ended');
    offSocketEvent('interview:error');

    onSocketEvent('interview:started', (data: any) => {
      setInterviewId(data.interviewId);
      addLog(`event: interview:started | Q: ${data?.firstQuestion?.content || ''}`);
    });
    onSocketEvent('interview:question', (d: any) => addLog(`event: interview:question | Q: ${d?.content || ''}`));
    onSocketEvent('interview:processing', () => addLog('event: interview:processing'));
    onSocketEvent('interview:ended', () => addLog('event: interview:ended'));
    onSocketEvent('interview:error', (e: any) => addLog(`event: interview:error - ${e?.message || ''}`));

    const socket = getSocket();
    const emitStart = () => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        addLog('사용자 정보를 불러오지 못했습니다.');
        return;
      }
      emitSocketEvent('interview:start', { candidateId: currentUser.id });
      addLog('emit: interview:start');
    };

    if (!socket.connected) {
      connectSocket();
      socket.once('connect', emitStart);
    } else {
      emitStart();
    }
  };

  const sendMessage = () => {
    if (!interviewId) return;
    emitSocketEvent('interview:message', { interviewId, content: '테스트 답변입니다.' });
  };

  const endInterview = () => {
    if (!interviewId) return;
    emitSocketEvent('interview:end', { interviewId });
  };

  const listJobs = async () => {
    const res = await apiClient.get('/api/v1/jobs');
    addLog(`jobs: ${res.data.total}`);
  };

  const recommendJobs = async () => {
    try {
      const res = await apiClient.get('/api/v1/recommendations/jobs', { params: { limit: 5 } });
      addLog(`recommendations: ${res.data.total}`);
    } catch (e: any) {
      addLog(`recommendations error: ${e.response?.data?.message || e.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">테스트 콘솔</h1>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={startInterview} className="px-3 py-2 border rounded">인터뷰 시작</button>
        <button onClick={sendMessage} className="px-3 py-2 border rounded">메시지 전송</button>
        <button onClick={endInterview} className="px-3 py-2 border rounded">인터뷰 종료</button>
        <button onClick={listJobs} className="px-3 py-2 border rounded">공고 목록</button>
        <button onClick={recommendJobs} className="px-3 py-2 border rounded">추천 공고</button>
      </div>
      <div className="bg-black text-green-400 p-3 rounded min-h-[200px] text-xs whitespace-pre-wrap">{logs.join('\n')}</div>
    </div>
  );
}


