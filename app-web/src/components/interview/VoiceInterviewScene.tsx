'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInterviewSceneProps {
  isAISpeaking: boolean;
  audioVolume: number;
  isCameraOn: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
  isInterviewActive: boolean;
  currentSubtitle?: string;
  showSubtitles: boolean;
  onMicClick: () => void;
  mousePosition: { x: number; y: number };
}

/**
 * GLTF 3D 아바타 (Ready Player Me 모델) - AIAvatarTest 패턴 적용
 */
function GLTFAvatar({ 
  isSpeaking, 
  audioVolume,
  mousePosition 
}: { 
  isSpeaking: boolean; 
  audioVolume: number;
  mousePosition: { x: number; y: number };
}) {
  const DEFAULT_MODEL_URL = process.env.NEXT_PUBLIC_AVATAR_MODEL_URL || 
    'https://models.readyplayer.me/65a8dba831b23abb4f401bae.glb';
  
  console.log('[GLTFAvatar] 모델 URL:', DEFAULT_MODEL_URL);
  
  // GLTF 모델 로드
  const { scene, animations } = useGLTF(DEFAULT_MODEL_URL);
  
  // 모델 복제
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);
  
  // 애니메이션 설정
  const { actions } = useAnimations(animations, clone);
  
  // Refs
  const avatarRef = useRef<THREE.Group>(null);
  const blinkTimerRef = useRef(0);
  
  // 초기 애니메이션 재생
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      firstAction?.play();
    }
  }, [actions]);
  
  // 프레임별 애니메이션
  useFrame((state, delta) => {
    if (!avatarRef.current) return;
    
    // 숨쉬기 애니메이션
    const breathe = Math.sin(state.clock.elapsedTime * 1.2) * 0.01;
    avatarRef.current.scale.y = 1 + breathe;
    avatarRef.current.scale.x = 1 - breathe * 0.5;
    
    // 마우스 추적 (부드러운 회전)
    if (mousePosition) {
      const targetRotationY = (mousePosition.x - window.innerWidth / 2) / window.innerWidth * 0.15;
      const targetRotationX = -(mousePosition.y - window.innerHeight / 2) / window.innerHeight * 0.1;
      
      avatarRef.current.rotation.y = THREE.MathUtils.lerp(
        avatarRef.current.rotation.y,
        targetRotationY,
        0.05
      );
      avatarRef.current.rotation.x = THREE.MathUtils.lerp(
        avatarRef.current.rotation.x,
        targetRotationX,
        0.05
      );
    }
    
    // 립싱크 (Morph Targets 사용) - AIAvatarTest 방식
    const headMesh = nodes.Wolf3D_Head as THREE.SkinnedMesh;
    
    if (headMesh && headMesh.morphTargetDictionary && headMesh.morphTargetInfluences) {
      if (isSpeaking) {
        // 간단한 립싱크 애니메이션 (음소 순환)
        const visemeIndex = Math.floor(state.clock.elapsedTime * 5) % 3;
        const visemes = ['viseme_aa', 'viseme_O', 'viseme_I'];
        const currentViseme = visemes[visemeIndex];
        
        // Morph Target 적용
        const targetIndex = headMesh.morphTargetDictionary[currentViseme];
        if (targetIndex !== undefined) {
          headMesh.morphTargetInfluences[targetIndex] = THREE.MathUtils.lerp(
            headMesh.morphTargetInfluences[targetIndex] || 0,
            0.6 * (audioVolume > 0 ? audioVolume : 1), // 오디오 볼륨 반영
            0.3
          );
        }
        
        // 다른 viseme들은 0으로
        Object.keys(headMesh.morphTargetDictionary).forEach((key) => {
          if (key !== currentViseme && key.startsWith('viseme')) {
            const index = headMesh.morphTargetDictionary[key];
            headMesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
              headMesh.morphTargetInfluences[index] || 0,
              0,
              0.3
            );
          }
        });
      } else {
        // 침묵 상태로 전환
        Object.keys(headMesh.morphTargetDictionary).forEach((key) => {
          if (key.startsWith('viseme')) {
            const index = headMesh.morphTargetDictionary[key];
            headMesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
              headMesh.morphTargetInfluences[index] || 0,
              0,
              0.2
            );
          }
        });
      }
    }
    
    // 눈 깜빡임
    blinkTimerRef.current += delta;
    const shouldBlink = blinkTimerRef.current > 3 && blinkTimerRef.current < 3.2;
    if (blinkTimerRef.current > 4) blinkTimerRef.current = 0;
    
    if (headMesh && headMesh.morphTargetDictionary && shouldBlink) {
      const eyeBlinkLeftIndex = headMesh.morphTargetDictionary['eyeBlinkLeft'];
      const eyeBlinkRightIndex = headMesh.morphTargetDictionary['eyeBlinkRight'];
      
      if (eyeBlinkLeftIndex !== undefined) {
        headMesh.morphTargetInfluences[eyeBlinkLeftIndex] = 1;
      }
      if (eyeBlinkRightIndex !== undefined) {
        headMesh.morphTargetInfluences[eyeBlinkRightIndex] = 1;
      }
    } else if (headMesh && headMesh.morphTargetDictionary) {
      const eyeBlinkLeftIndex = headMesh.morphTargetDictionary['eyeBlinkLeft'];
      const eyeBlinkRightIndex = headMesh.morphTargetDictionary['eyeBlinkRight'];
      
      if (eyeBlinkLeftIndex !== undefined) {
        headMesh.morphTargetInfluences[eyeBlinkLeftIndex] = THREE.MathUtils.lerp(
          headMesh.morphTargetInfluences[eyeBlinkLeftIndex] || 0,
          0,
          0.4
        );
      }
      if (eyeBlinkRightIndex !== undefined) {
        headMesh.morphTargetInfluences[eyeBlinkRightIndex] = THREE.MathUtils.lerp(
          headMesh.morphTargetInfluences[eyeBlinkRightIndex] || 0,
          0,
          0.4
        );
      }
    }
  });
  
  return (
    <group 
      ref={avatarRef} 
      scale={0.9}
      position={[0, 0, 0]}
    >
      <primitive object={clone} />
    </group>
  );
}

