'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX, Clock, X, MessageSquare, Subtitles, Loader2, Send, CheckCircle, ArrowLeft, Sparkles, ChevronDown, ChevronUp, ThumbsUp, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { interviewAPI, feedbackAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { getSocket, connectSocket, onSocketEvent, offSocketEvent, emitSocketEvent, disconnectSocket } from '@/lib/socket-client';

// 3D 아바타를 동적으로 로드 (SSR 비활성화)
// GLTF 기반 Ready Player Me 아바타 사용
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

// ✅ 음성 모드 인터뷰 씬 동적 로드
const VoiceInterviewScene = dynamic(() => import('@/components/interview/VoiceInterviewScene'), {
  ssr: false,
  loading: () => {
    console.log('[Dynamic Import] VoiceInterviewScene 로딩 중...');
    return (
      <div className="flex items-center justify-center h-full bg-blue-500">
        <div className="text-white text-xl">VoiceInterviewScene 로딩 중...</div>
        <Loader2 className="h-8 w-8 animate-spin text-white ml-2" />
      </div>
    );
  },
});

interface Message {
  id: string;
  role: 'AI' | 'USER';
  content: string;
  timestamp: Date;
  feedback?: {
    feedback: string;
    strengths: string[];
    improvements: string[];
    score: number;
  };
  showFeedback?: boolean;
  isLoadingFeedback?: boolean;
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');
  const voiceModeParam = searchParams.get('voiceMode'); // URL 파라미터에서 모드 읽기
  
