'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, CheckCircle, Clock, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { interviewAPI } from '@/lib/api';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'AI' | 'USER';
  content: string;
  timestamp: Date;
}

interface Question {
  id: string;
  text: string;
  category: string;
}

export default function TestChatPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false); // 중복 초기화 방지
  
  // 상태 관리
  const [isInitializing, setIsInitializing] = useState(true);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // 인증 확인 및 인터뷰 초기화
  useEffect(() => {
    // 이미 초기화했으면 중복 실행 방지
    if (hasInitialized.current) {
      return;
    }
    
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }
    
    if (user?.role !== 'CANDIDATE') {
      toast.error('구직자만 인터뷰를 진행할 수 있습니다.');
      router.push('/');
      return;
    }
    
    hasInitialized.current = true; // 초기화 플래그 설정
    initializeInterview();
  }, [isAuthenticated, user]);
  
  // 타이머 시작
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);
  
  // 메시지 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 인터뷰 초기화
  const initializeInterview = async () => {
    setIsInitializing(true);
    try {
      // 인터뷰 시작 API 호출
      const response = await interviewAPI.start({
        mode: 'PRACTICE',
        duration: 15,
      });
      
      const { interviewId: newInterviewId, questions: generatedQuestions } = response.data;
      
      setInterviewId(newInterviewId);
      
      // 질문이 생성되었으면 사용, 아니면 기본 질문 사용
      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(generatedQuestions);
      } else {
        // 기본 질문 (백엔드에서 질문을 생성하지 못한 경우)
        setQuestions([
          { id: '1', text: '자기소개를 간단히 해주세요.', category: '공통' },
          { id: '2', text: '이 직무에 지원한 이유는 무엇인가요?', category: '공통' },
          { id: '3', text: '가장 자랑스러운 프로젝트 경험은 무엇인가요?', category: '공통' },
          { id: '4', text: '팀에서 발생한 갈등을 해결한 경험을 말씀해주세요.', category: '의사소통' },
          { id: '5', text: '복잡한 문제를 해결한 경험을 구체적으로 설명해주세요.', category: '문제해결' },
        ]);
      }
      
      // 첫 번째 질문을 AI 메시지로 추가
      const firstQuestion = generatedQuestions?.[0] || { id: '1', text: '자기소개를 간단히 해주세요.', category: '공통' };
      
      addMessage('AI', `안녕하세요! AI 인터뷰를 시작하겠습니다.\n\n${firstQuestion.text}`);
      
      toast.success('인터뷰가 시작되었습니다!');
    } catch (error: any) {
      console.error('인터뷰 초기화 실패:', error);
      toast.error(error.response?.data?.error || '인터뷰를 시작할 수 없습니다.');
      router.push('/interview/setup');
    } finally {
      setIsInitializing(false);
    }
  };
  
  // 메시지 추가
  const addMessage = (role: 'AI' | 'USER', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };
  
  // 답변 전송
  const handleSendAnswer = async () => {
    if (!currentInput.trim() || isSending || !interviewId) return;
    
    const userAnswer = currentInput.trim();
    setCurrentInput('');
    setIsSending(true);
    
    try {
      // 사용자 답변을 메시지에 추가
      addMessage('USER', userAnswer);
      
      // 백엔드에 메시지 저장
      await interviewAPI.addMessage(interviewId, {
        role: 'CANDIDATE',
        content: userAnswer,
        contentType: 'TEXT',
      });
      
      // 다음 질문으로 이동
      const nextIndex = currentQuestionIndex + 1;
      
      if (nextIndex < questions.length) {
        // 다음 질문이 있으면 표시
        setCurrentQuestionIndex(nextIndex);
        
        setTimeout(() => {
          const nextQuestion = questions[nextIndex];
          addMessage('AI', nextQuestion.text);
        }, 1000);
      } else {
        // 모든 질문 완료
        setTimeout(() => {
          addMessage('AI', '모든 질문이 완료되었습니다. 평가를 진행하겠습니다...');
          completeInterview();
        }, 1000);
      }
    } catch (error: any) {
      console.error('답변 전송 실패:', error);
      toast.error('답변 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };
  
  // 인터뷰 완료
  const completeInterview = async () => {
    if (!interviewId) return;
    
    try {
      setIsCompleted(true);
      
      // 타이머 중지
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      // 인터뷰 완료 API 호출 (평가는 service-core에서 자동 생성됨)
      await interviewAPI.complete(interviewId, {
        elapsedSeconds,
      });
      
      toast.success('인터뷰가 완료되었습니다! 평가가 생성 중입니다.');
      
      // 평가 결과 페이지로 이동
      setTimeout(() => {
        router.push(`/evaluation/${interviewId}`);
      }, 2000);
    } catch (error: any) {
      console.error('인터뷰 완료 실패:', error);
      toast.error('인터뷰 완료 처리에 실패했습니다.');
    }
  };
  
  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">인터뷰를 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('인터뷰를 종료하시겠습니까?')) {
                    if (timerInterval) clearInterval(timerInterval);
                    router.push('/interview/setup');
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                나가기
              </Button>
              
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">텍스트 인터뷰 테스트</h1>
                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  개발 모드
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* 진행률 */}
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
              
              {/* 타이머 */}
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium font-mono">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </div>
          </div>
          
          {/* 진행 바 */}
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="container-custom py-6 max-w-4xl">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'USER'
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'AI' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.role === 'USER' ? 'text-primary-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-gray-600">AI가 응답을 준비하고 있습니다...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      
      {/* 입력 영역 */}
      {!isCompleted && (
        <div className="bg-white border-t border-gray-200 sticky bottom-0">
          <div className="container-custom py-4 max-w-4xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAnswer();
              }}
              className="flex items-end gap-3"
            >
              <div className="flex-1">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  disabled={isSending || isCompleted}
                  className="min-h-[48px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAnswer();
                    }
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={!currentInput.trim() || isSending || isCompleted}
                size="lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Enter를 눌러 전송 • Shift + Enter로 줄바꿈
            </p>
          </div>
        </div>
      )}
      
      {/* 완료 메시지 */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-t border-green-200 sticky bottom-0">
          <div className="container-custom py-6 max-w-4xl text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              인터뷰가 완료되었습니다!
            </h3>
            <p className="text-sm text-gray-600">
              평가 결과를 확인하려면 잠시만 기다려주세요...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