/**
 * 음성 모드 인터뷰 씬 (3D 아바타 + 웹캠 + 마이크 + 자막)
 */
export default function VoiceInterviewScene({
  isAISpeaking,
  audioVolume,
  isCameraOn,
  videoRef,
  isRecording,
  isInterviewActive,
  currentSubtitle,
  showSubtitles,
  onMicClick,
  mousePosition,
}: VoiceInterviewSceneProps) {
  
  // 디버깅 로그 (마운트 시 1회만)
  useEffect(() => {
    console.log('[VoiceScene] ✅ 마운트 완료!');
    console.log('[VoiceScene] Props:', { isAISpeaking, isCameraOn, isRecording, isInterviewActive });
    
    return () => {
      console.log('[VoiceScene] ❌ 언마운트됨');
    };
  }, []);
  
  return (
    <div className="h-full w-full relative">
      {/* 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-800 via-gray-900 to-black" />
      
      {/* 3D 아바타 Canvas - AIAvatarTest 패턴 적용 */}
      <Canvas
        camera={{ position: [0.004, 0.662, 0.496], fov: 50 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={() => console.log('[Canvas] ✅ WebGL 렌더러 생성 완료!')}
      >
        {/* 조명 */}
        <ambientLight intensity={1.9} />
        <directionalLight position={[5, 5, 5]} intensity={1.4} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.5} />
        <pointLight position={[-5, 5, 0]} intensity={0.4} />
        
        {/* 환경 */}
        <Environment preset="city" />
        
        {/* 카메라 컨트롤 */}
        <OrbitControls 
          target={[0, 0.6, 0]} 
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* 3D 아바타 */}
        <GLTFAvatar 
          isSpeaking={isAISpeaking}
          audioVolume={audioVolume}
          mousePosition={mousePosition}
        />
      </Canvas>
      
      {/* 웹캠 (PIP - 오른쪽 상단) */}
      {isCameraOn && (
        <div className="absolute top-20 right-4 z-20 w-56 h-40 bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-white/30">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover" 
          />
          {/* 웹캠 라벨 */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            나의 캠
          </div>
        </div>
      )}
      
      {/* 글래시즘 마이크 버튼 (아바타 하단) */}
      <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onMicClick}
          disabled={!isInterviewActive}
          className={`
            group relative h-20 w-20 rounded-full
            bg-white/10 backdrop-blur-xl
            border-2 border-white/40
            shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
            hover:bg-white/20 hover:border-white/50
            active:scale-95
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isRecording ? 'animate-pulse bg-red-500/30 border-red-400/70' : ''}
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
          
          {/* 리플 효과 (녹음 중) */}
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
        <div className="absolute bottom-[25%] left-0 right-0 flex justify-center px-4 z-10">
          <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-lg max-w-3xl text-center text-lg text-white">
            {currentSubtitle}
          </div>
        </div>
      )}
    </div>
  );
}

// GLTF 모델 프리로드 - AIAvatarTest 패턴 적용
const PRELOAD_URL = process.env.NEXT_PUBLIC_AVATAR_MODEL_URL || 
  'https://models.readyplayer.me/65a8dba831b23abb4f401bae.glb';

try {
  useGLTF.preload(PRELOAD_URL);
  console.log('[VoiceScene] 모델 프리로드 완료:', PRELOAD_URL);
} catch (error) {
  console.error('[VoiceScene] 프리로드 실패:', error);
}