  const { user, isAuthenticated } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0); // 경과 시간
  const [isInterviewActive, setIsInterviewActive] = useState(true);
  const [interviewMode, setInterviewMode] = useState<'PRACTICE' | 'REAL'>('PRACTICE');
  
  // 진행 상태 (질문 개수)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10); // 기본값 10개 (API 응답 후 업데이트)
  
  // 웹캠 & 음성
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0); // 오디오 볼륨 (립싱크용)
  
  // UI 모드 - URL 파라미터에서 초기화 (기본값: true)
  const [isVoiceMode, setIsVoiceMode] = useState(voiceModeParam === 'true' || voiceModeParam === null); // 음성/채팅 모드
  
  // ✅ Client-side 체크 (Canvas는 브라우저에서만 렌더링)
  const [isClient, setIsClient] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false); // 자막 표시
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); // 현재 재생 중인 오디오 추적
  
  // ref를 사용하여 최신 stream과 mediaRecorder 값 추적
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
    
    loadInterview();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // cleanupMediaDevices는 별도 useEffect에서 처리
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마우스 움직임 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // 디버깅: 버튼 렌더링 상태 로그
  useEffect(() => {
    console.log('[Button Debug] 렌더링 상태:', {
      isVoiceMode,
      isInterviewActive,
      isRecording,
      containerHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
      timestamp: new Date().toISOString()
    });
  }, [isVoiceMode, isInterviewActive, isRecording]);

  // 페이지 이탈 시 미디어 디바이스 정리는 별도 useEffect로 처리 (cleanupMediaDevices 선언 이후)

  // 경과 시간 타이머
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // ✅ Client-side에서만 Canvas 렌더링 (SSR 방지)
  useEffect(() => {
    setIsClient(true);
    console.log('[Client Check] ✅ 클라이언트 사이드 렌더링 활성화');
  }, []);

  const loadInterview = async () => {
    if (!interviewId) return;
    
    try {
      const response = await interviewAPI.get(interviewId);
      const interview = response.data;
      
      console.log('[Interview] 인터뷰 데이터:', interview);
      
      setInterviewMode(interview.mode);
      setTimeLeft(interview.timeLimitSeconds);
      
      // 실제 질문 개수 설정 (설정에서 선택한 개수)
      if (interview.questionCount) {
        setTotalQuestions(interview.questionCount);
        console.log('[Interview] 질문 개수 설정:', interview.questionCount);
      } else if (interview.mode === 'ACTUAL') {
        // 실전 모드는 기본 10개
        setTotalQuestions(10);
      } else {
        // 연습 모드는 설정된 개수 (기본 5개)
        setTotalQuestions(interview.questionCount || 5);
      }
      
      // ✅ 서버의 isVoiceMode 값 반영 (모든 모드에서)
      if (interview.isVoiceMode !== undefined) {
        console.log('[Interview] 음성 모드 설정:', interview.isVoiceMode);
        setIsVoiceMode(interview.isVoiceMode);
      }
      
      // AI 인사 메시지
      const greeting = '안녕하세요! AI 면접관입니다. 편안하게 대화하듯이 답변해주시면 됩니다. 준비되셨나요?';
      setMessages([{
        id: `ai-${Date.now()}`,
        role: 'AI',
        content: greeting,
        timestamp: new Date(),
      }]);
      
      // 자막 표시
      if (showSubtitles) {
        setCurrentSubtitle(greeting);
      }
      
      // AI 인사말 음성 재생 (모든 모드에서 재생)
      await speakText(greeting);
      
    // 타이머 시작
    startTimer();
    
    // ✅ 음성 모드에서만 웹캠 자동 시작 시도 (서버 값 기준)
    if (interview.isVoiceMode) {
      setTimeout(() => {
        startCamera().catch((err) => {
          console.warn('카메라 시작 실패, 계속 진행:', err);
        });
      }, 500);
    }
    } catch (error: any) {
      console.error('인터뷰 로드 실패:', error);
      toast.error('인터뷰를 불러오는데 실패했습니다.');
      router.push('/interview/setup');
    }
  };

  // 타이머 시작
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

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !interviewId) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    
    const userMessageId = `user-${Date.now()}`;
    
    // 사용자 메시지 추가
    setMessages((prev) => [...prev, {
      id: userMessageId,
      role: 'USER',
      content: userMessage,
      timestamp: new Date(),
      showFeedback: false,
      isLoadingFeedback: false,
    }]);
    
    try {
      // Socket.IO를 통해 메시지 전송
      const socket = getSocket();
      if (!socket.connected) {
        connectSocket();
        await new Promise((resolve) => {
          socket.once('connect', resolve);
        });
      }
      
      // 기존 리스너 제거 (중복 방지)
      offSocketEvent('interview:question');
      
      // AI 응답 수신 리스너 등록
      const questionListener = async (data: any) => {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'AI',
          content: data.content,
          timestamp: new Date(data.createdAt),
        };
        setMessages((prev) => [...prev, aiMessage]);
        
        // 채팅 모드에서 사용자 메시지에 대한 피드백 자동 요청
        // AI 응답을 받은 후, 그 직전 사용자 메시지에 대한 피드백 요청
        if (!isVoiceMode && interviewMode === 'PRACTICE') {
          // 피드백 요청 (메시지 ID, 사용자 답변, AI 질문)
          // AI 질문은 사용자 답변 직전의 AI 메시지
          setTimeout(() => {
            setMessages((currentMessages) => {
              const userMsgIndex = currentMessages.findIndex(m => m.id === userMessageId);
              if (userMsgIndex > 0) {
                const aiQuestion = currentMessages[userMsgIndex - 1];
                if (aiQuestion && aiQuestion.role === 'AI') {
                  requestFeedback(userMessageId, userMessage, aiQuestion.content);
                }
              }
              return currentMessages;
            });
          }, 500);
        }
        
        // 자막 표시
        if (showSubtitles) {
          setCurrentSubtitle(data.content);
        }
        
        // AI 응답을 항상 음성으로 재생 (채팅/음성 모드 모두)
        await speakText(data.content);
        
        setIsSending(false);
      };
      
      onSocketEvent('interview:question', questionListener);
      
      // 메시지 전송
      emitSocketEvent('interview:message', {
        interviewId,
        content: userMessage,
        contentType: 'TEXT',
      });
    } catch (error: any) {
      console.error('메시지 전송 실패:', error);
      toast.error('메시지 전송에 실패했습니다.');
      setIsSending(false);
    }
  };

  // 웹캠 시작 (선택사항 - 기기 없어도 진행 가능)
  const startCamera = async () => {
    try {
      console.log('[Camera] 카메라 시작 시도...');
      
      // 미디어 기기 존재 여부 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[Camera] 미디어 기기가 지원되지 않습니다.');
        toast('카메라 없이 진행합니다.', { icon: 'ℹ️' });
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false, // 오디오는 녹음 시에만 별도로 요청
      });
      
      console.log('[Camera] 카메라 스트림 획득 성공', {
        tracks: mediaStream.getTracks().length,
        videoTrack: mediaStream.getVideoTracks()[0]?.label
      });
      
      setStream(mediaStream);
      streamRef.current = mediaStream; // ref에도 저장
      setIsCameraOn(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('[Camera] 비디오 엘리먼트에 스트림 연결 완료');
      }
      
      toast.success('카메라가 활성화되었습니다.');
    } catch (error: any) {
      console.error('[Camera] 카메라 접근 실패:', error);
      
      // 기기가 없거나 권한 거부 시에도 진행 가능
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast('카메라/마이크가 없습니다. 카메라 없이 진행합니다.', { icon: 'ℹ️' });
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast('카메라 권한이 거부되었습니다. 카메라 없이 진행합니다.', { icon: 'ℹ️' });
      } else {
        toast('카메라를 사용할 수 없습니다. 카메라 없이 진행합니다.', { icon: 'ℹ️' });
      }
      
      // 에러 발생해도 인터뷰는 계속 진행
      setIsCameraOn(false);
      setStream(null);
    }
  };

  // 미디어 디바이스 완전 정리 (카메라, 마이크, 오디오)
  // ref를 사용하여 최신 값을 참조하고, 의존성 배열을 비워서 무한 루프 방지
  const cleanupMediaDevices = useCallback(() => {
    console.log('[Cleanup] 미디어 디바이스 정리 시작...');
    
    // 1. 스트림 중지 (카메라 + 마이크) - ref에서 최신 값 가져오기
    const currentStream = streamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        track.stop();
        console.log(`[Cleanup] ${track.kind} track stopped`);
      });
      streamRef.current = null;
      setStream(null);
    }
    
    // 2. MediaRecorder 중지 - ref에서 최신 값 가져오기
    const currentRecorder = mediaRecorderRef.current;
    if (currentRecorder && currentRecorder.state !== 'inactive') {
      currentRecorder.stop();
      console.log('[Cleanup] MediaRecorder stopped');
      mediaRecorderRef.current = null;
      setMediaRecorder(null);
    }
    
    // 3. 오디오 재생 중지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
      console.log('[Cleanup] Audio playback stopped');
    }
    
    // 4. 비디오 엘리먼트 정리
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOn(false);
    setIsRecording(false);
    setIsAISpeaking(false);
    
    console.log('[Cleanup] 미디어 디바이스 정리 완료');
  }, []); // 의존성 배열을 비워서 함수가 재생성되지 않도록 함

  // 페이지 이탈 시 미디어 디바이스 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupMediaDevices();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupMediaDevices();
    };
  }, [cleanupMediaDevices]);

  // 웹캠 중지 (하위 호환성)
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // 음성 녹음 시작
  const startRecording = async () => {
    try {
      // 사용할 스트림 (기존 또는 새로 생성)
      let activeStream = streamRef.current || stream;
      
      // 스트림이 없거나 비활성화된 경우 마이크만 요청
      if (!activeStream || !activeStream.active) {
        try {
          console.log('[Recording] 마이크 권한 요청 중...');
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setStream(audioStream);
          streamRef.current = audioStream; // ref에도 저장
          activeStream = audioStream;
          console.log('[Recording] 마이크 스트림 획득 성공', {
            tracks: audioStream.getTracks().length,
            active: audioStream.active
          });
        } catch (error: any) {
          console.error('[Recording] 마이크 접근 실패:', error);
          
          if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            toast.error('마이크가 연결되어 있지 않습니다. 텍스트로 답변해주세요.');
          } else if (error.name === 'NotAllowedError') {
            toast.error('마이크 권한이 거부되었습니다. 텍스트로 답변해주세요.');
          } else {
            toast.error('마이크를 사용할 수 없습니다. 텍스트로 답변해주세요.');
          }
          return;
        }
      }
      
      // activeStream이 유효한지 확인
      if (!activeStream || !activeStream.active) {
        console.error('[Recording] 유효하지 않은 스트림');
        toast.error('마이크 스트림이 유효하지 않습니다.');
        return;
      }
      
      console.log('[Recording] MediaRecorder 생성 중...', {
        streamId: activeStream.id,
        tracks: activeStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState }))
      });
      
      const recorder = new MediaRecorder(activeStream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log(`[Recording] 데이터 수신: ${e.data.size} bytes`);
        }
      };
      
      recorder.onstop = async () => {
        console.log('[Recording] 녹음 종료, STT 전송 중...', { chunks: chunks.length });
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log('[Recording] 오디오 Blob 생성:', { size: audioBlob.size, type: audioBlob.type });
        await sendAudioToSTT(audioBlob);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      mediaRecorderRef.current = recorder; // ref에도 저장
      setIsRecording(true);
      setAudioChunks(chunks);
      console.log('[Recording] 녹음 시작 완료, state:', recorder.state);
      toast.success('녹음을 시작합니다');
    } catch (error: any) {
      console.error('[Recording] 녹음 시작 실패:', error);
      toast.error(`녹음을 시작할 수 없습니다: ${error.message}`);
    }
  };

  // 음성 녹음 중지
  const stopRecording = () => {
    const currentRecorder = mediaRecorderRef.current || mediaRecorder;
    if (currentRecorder && currentRecorder.state === 'recording') {
      console.log('[Recording] 녹음 중지 요청');
      currentRecorder.stop();
      setIsRecording(false);
    } else {
      console.warn('[Recording] 녹음 중지 실패 - 녹음 중이 아님', {
        recorder: !!currentRecorder,
        state: currentRecorder?.state
      });
    }
  };

  // STT: 음성 → 텍스트 → 자동 전송
  const sendAudioToSTT = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/ai/stt/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('STT 실패');
      
      const data = await response.json();
      const transcribedText = data.text;
      
      // 텍스트 변환 성공 메시지
      toast.success('음성이 텍스트로 변환되었습니다!');
      
      // 자동으로 메시지 전송
      if (transcribedText && transcribedText.trim()) {
        // 사용자 메시지 추가
        setMessages((prev) => [...prev, {
          role: 'USER',
          content: transcribedText,
          timestamp: new Date(),
        }]);
        
        setIsSending(true);
        
        try {
          // Socket.IO를 통해 메시지 전송
          const socket = getSocket();
          if (!socket.connected) {
            connectSocket();
            await new Promise((resolve) => {
              socket.once('connect', resolve);
            });
          }
          
          // 기존 리스너 제거 (중복 방지)
          offSocketEvent('interview:question');
          
          // AI 응답 수신 리스너 등록
          const questionListener = async (data: any) => {
            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              role: 'AI',
              content: data.content,
              timestamp: new Date(data.createdAt),
            };
            setMessages((prev) => [...prev, aiMessage]);
            
            // 자막 표시
            if (showSubtitles) {
              setCurrentSubtitle(data.content);
            }
            
            // AI 응답을 항상 음성으로 재생
            await speakText(data.content);
            
            setIsSending(false);
          };
          
          onSocketEvent('interview:question', questionListener);
          
          // 메시지 전송
          emitSocketEvent('interview:message', {
            interviewId,
            content: transcribedText,
            contentType: 'TEXT',
          });
        } catch (error: any) {
          console.error('메시지 전송 실패:', error);
          toast.error('메시지 전송에 실패했습니다.');
          setIsSending(false);
        }
      }
    } catch (error) {
      console.error('STT 실패:', error);
      toast.error('음성 인식에 실패했습니다.');
    }
  };

  // 오디오 분석 시작 (립싱크용)
  const startAudioAnalysis = (audioElement: HTMLAudioElement) => {
    try {
      // AudioContext가 없으면 생성
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('[Audio Analysis] AudioContext 생성');
      }
      
      const audioContext = audioContextRef.current;
      
      // 이미 연결된 소스가 있으면 재사용하지 않고 새로 생성
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }
      
      // 오디오 소스 생성
      const source = audioContext.createMediaElementSource(audioElement);
      audioSourceRef.current = source;
      
      // Analyser 노드 생성
      if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256; // FFT 크기 (주파수 분석 해상도)
        analyserRef.current.smoothingTimeConstant = 0.8; // 부드러운 전환
      }
      
      const analyser = analyserRef.current;
      
      // 오디오 그래프 연결: source -> analyser -> destination
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // 실시간 볼륨 분석
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const analyzeVolume = () => {
        if (!currentAudioRef.current || currentAudioRef.current.paused) {
          setAudioVolume(0);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        
        // 평균 볼륨 계산 (0-255 -> 0-1)
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / dataArray.length;
        const normalizedVolume = average / 255;
        
        setAudioVolume(normalizedVolume);
        
        animationFrameRef.current = requestAnimationFrame(analyzeVolume);
      };
      
      analyzeVolume();
      console.log('[Audio Analysis] 오디오 분석 시작');
      
    } catch (error) {
      console.error('[Audio Analysis] 오디오 분석 시작 실패:', error);
      // 에러가 발생해도 오디오 재생은 계속됨
    }
  };
  
  // TTS: 텍스트 → 음성
  const speakText = async (text: string) => {
    if (!text) return;
    
    // 이전 오디오가 재생 중이면 중단 (중복 방지)
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setAudioVolume(0);
    }
    
    // 이전 애니메이션 프레임 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsAISpeaking(true);
    
    // 자막 표시
    if (showSubtitles) {
      setCurrentSubtitle(text);
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/ai/tts/speak-korean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'onyx', model: 'tts-1', speed: 1.0 }), // onyx: 깊고 권위있는 남성 목소리
      });
      
      if (!response.ok) throw new Error('TTS 실패');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio; // 현재 오디오 추적
      
      // 오디오 분석 시작 (립싱크)
      audio.onloadedmetadata = () => {
        startAudioAnalysis(audio);
      };
      
      audio.onended = () => {
        setIsAISpeaking(false);
        setAudioVolume(0);
        currentAudioRef.current = null;
        
        // 애니메이션 프레임 정리
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // 자막 유지 (3초 후 지우기)
        setTimeout(() => {
          setCurrentSubtitle('');
        }, 3000);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsAISpeaking(false);
        setAudioVolume(0);
        currentAudioRef.current = null;
        setCurrentSubtitle('');
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
      
      await audio.play();
      console.log('[TTS] 오디오 재생 시작');
    } catch (error) {
      console.error('TTS 실패:', error);
      setIsAISpeaking(false);
      setAudioVolume(0);
      currentAudioRef.current = null;
      setCurrentSubtitle('');
    }
  };

  // 피드백 토글 (채팅 모드)
  const toggleFeedback = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, showFeedback: !msg.showFeedback }
          : msg
      )
    );
  };

  // 피드백 요청 (채팅 모드)
  const requestFeedback = async (messageId: string, userAnswer: string, aiQuestion: string) => {
    // 피드백 로딩 시작
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, isLoadingFeedback: true }
          : msg
      )
    );

    try {
      const response = await feedbackAPI.getInstantFeedback({
        question: aiQuestion,
        answer: userAnswer,
        questionType: 'competency',
      });

      // 피드백 추가
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                feedback: response.data,
                isLoadingFeedback: false,
              }
            : msg
        )
      );
    } catch (error: any) {
      console.error('피드백 요청 실패:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isLoadingFeedback: false }
            : msg
        )
      );
      // toast.error('피드백을 불러오는데 실패했습니다.');
    }
  };

  // 인터뷰 종료
  const handleEndInterview = async () => {
    if (!interviewId) return;
    
    setIsInterviewActive(false);
    
    // 미디어 디바이스 즉시 정리
    cleanupMediaDevices();
    
    try {
      await interviewAPI.complete(interviewId, { elapsedSeconds });
      toast.success('인터뷰가 종료되었습니다. 평가 결과를 확인해주세요.');
      router.push(`/evaluation/${interviewId}`);
    } catch (error: any) {
      console.error('인터뷰 종료 실패:', error);
      toast.error('인터뷰 종료에 실패했습니다.');
    }
  };

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen flex flex-col ${isVoiceMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 1. 헤더 (test-chat 스타일) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom py-4">
          {/* 첫 번째 줄: 나가기 버튼 + 타이틀 + 진행/타이머 */}
          <div className="flex items-center justify-between">
            {/* 좌측 */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (confirm('인터뷰를 종료하시겠습니까?')) {
                    handleEndInterview();
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                나가기
              </Button>
              
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">
                  {interviewMode === 'PRACTICE' ? '연습 모드' : '실전 모드'}
                </h1>
                {interviewMode === 'PRACTICE' && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    연습
                  </span>
                )}
              </div>
            </div>
            
            {/* 우측 */}
            <div className="flex items-center gap-6">
              {/* 진행률 */}
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">
                  {currentQuestionIndex + 1} / {totalQuestions}
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
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>


      {/* 2. 콘텐츠 영역 */}
      <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {isVoiceMode ? (
          // ✅ 음성 모드: VoiceInterviewScene 컴포넌트 사용 (Client-side 체크만 - Dynamic import가 이미 로딩 처리함)
          isClient ? (
            <VoiceInterviewScene
              isAISpeaking={isAISpeaking}
              audioVolume={audioVolume}
              isCameraOn={isCameraOn}
              videoRef={videoRef}
              isRecording={isRecording}
              isInterviewActive={isInterviewActive}
              currentSubtitle={currentSubtitle}
              showSubtitles={showSubtitles}
              onMicClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              mousePosition={mousePosition}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-radial from-gray-800 via-gray-900 to-black">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
                <p className="text-white text-xl">환경 설정 중...</p>
              </div>
            </div>
          )
        ) : (
          // 채팅 모드: test-chat 스타일 with 피드백
          <div className="container-custom py-6 max-w-4xl mx-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={message.id || `${message.role}-${index}`}
                  className={`flex flex-col ${message.role === 'USER' ? 'items-end' : 'items-start'}`}
                >
                  {/* 메시지 버블 */}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'USER'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {/* AI 아이콘 */}
                    {message.role === 'AI' && (
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    <p className={`text-xs mt-1 ${message.role === 'USER' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* 피드백 버튼 및 내용 (사용자 메시지에만 표시, 연습 모드 채팅일 때) */}
                  {message.role === 'USER' && interviewMode === 'PRACTICE' && !isVoiceMode && (
                    <div className="mt-2 max-w-[80%] w-full">
                      {/* 피드백 로딩 중 */}
                      {message.isLoadingFeedback && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>피드백 분석 중...</span>
                          </div>
                        </div>
                      )}

                      {/* 피드백 버튼 */}
                      {!message.isLoadingFeedback && message.feedback && (
                        <button
                          onClick={() => toggleFeedback(message.id)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
                        >
                          {message.showFeedback ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {message.showFeedback ? '피드백 숨기기' : '피드백 보기'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            <TrendingUp className="h-3 w-3" />
                            {message.feedback.score}점
                          </span>
                        </button>
                      )}

                      {/* 피드백 내용 */}
                      {!message.isLoadingFeedback && message.feedback && message.showFeedback && (
                        <div className="mt-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
                          {/* 전체 피드백 */}
                          <div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {message.feedback.feedback}
                            </p>
                          </div>

                          {/* 강점 */}
                          {message.feedback.strengths && message.feedback.strengths.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                <h4 className="text-sm font-semibold text-green-700">강점</h4>
                              </div>
                              <ul className="space-y-1">
                                {message.feedback.strengths.map((strength, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 개선점 */}
                          {message.feedback.improvements && message.feedback.improvements.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Lightbulb className="h-4 w-4 text-amber-600" />
                                <h4 className="text-sm font-semibold text-amber-700">개선할 점</h4>
                              </div>
                              <ul className="space-y-1">
                                {message.feedback.improvements.map((improvement, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">•</span>
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* AI 응답 대기 중 */}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-gray-600">
                        AI가 응답을 준비하고 있습니다<span className="animate-pulse">...</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. 하단 컨트롤 */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-10">
        <div className="container-custom py-4">
          {!isVoiceMode && (
            // 채팅 모드: 입력창 (test-chat과 동일)
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (inputMessage.trim()) handleSendMessage();
              }} 
              className="flex items-end gap-3"
            >
              <div className="flex-1">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  disabled={isSending || !isInterviewActive}
                  className="min-h-[48px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputMessage.trim()) handleSendMessage();
                    }
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isSending || !isInterviewActive}
                size="lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewStartPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    }>
      <InterviewContent />
    </Suspense>
  );
}
