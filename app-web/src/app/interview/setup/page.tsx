'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MessageSquare, Clock, Target, Loader2, Play, Check, Plus, X, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { interviewAPI, questionAPI, QuestionItem } from '@/lib/api';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { PermissionTestModal } from '@/components/interview/PermissionTestModal';

// Skeleton 질문 컴포넌트
const QuestionSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-100 rounded w-1/4"></div>
  </div>
);

// 기본 질문 세트 (AI 서비스 장애 시 fallback)
const DEFAULT_QUESTIONS: QuestionItem[] = [
  { id: "q1", text: "간단하게 자기소개 부탁드립니다.", type: "ice_breaking", category: "아이스브레이킹", max_follow_ups: 0 },
  { id: "q2", text: "이 직무에 지원하신 이유는 무엇인가요?", type: "common", category: "지원 동기", max_follow_ups: 1 },
  { id: "q3", text: "본인의 가장 큰 강점은 무엇이라고 생각하시나요?", type: "competency", category: "자기 인식", max_follow_ups: 1 },
  { id: "q4", text: "가장 어려웠던 프로젝트 경험에 대해 말씀해주세요.", type: "competency", category: "문제 해결", max_follow_ups: 2 },
  { id: "q5", text: "팀원과 협업할 때 중요하게 생각하는 가치는 무엇인가요?", type: "competency", category: "협업", max_follow_ups: 1 },
  { id: "q6", text: "새로운 기술을 학습할 때 어떤 방식으로 접근하시나요?", type: "competency", category: "학습 능력", max_follow_ups: 1 },
  { id: "q7", text: "업무 우선순위를 어떻게 설정하시나요?", type: "competency", category: "시간 관리", max_follow_ups: 1 },
  { id: "q8", text: "의견 충돌 상황을 어떻게 해결하시나요?", type: "competency", category: "커뮤니케이션", max_follow_ups: 2 },
  { id: "q9", text: "실패한 경험과 그로부터 배운 점을 말씀해주세요.", type: "competency", category: "성장", max_follow_ups: 2 },
  { id: "q10", text: "5년 후 본인의 모습은 어떨 것 같나요?", type: "competency", category: "비전", max_follow_ups: 1 }
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  // 인터뷰 설정
  const [mode, setMode] = useState<'PRACTICE' | 'ACTUAL'>('PRACTICE');
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [duration, setDuration] = useState(15); // 분
  const [isLoading, setIsLoading] = useState(false);
  
  // 권한 테스트 모달
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  // 질문 생성 및 선택
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);

  // 선택된 질문 객체 배열 계산 (ID 기반으로 필터링)
  const selectedQuestions = useMemo(() => {
    return generatedQuestions.filter(q => selectedQuestionIds.includes(q.id));
  }, [generatedQuestions, selectedQuestionIds]);

  // 인증 확인 및 질문 생성
  useEffect(() => {
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
    
    // 페이지 진입 시 질문 생성
    generateQuestions();
  }, [isAuthenticated, user]);

  // 질문 생성 함수
  const generateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const response = await questionAPI.generateQuestionSet({
        candidateProfile: {
          // TODO: 사용자 프로필에서 가져오기
          skills: [],
          experience: 0,
          desiredPosition: '소프트웨어 엔지니어'
        },
        jobPosting: {
          title: '신입 개발자 채용',
          position: '백엔드 개발',
          requirements: []
        },
        mode: mode === 'PRACTICE' ? 'PRACTICE' : 'REAL'
      });
      
      setGeneratedQuestions(response.data.questions);
      
      // 연습 모드에서는 처음 5개 자동 선택
      if (mode === 'PRACTICE') {
        setSelectedQuestionIds(response.data.questions.slice(0, 5).map(q => q.id));
      }
      
      toast.success('질문이 생성되었습니다!');
    } catch (error: any) {
      console.error('질문 생성 실패:', error);
      
      // 에러 타입별 메시지
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('서버 응답 시간이 초과되었습니다. service-ai가 실행 중인지 확인해주세요.');
      } else if (error.response?.status === 500) {
        toast.error('AI 서비스에 문제가 발생했습니다. OpenAI API 키를 확인해주세요.');
      } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        toast.error('AI 서비스에 연결할 수 없습니다. service-ai가 실행 중인지 확인해주세요.');
      } else {
        toast.error('질문 생성에 실패했습니다. 기본 질문을 사용합니다.');
      }
      
      // 프론트엔드 기본 질문 세트 사용
      setGeneratedQuestions(DEFAULT_QUESTIONS);
      
      // 연습 모드에서는 처음 5개 자동 선택
      if (mode === 'PRACTICE') {
        setSelectedQuestionIds(DEFAULT_QUESTIONS.slice(0, 5).map(q => q.id));
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // 질문 토글 (연습 모드에서만 사용)
  const toggleQuestion = (questionId: string) => {
    setSelectedQuestionIds((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else if (prev.length < 5) {
        return [...prev, questionId];
      } else {
        toast.error('최대 5개까지 선택할 수 있습니다.');
        return prev;
      }
    });
  };

  // 커스텀 질문 추가
  const addCustomQuestion = () => {
    if (!customQuestion.trim()) {
      toast.error('질문을 입력해주세요.');
      return;
    }
    if (customQuestions.length >= 5) {
      toast.error('최대 5개까지 추가할 수 있습니다.');
      return;
    }
    setCustomQuestions([...customQuestions, customQuestion.trim()]);
    setCustomQuestion('');
  };

  // 커스텀 질문 삭제
  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  // 인터뷰 시작 버튼 클릭 -> 권한 모달 표시
  const handleStartInterview = () => {
    if (!user) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }
    
    // 연습 모드에서 질문 선택 검증
    if (mode === 'PRACTICE') {
      const totalQuestions = selectedQuestions.length + customQuestions.length;
      if (totalQuestions === 0) {
        toast.error('최소 1개 이상의 질문을 선택하거나 추가해주세요.');
        return;
      }
    }
    
    // 권한 테스트 모달 표시
    setShowPermissionModal(true);
  };

  // 권한 확인 후 실제 인터뷰 시작
  const proceedToInterview = async () => {
    // 모달 닫기
    setShowPermissionModal(false);
    
    // 로딩 시작
    setIsLoading(true);
    
    try {
      // 백엔드에 인터뷰 시작 요청
      const response = await interviewAPI.start({
        mode: mode,
        duration: duration,
        voiceMode: isVoiceMode,  // ✅ 음성 모드 정보 전달
        // 선택된 질문 전달
        selectedQuestions: mode === 'PRACTICE' ? selectedQuestions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          category: q.category,
          max_follow_ups: q.max_follow_ups
        })) : undefined,
        customQuestions: mode === 'PRACTICE' ? customQuestions : undefined,
      });
      
      const { interviewId } = response.data;
      
      toast.success('인터뷰가 생성되었습니다!');
      
      // 인터뷰 진행 페이지로 이동
      // 선택한 대화 방식(음성/채팅)도 URL 파라미터로 전달
      router.push(`/interview/start?id=${interviewId}&voiceMode=${isVoiceMode}`);
    } catch (error: any) {
      console.error('인터뷰 시작 실패:', error);
      toast.error(error.response?.data?.error || '인터뷰 시작에 실패했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <div className="relative">
              {/* 회전하는 원 */}
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              {/* 중앙 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-semibold">인터뷰 시작 중...</p>
              <p className="text-white/70 text-sm mt-1">잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container-custom">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">AI 인터뷰 설정</h1>
          <p className="mt-2 text-gray-600">
            인터뷰 모드와 설정을 선택하세요
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          {/* 모드 선택 */}
          <Card>
            <CardHeader>
              <CardTitle>인터뷰 모드 선택</CardTitle>
              <CardDescription>
                연습 모드는 자유롭게 연습할 수 있으며, 실전 모드는 결과가 프로필에 반영됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* 연습 모드 */}
                <button
                  type="button"
                  onClick={() => setMode('PRACTICE')}
                  className={`flex flex-col items-start gap-3 rounded-lg p-6 text-left transition-all ${
                    mode === 'PRACTICE'
                      ? 'border-[3px] border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-300'
                      : 'border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      mode === 'PRACTICE' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">연습 모드</h3>
                      <p className="text-sm text-gray-600">자유로운 연습</p>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• 채팅/음성 모드 선택 가능</li>
                    <li>• 시간 제한 자유 설정 (5~20분)</li>
                    <li>• 프로필에 반영되지 않음</li>
                    <li>• 스크립트 및 피드백 제공</li>
                  </ul>
                </button>

                {/* 실전 모드 */}
                <button
                  type="button"
                  onClick={() => setMode('ACTUAL')}
                  className={`flex flex-col items-start gap-3 rounded-lg p-6 text-left transition-all ${
                    mode === 'ACTUAL'
                      ? 'border-[3px] border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-300'
                      : 'border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      mode === 'ACTUAL' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Play className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">실전 모드</h3>
                      <p className="text-sm text-gray-600">공식 평가</p>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• 음성 모드만 가능</li>
                    <li>• 15분 고정</li>
                    <li>• 프로필에 결과 반영</li>
                    <li>• 채용담당자가 확인 가능</li>
                  </ul>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 음성/채팅 모드 선택 (연습 모드만) */}
          {mode === 'PRACTICE' && (
            <Card>
              <CardHeader>
                <CardTitle>대화 방식 선택</CardTitle>
                <CardDescription>
                  채팅 또는 음성으로 인터뷰를 진행할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* 음성 모드 */}
                  <button
                    type="button"
                    onClick={() => setIsVoiceMode(true)}
                    className={`flex items-center gap-3 rounded-lg p-4 transition-all ${
                      isVoiceMode
                        ? 'border-[3px] border-green-600 bg-green-50 shadow-lg ring-2 ring-green-300'
                        : 'border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Mic className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <h4 className="font-medium">음성 모드</h4>
                      <p className="text-sm text-gray-600">실제 면접과 유사</p>
                    </div>
                  </button>

                  {/* 채팅 모드 */}
                  <button
                    type="button"
                    onClick={() => setIsVoiceMode(false)}
                    className={`flex items-center gap-3 rounded-lg p-4 transition-all ${
                      !isVoiceMode
                        ? 'border-[3px] border-green-600 bg-green-50 shadow-lg ring-2 ring-green-300'
                        : 'border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MessageSquare className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <h4 className="font-medium">채팅 모드</h4>
                      <p className="text-sm text-gray-600">편한 텍스트 대화</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 시간 설정 (연습 모드만) */}
          {mode === 'PRACTICE' && (
            <Card>
              <CardHeader>
                <CardTitle>시간 설정</CardTitle>
                <CardDescription>
                  인터뷰 진행 시간을 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 grid-cols-4">
                  {[5, 10, 15, 20].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setDuration(time)}
                      className={`flex flex-col items-center gap-2 rounded-lg p-4 transition-all ${
                        duration === time
                          ? 'border-[3px] border-purple-600 bg-purple-50 shadow-lg ring-2 ring-purple-300'
                          : 'border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{time}분</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 질문 선택 (연습 모드만) */}
          {mode === 'PRACTICE' && (
            <Card>
              <CardHeader>
                <CardTitle>질문 선택</CardTitle>
                <CardDescription>
                  제공된 질문 중 최대 5개를 선택하거나, 직접 질문을 추가하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 추천 질문 목록 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      프로필 기반 AI 생성 질문 ({selectedQuestionIds.length}/5 선택)
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateQuestions}
                      disabled={isGeneratingQuestions}
                      className="h-8"
                    >
                      {isGeneratingQuestions ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {isGeneratingQuestions ? '생성 중...' : '새로 생성'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {isGeneratingQuestions ? (
                      // Skeleton Loading
                      Array.from({ length: 10 }).map((_, idx) => (
                        <div key={idx} className="p-3 rounded-lg border-2 border-gray-200">
                          <QuestionSkeleton />
                        </div>
                      ))
                    ) : generatedQuestions.length > 0 ? (
                      // 생성된 질문 목록
                      generatedQuestions.map((q) => (
                        <label
                          key={q.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedQuestionIds.includes(q.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.includes(q.id)}
                            onChange={() => toggleQuestion(q.id)}
                            className="mt-1 h-4 w-4 text-primary rounded focus:ring-primary"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{q.text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                {q.category}
                              </span>
                              {q.type === 'ice_breaking' && (
                                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                                  아이스브레이킹
                                </span>
                              )}
                              {q.type === 'common' && (
                                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                  공통 질문
                                </span>
                              )}
                              {q.type === 'competency' && (
                                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                                  역량 평가
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedQuestionIds.includes(q.id) && (
                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </label>
                      ))
                    ) : (
                      // 질문 없음 (에러 발생 시)
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-2">질문을 불러올 수 없습니다.</p>
                        <Button onClick={generateQuestions} variant="outline" size="sm">
                          다시 시도
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 커스텀 질문 추가 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    직접 만든 질문 ({customQuestions.length}/5)
                  </h4>
                  
                  {/* 입력 */}
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="질문을 입력하세요..."
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomQuestion()}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addCustomQuestion}
                      disabled={customQuestions.length >= 5}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 커스텀 질문 목록 */}
                  {customQuestions.length > 0 && (
                    <div className="space-y-2">
                      {customQuestions.map((q, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg border border-primary bg-primary/5"
                        >
                          <p className="flex-1 text-sm text-gray-900">{q}</p>
                          <button
                            type="button"
                            onClick={() => removeCustomQuestion(index)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 총 선택 개수 표시 */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    총 {selectedQuestions.length + customQuestions.length}개 질문 선택됨
                    {(selectedQuestions.length + customQuestions.length) === 0 && 
                      ' (최소 1개 이상 선택해주세요)'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 실전 모드 안내 */}
          {mode === 'ACTUAL' && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-900">실전 모드 안내</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li>• 음성 모드로만 진행되며, 15분간 진행됩니다</li>
                  <li>• 인터뷰 결과는 프로필에 저장되어 채용담당자가 확인할 수 있습니다</li>
                  <li>• AI가 자동으로 질문을 생성하고, 답변을 평가합니다</li>
                  <li>• 평가 항목: 의사소통 능력, 직무 역량 (정보분석, 문제해결 등)</li>
                  <li>• 인터뷰 완료 후 상세한 피드백과 추천 직무를 제공합니다</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 시작 버튼 */}
          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
            >
              취소
            </Button>
            
            {/* 개발 테스트 버튼 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => router.push('/interview/test-chat')}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                개발 테스트
              </Button>
            )}
            
            <Button
              type="button"
              size="lg"
              onClick={handleStartInterview}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  인터뷰 생성 중...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  인터뷰 시작
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 권한 테스트 모달 */}
      <PermissionTestModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onConfirm={proceedToInterview}
        isVoiceMode={isVoiceMode}
      />
    </div>
  );
}
