'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX, Clock, X, Subtitles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { interviewAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { StreamingInterviewClient } from '@/lib/streaming-interview-client';

// 3D 아바타를 동적으로 로드
const AIAvatar3D = dynamic(() => import('@/components/interview/AIAvatarGLTF'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

// Error Boundary 동적 로드
const AvatarErrorBoundary = dynamic(() => import('@/components/interview/AvatarErrorBoundary'), {
  ssr: false,
});

interface Message {
  role: 'AI' | 'USER';
  content: string;
  timestamp: Date;
}

function StreamingInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');
  
  const { user, isAuthenticated } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isInterviewActive, setIsInterviewActive] = useState(true);
  
  // 웹캠 & 음성
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  
  // UI 모드
  const [showSubtitles, setShowSubtitles] = useState(true); // 자막 기본 켜짐
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [currentAIText, setCurrentAIText] = useState(''); // AI 텍스트 누적
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamingClientRef = useRef<StreamingInterviewClient | null>(null);

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }
    
    if (!interviewId) {
      toast.error('인터뷰 ID를 찾을 수 없습니다.');
      router.push('/interview/setup');
      return;
    }
    
    initializeInterview();
    
    return () => {
      cleanup();
    };
  }, []);

  // 마우스 움직임 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopCamera();
    if (streamingClientRef.current) {
      streamingClientRef.current.disconnect();
      streamingClientRef.current = null;
    }
  };

  const initializeInterview = async () => {
    if (!interviewId) return;
    
    try {
      // 인터뷰 정보 로드
      const response = await interviewAPI.get(interviewId);
      const interview = response.data;
      
      setTimeLeft(interview.timeLimitSeconds || 15 * 60);
      
      // 타이머 시작
      startTimer();
      
      // 웹캠 자동 시작 시도
      setTimeout(() => {
        startCamera().catch((err) => {
          console.warn('카메라 시작 실패, 계속 진행:', err);
        });
      }, 500);
      
      // 스트리밍 클라이언트 초기화
      await initializeStreamingClient();
      
    } catch (error: any) {
      console.error('인터뷰 로드 실패:', error);
      toast.error('인터뷰를 불러오는데 실패했습니다.');
      router.push('/interview/setup');
    }
  };

  const initializeStreamingClient = async () => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_STREAMING_WS_URL || 
                     'ws://localhost:8000/api/v1/ai/ws/streaming-interview';
      
      const client = new StreamingInterviewClient(wsUrl);
      streamingClientRef.current = client;
      
      // 이벤트 리스너 설정
      client.on('connected', () => {
        console.log('[Interview] 스트리밍 연결됨');
        toast.success('AI 면접관과 연결되었습니다!');
      });
      
      client.on('user_transcript', (text: string) => {
        // 사용자 발화 텍스트
        console.log('[Interview] 사용자:', text);
        setMessages(prev => [...prev, {
          role: 'USER',
          content: text,
          timestamp: new Date()
        }]);
        
        // 자막 표시
        if (showSubtitles) {
          setCurrentSubtitle(`나: ${text}`);
        }
      });
      
      client.on('ai_transcript', (text: string) => {
        // AI 응답 텍스트 (스트리밍)
        setCurrentAIText(prev => prev + text);
        
        // 자막 업데이트
        if (showSubtitles) {
          setCurrentSubtitle(`AI: ${currentAIText + text}`);
        }
      });
      
      client.on('ai_audio_end', () => {
        // AI 음성 완료
        setIsAISpeaking(false);
        
        // 누적된 AI 텍스트를 메시지로 추가
        if (currentAIText) {
          setMessages(prev => [...prev, {
            role: 'AI',
            content: currentAIText,
            timestamp: new Date()
          }]);
          setCurrentAIText(''); // 초기화
        }
        
        // 자막 3초 후 클리어
        setTimeout(() => {
          setCurrentSubtitle('');
        }, 3000);
      });
      
      client.on('interview_ended', (history: any[]) => {
        console.log('[Interview] 대화 종료, 히스토리:', history);
        toast.success('인터뷰가 종료되었습니다!');
        handleEndInterview();
      });
      
      client.on('error', (error: Error) => {
        console.error('[Interview] 에러:', error);
        toast.error(`연결 오류: ${error.message}`);
      });
      
      // WebSocket 연결
      await client.connect();
      
      // 연결 성공 시 AI 말하기 시작
      setIsAISpeaking(true);
      
    } catch (error) {
      console.error('[Interview] 스트리밍 초기화 실패:', error);
      toast.error('AI 면접관 연결에 실패했습니다.');
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('미디어 기기가 지원되지 않습니다. 카메라 없이 진행합니다.');
        toast('카메라 없이 진행합니다.', { icon: 'ℹ️' });
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setStream(mediaStream);
      setIsCameraOn(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      toast.success('카메라가 활성화되었습니다.');
    } catch (error: any) {
      console.error('카메라 접근 실패:', error);
      toast.error('카메라 접근에 실패했습니다. 음성만으로 진행합니다.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOn(false);
  };

  const toggleRecording = async () => {
    const client = streamingClientRef.current;
    if (!client) return;
    
    if (isRecording) {
      // 녹음 중지
      client.stopRecording();
      setIsRecording(false);
      toast.success('답변이 전송되었습니다!');
    } else {
      // 녹음 시작
      let activeStream = stream;
      
      if (!activeStream) {
        try {
          console.log('[StreamingInterview] 마이크 권한 요청 중...');
          const audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true,
            video: isCameraOn 
          });
          setStream(audioStream);
          activeStream = audioStream; // 로컬 변수에 할당 (state는 비동기)
          
          // 비디오가 있으면 웹캠에 연결
          if (isCameraOn && videoRef.current) {
            videoRef.current.srcObject = audioStream;
          }
          
          console.log('[StreamingInterview] 스트림 획득 성공');
        } catch (error: any) {
          console.error('[StreamingInterview] 스트림 획득 실패:', error);
          
          if (error.name === 'NotAllowedError') {
            toast.error('마이크 권한이 거부되었습니다.');
          } else {
            toast.error('마이크를 사용할 수 없습니다.');
          }
          return;
        }
      }
      
      try {
        console.log('[StreamingInterview] 녹음 시작 중...', activeStream);
        await client.startRecording(activeStream);
        setIsRecording(true);
        setIsAISpeaking(false); // AI 음성 중단
        toast('녹음 중... 답변을 말씀해주세요!', { icon: '🎤' });
      } catch (error) {
        console.error('[StreamingInterview] 녹음 시작 실패:', error);
        toast.error('녹음 시작에 실패했습니다.');
      }
    }
  };

  const handleEndInterview = async () => {
    setIsInterviewActive(false);
    
    if (streamingClientRef.current) {
      streamingClientRef.current.endInterview();
    }
    
    // 평가 페이지로 이동
    setTimeout(() => {
      router.push(`/evaluation/${interviewId}`);
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 배경: AI 아바타 (전체 화면) */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black">
        <AvatarErrorBoundary
          isSpeaking={isAISpeaking}
          emotion="neutral"
          mousePosition={mousePosition}
        >
          <AIAvatar3D
            isSpeaking={isAISpeaking}
            emotion="neutral"
            mousePosition={mousePosition}
            className="w-full h-full"
          />
        </AvatarErrorBoundary>
      </div>

      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-4 bg-gradient-to-b from-black/80 via-black/60 to-transparent backdrop-blur-md border-b border-white/10">
        <div className="flex items-center space-x-4">
          <Clock className="h-5 w-5 text-white" />
          <span className="text-white font-mono font-semibold text-lg">{formatTime(timeLeft)}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSubtitles(!showSubtitles)}
            className="text-white hover:bg-white/20"
            title={showSubtitles ? '자막 끄기' : '자막 켜기'}
          >
            <Subtitles className={`h-5 w-5 ${showSubtitles ? 'text-blue-400' : ''}`} />
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndInterview}
            disabled={!isInterviewActive}
            className="bg-red-600 hover:bg-red-700"
          >
            <X className="h-4 w-4 mr-2" />
            인터뷰 종료
          </Button>
        </div>
      </div>

      {/* 마이크 버튼 - 캐릭터 가슴 중앙 (글라스모피즘) */}
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={toggleRecording}
          disabled={!isInterviewActive || !stream}
          className={`
            group relative h-20 w-20 rounded-full
            bg-white/10 backdrop-blur-xl
            border border-white/20
            shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
            hover:bg-white/20 hover:border-white/30
            active:scale-95
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isRecording ? 'animate-pulse bg-red-500/20 border-red-400/50' : ''}
          `}
        >
          {/* 글로우 효과 */}
          <div className={`
            absolute inset-0 rounded-full blur-xl
            ${isRecording ? 'bg-red-400/50' : 'bg-blue-400/30'}
            group-hover:bg-blue-400/50
            transition-all duration-300
          `} />
          
          {/* 아이콘 */}
          <div className="relative flex items-center justify-center h-full w-full">
            {isRecording ? (
              <MicOff className="h-10 w-10 text-red-400 drop-shadow-lg" />
            ) : (
              <Mic className="h-10 w-10 text-white drop-shadow-lg" />
            )}
          </div>
          
          {/* 리플 효과 */}
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-ping" />
              <div className="absolute inset-0 rounded-full border border-red-400/30 animate-pulse" />
            </>
          )}
        </button>
      </div>

      {/* 자막 */}
      {showSubtitles && currentSubtitle && (
        <div className="absolute bottom-[35%] left-1/2 transform -translate-x-1/2 z-40 max-w-3xl w-full px-6">
          <div className="bg-black/80 backdrop-blur-md rounded-lg px-6 py-4 border border-white/20">
            <p className="text-white text-lg text-center leading-relaxed">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* 사용자 웹캠 (PiP) */}
      {isCameraOn && (
        <div className="absolute top-24 right-8 z-40 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror"
          />
        </div>
      )}

      {/* 로딩 오버레이 */}
      {!isInterviewActive && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-white text-xl">인터뷰 종료 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StreamingInterviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <StreamingInterviewContent />
    </Suspense>
  );
}

