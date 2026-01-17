'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Clock,
  MessageSquare,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function InterviewPage() {
  const [interviewMode, setInterviewMode] = useState<'select' | 'practice' | 'real' | 'ongoing'>('select');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const maxTime = interviewMode === 'real' ? 15 : 10;

  const startInterview = (mode: 'practice' | 'real') => {
    setInterviewMode('ongoing');
    // 데모이므로 타이머는 실제로 작동하지 않음
  };

  if (interviewMode === 'select') {
    return (
      <div className="py-8">
        <div className="container-custom max-w-4xl">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드로 돌아가기
            </Button>
          </Link>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI 인터뷰 시작하기
            </h1>
            <p className="text-gray-600">
              연습 모드 또는 실전 모드를 선택하세요
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* 연습 모드 */}
            <Card className="card-hover cursor-pointer border-2 hover:border-blue-300" onClick={() => startInterview('practice')}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">연습 모드</Badge>
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle>연습 인터뷰</CardTitle>
                <CardDescription>
                  부담 없이 AI와 대화를 연습해보세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    채팅 또는 음성 모드 선택 가능
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    5분 / 10분 / 15분 중 선택
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    결과는 개인 기록으로만 저장
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    무제한 재도전 가능
                  </li>
                </ul>
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  연습 시작하기
                </Button>
              </CardContent>
            </Card>

            {/* 실전 모드 */}
            <Card className="card-hover cursor-pointer border-2 border-primary-200 hover:border-primary-400 bg-primary-50/20" onClick={() => startInterview('real')}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="default">실전 모드</Badge>
                  <Mic className="h-5 w-5 text-primary-600" />
                </div>
                <CardTitle>실전 인터뷰</CardTitle>
                <CardDescription>
                  공식 평가로 프로필에 공개됩니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    음성 모드 전용 (필수)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    15분 고정 (변경 불가)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    평가 결과 프로필 공개
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    채용담당자 확인 가능
                  </li>
                </ul>
                <Button className="w-full bg-primary-600 hover:bg-primary-700">
                  <Play className="mr-2 h-4 w-4" />
                  실전 시작하기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 안내 사항 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">인터뷰 진행 방식</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">1단계: 아이스브레이킹 (2~3분)</h4>
                  <p>간단한 일상 대화로 긴장을 풀어드립니다.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">2단계: 공통 질문 (5~7분)</h4>
                  <p>자기소개, 지원 동기, 경력 사항을 확인합니다.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">3단계: 직무 특화 질문 (7~10분)</h4>
                  <p>GPT-5가 실시간으로 맞춤 질문을 생성하고 꼬리 질문을 진행합니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 인터뷰 진행 중 화면
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container-custom py-8">
        {/* 상단 컨트롤 바 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-base px-4 py-1">
              {interviewMode === 'real' ? '실전 모드' : '연습 모드'}
            </Badge>
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5" />
              <span className="text-2xl font-bold">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-gray-400">/ {maxTime}:00</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant={audioEnabled ? 'default' : 'destructive'}
              size="icon"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button 
              variant={videoEnabled ? 'default' : 'secondary'}
              size="icon"
              onClick={() => setVideoEnabled(!videoEnabled)}
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Link href="/dashboard">
              <Button variant="destructive">
                인터뷰 종료
              </Button>
            </Link>
          </div>
        </div>

        {/* 메인 인터뷰 화면 */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* AI 아바타 영역 (2/3) */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-blue-900 rounded-t-lg overflow-hidden">
                  {/* 3D 아바타 플레이스홀더 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center animate-pulse-slow">
                        <div className="w-40 h-40 rounded-full bg-gray-900 flex items-center justify-center">
                          <span className="text-6xl">🤖</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">AI 면접관</h3>
                      <p className="text-gray-300">GPT-5 기반 대화형 AI</p>
                    </div>
                  </div>

                  {/* 음성 인식 인디케이터 */}
                  {audioEnabled && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 bg-green-500 rounded-full animate-pulse"
                            style={{
                              height: `${Math.random() * 20 + 10}px`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 자막 영역 */}
                <div className="p-6 bg-gray-800">
                  <div className="mb-4">
                    <Badge variant="secondary" className="mb-2">AI 면접관</Badge>
                    <p className="text-white text-lg leading-relaxed">
                      &ldquo;안녕하세요! 오늘 인터뷰에 참여해주셔서 감사합니다. 
                      먼저 간단하게 자기소개를 부탁드립니다. 
                      현재 하고 계신 일이나 관심 분야에 대해 말씀해주세요.&rdquo;
                    </p>
                  </div>

                  {/* 진행 단계 */}
                  <div className="flex items-center gap-2">
                    <Badge variant="success">1단계: 아이스브레이킹</Badge>
                    <Progress value={33} max={100} className="flex-1" />
                    <span className="text-sm text-gray-400">1/3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드 패널 (1/3) */}
          <div className="space-y-6">
            {/* 사용자 웹캠 */}
            {videoEnabled && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-300">내 화면</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 진행 상황 */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">진행 상황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">아이스브레이킹</div>
                    <div className="text-xs text-gray-400">진행 중</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">공통 질문</div>
                    <div className="text-xs text-gray-500">대기 중</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">직무 특화 질문</div>
                    <div className="text-xs text-gray-500">대기 중</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 팁 */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">💡 인터뷰 팁</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li>• 명확하고 간결하게 답변하세요</li>
                  <li>• 구체적인 예시를 들어주세요</li>
                  <li>• 질문을 잘 듣고 이해한 후 답변하세요</li>
                  <li>• 자신감 있게 말씀하세요</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            ✨ 데모 버전입니다. 실제 인터뷰는 진행되지 않으며, 화면만 시연됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

