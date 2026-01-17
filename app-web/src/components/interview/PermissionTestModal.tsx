'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Mic, Check, X, Volume2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PermissionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isVoiceMode: boolean;
}

export function PermissionTestModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  isVoiceMode 
}: PermissionTestModalProps) {
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false); // 중복 클릭 방지
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsConfirming(false); // 모달 열릴 때 확인 중 상태 초기화
      requestPermissions();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    // 비디오 스트림 정리
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    // 오디오 스트림 정리
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    
    // 오디오 컨텍스트 정리
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // 애니메이션 프레임 정리
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const requestPermissions = async () => {
    // 카메라 권한 요청
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setCameraStream(stream);
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      console.error('카메라 권한 오류:', error);
      setCameraPermission('denied');
      toast.error('카메라 권한이 필요합니다.');
    }

    // 마이크 권한 요청 (음성 모드일 때만)
    if (isVoiceMode) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream);
        setMicPermission('granted');
        
        // 오디오 레벨 모니터링 시작
        startAudioMonitoring(stream);
      } catch (error: any) {
        console.error('마이크 권한 오류:', error);
        setMicPermission('denied');
        toast.error('마이크 권한이 필요합니다.');
      }
    } else {
      setMicPermission('granted'); // 채팅 모드는 마이크 불필요
    }
  };

  const startAudioMonitoring = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 255) * 200)); // 0-100 범위로 정규화
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (error) {
      console.error('오디오 모니터링 시작 실패:', error);
    }
  };

  const handleConfirm = () => {
    // 이미 확인 중이면 중복 실행 방지
    if (isConfirming) {
      return;
    }
    
    if (cameraPermission !== 'granted') {
      toast.error('카메라 권한이 필요합니다.');
      return;
    }
    
    if (isVoiceMode && micPermission !== 'granted') {
      toast.error('마이크 권한이 필요합니다.');
      return;
    }
    
    setIsConfirming(true); // 확인 중 플래그 설정
    cleanup();
    onConfirm();
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const getPermissionIcon = (status: 'pending' | 'granted' | 'denied') => {
    switch (status) {
      case 'granted':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'denied':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400 animate-pulse" />;
    }
  };

  const getPermissionText = (status: 'pending' | 'granted' | 'denied') => {
    switch (status) {
      case 'granted':
        return <span className="text-green-600 font-medium">권한 허용됨</span>;
      case 'denied':
        return <span className="text-red-600 font-medium">권한 거부됨</span>;
      default:
        return <span className="text-gray-500">권한 요청 중...</span>;
    }
  };

  const canProceed = cameraPermission === 'granted' && 
                     (!isVoiceMode || micPermission === 'granted');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">장비 테스트</DialogTitle>
          <DialogDescription className="text-sm">
            카메라와 마이크를 빠르게 테스트하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 카메라 미리보기 - 컴팩트 버전 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium">카메라</span>
                {getPermissionText(cameraPermission)}
              </div>
              {getPermissionIcon(cameraPermission)}
            </div>
            
            <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {cameraPermission === 'denied' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <div className="text-center text-white">
                    <X className="mx-auto h-8 w-8 mb-1" />
                    <p className="text-sm font-medium">카메라 권한 거부됨</p>
                  </div>
                </div>
              )}
              {cameraPermission === 'pending' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <Camera className="mx-auto h-8 w-8 mb-1 animate-pulse" />
                    <p className="text-sm font-medium">권한 요청 중...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 마이크 테스트 (음성 모드만) - 컴팩트 버전 */}
          {isVoiceMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-medium">마이크</span>
                  {getPermissionText(micPermission)}
                </div>
                {getPermissionIcon(micPermission)}
              </div>
              
              {/* 오디오 레벨 인디케이터 - 컴팩트 */}
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {micPermission === 'granted' 
                  ? '말해보세요. 막대가 움직이면 정상입니다.' 
                  : '마이크 권한을 허용해주세요.'}
              </p>
            </div>
          )}

          {/* 안내 메시지 - 컴팩트 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-900">
                <p className="font-semibold mb-1">안내</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>조용하고 밝은 장소를 선택하세요.</li>
                  {isVoiceMode && <li>음성 모드는 마이크 권한이 필요합니다.</li>}
                  <li>권한 거부 시 브라우저 설정에서 허용해주세요.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            size="sm"
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canProceed || isConfirming}
            className="flex-1"
            size="sm"
          >
            {isConfirming ? '시작 중...' : canProceed ? '인터뷰 시작' : '권한 허용 필요'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

