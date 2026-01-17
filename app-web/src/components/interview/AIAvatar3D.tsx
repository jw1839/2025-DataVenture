'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';

interface AIAvatarProps {
  isSpeaking?: boolean;
  audioVolume?: number; // 0-1 범위의 오디오 볼륨 (립싱크용)
  emotion?: 'neutral' | 'happy' | 'thinking' | 'surprised';
  className?: string;
  mousePosition?: { x: number; y: number };
}

/**
 * 전문가급 자연스러운 3D 아바타 헤드
 * - 부드러운 곡률과 자연스러운 비율
 * - 고품질 조명과 재질
 * - 미세한 애니메이션 디테일
 */
function ProfessionalHead({ isSpeaking, audioVolume = 0, emotion, mousePosition }: Pick<AIAvatarProps, 'isSpeaking' | 'audioVolume' | 'emotion' | 'mousePosition'>) {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const leftEyelidTopRef = useRef<THREE.Mesh>(null);
  const rightEyelidTopRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const blinkTimerRef = useRef(0);
  
  // 애니메이션
  useFrame((state, delta) => {
    if (!headRef.current) return;
    
    // 미세한 숨쉬기 (더 자연스럽게)
    const breathe = Math.sin(state.clock.elapsedTime * 1.2) * 0.008;
    headRef.current.scale.y = 1 + breathe;
    headRef.current.scale.x = 1 - breathe * 0.5;
    
    // 마우스 추적 - 매우 부드럽게
    if (mousePosition) {
      const targetRotationY = (mousePosition.x - window.innerWidth / 2) / window.innerWidth * 0.2;
      const targetRotationX = -(mousePosition.y - window.innerHeight / 2) / window.innerHeight * 0.12;
      
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        targetRotationY,
        0.06
      );
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        targetRotationX,
        0.06
      );
      
      // 눈동자도 마우스 추적
      if (leftPupilRef.current && rightPupilRef.current) {
        const pupilOffsetX = targetRotationY * 0.12;
        const pupilOffsetY = -targetRotationX * 0.12;
        
        leftPupilRef.current.position.x = THREE.MathUtils.lerp(leftPupilRef.current.position.x, -0.32 + pupilOffsetX, 0.1);
        leftPupilRef.current.position.y = THREE.MathUtils.lerp(leftPupilRef.current.position.y, 0.12 + pupilOffsetY, 0.1);
        rightPupilRef.current.position.x = THREE.MathUtils.lerp(rightPupilRef.current.position.x, 0.32 + pupilOffsetX, 0.1);
        rightPupilRef.current.position.y = THREE.MathUtils.lerp(rightPupilRef.current.position.y, 0.12 + pupilOffsetY, 0.1);
      }
    }
    
    // 말할 때 입 움직임 (립싱크 - 오디오 볼륨 기반)
    if (mouthRef.current && isSpeaking && audioVolume > 0) {
      // audioVolume (0-1)을 입 벌림 정도로 변환
      // 볼륨이 작아도 보이도록 최소값 설정
      const volumeScale = Math.max(audioVolume * 2, 0.1); // 최소 10% 벌림
      const mouthOpen = volumeScale * 0.12; // 최대 12% 벌림
      
      // 부드러운 전환
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        1 + mouthOpen * 2,
        0.3 // 빠른 응답
      );
      mouthRef.current.position.y = THREE.MathUtils.lerp(
        mouthRef.current.position.y,
        -0.38 - mouthOpen * 0.5,
        0.3
      );
    } else if (mouthRef.current) {
      // 입 닫기
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 1, 0.2);
      mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.38, 0.2);
    }
    
    // 턱 움직임 (오디오 볼륨 기반)
    if (jawRef.current && isSpeaking && audioVolume > 0) {
      const volumeScale = Math.max(audioVolume * 2, 0.1);
      const jawOpen = volumeScale * 0.08;
      
      jawRef.current.position.y = THREE.MathUtils.lerp(
        jawRef.current.position.y,
        -0.68 - jawOpen,
        0.3
      );
    } else if (jawRef.current) {
      // 턱 닫기
      jawRef.current.position.y = THREE.MathUtils.lerp(jawRef.current.position.y, -0.68, 0.2);
    }
    
    // 눈 깜빡임 (더 자연스러운 타이밍)
    blinkTimerRef.current += delta;
    const shouldBlink = blinkTimerRef.current > 3.5 && blinkTimerRef.current < 3.65;
    if (blinkTimerRef.current > 4.5) blinkTimerRef.current = 0;
    
    if (leftEyelidTopRef.current && rightEyelidTopRef.current) {
      const eyelidScale = shouldBlink ? 1.5 : 0.05;
      leftEyelidTopRef.current.scale.y = THREE.MathUtils.lerp(leftEyelidTopRef.current.scale.y, eyelidScale, 0.4);
      rightEyelidTopRef.current.scale.y = THREE.MathUtils.lerp(rightEyelidTopRef.current.scale.y, eyelidScale, 0.4);
    }
  });
  
  // 감정별 설정
  const emotionConfig = {
    neutral: { cheekColor: '#ffccd5', eyebrowY: 0, mouthCurve: 0.05 },
    happy: { cheekColor: '#ffd9e6', eyebrowY: 0.03, mouthCurve: 0.08 },
    thinking: { cheekColor: '#e6d9ff', eyebrowY: -0.02, mouthCurve: 0.03 },
    surprised: { cheekColor: '#fff9cc', eyebrowY: 0.08, mouthCurve: 0.1 },
  };
  
  const config = emotionConfig[emotion || 'neutral'];
  
  // 피부색 (자연스러운 톤)
  const skinColor = '#ffe4d0';
  const skinDarker = '#ffd4b8';
  
  return (
    <group ref={headRef}>
      {/* 후광 효과 (말할 때만) */}
      {isSpeaking && (
        <mesh rotation={[0, 0, 0]} position={[0, 0, -0.3]}>
          <torusGeometry args={[1.6, 0.04, 16, 100]} />
          <meshBasicMaterial color="#a0d8ff" transparent opacity={0.25} />
        </mesh>
      )}
      
      {/* 머리 (타원형 - 더 자연스러운 비율) */}
      <Sphere args={[1, 128, 128]} scale={[0.92, 1, 0.85]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={skinColor}
          roughness={0.7} 
          metalness={0.02}
          emissive={isSpeaking ? '#ffb3a0' : '#000000'}
          emissiveIntensity={isSpeaking ? 0.12 : 0}
        />
      </Sphere>
      
      {/* 머리카락 (자연스러운 형태) */}
      <group position={[0, 0.25, 0]}>
        {/* 메인 헤어 */}
        <Sphere args={[1.08, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.65]} scale={[0.92, 1, 0.85]} castShadow>
          <meshStandardMaterial 
            color="#3d2e24" // 자연스러운 갈색
            roughness={0.85}
            metalness={0}
          />
        </Sphere>
        {/* 앞머리 */}
        <Box args={[0.7, 0.15, 0.15]} position={[0, 0.25, 0.75]} rotation={[0.2, 0, 0]} castShadow>
          <meshStandardMaterial color="#3d2e24" roughness={0.85} />
        </Box>
      </group>
      
      {/* 이마 하이라이트 */}
      <Sphere args={[0.25, 32, 32]} position={[0, 0.35, 0.8]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </Sphere>
      
      {/* 뺨 홍조 (좌) */}
      <Sphere args={[0.2, 32, 32]} position={[-0.55, -0.08, 0.7]}>
        <meshBasicMaterial color={config.cheekColor} transparent opacity={0.35} />
      </Sphere>
      
      {/* 뺨 홍조 (우) */}
      <Sphere args={[0.2, 32, 32]} position={[0.55, -0.08, 0.7]}>
        <meshBasicMaterial color={config.cheekColor} transparent opacity={0.35} />
      </Sphere>
      
      {/* 눈 영역 */}
      <group>
        {/* 좌측 눈 (흰자) */}
        <Sphere ref={leftEyeRef} args={[0.17, 64, 64]} position={[-0.32, 0.12, 0.83]} scale={[1, 1, 0.6]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
        </Sphere>
        
        {/* 우측 눈 (흰자) */}
        <Sphere ref={rightEyeRef} args={[0.17, 64, 64]} position={[0.32, 0.12, 0.83]} scale={[1, 1, 0.6]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
        </Sphere>
        
        {/* 좌측 홍채 (갈색) */}
        <Sphere args={[0.09, 64, 64]} position={[-0.32, 0.12, 0.89]}>
          <meshStandardMaterial color="#6b4423" roughness={0.3} metalness={0.1} />
        </Sphere>
        
        {/* 우측 홍채 (갈색) */}
        <Sphere args={[0.09, 64, 64]} position={[0.32, 0.12, 0.89]}>
          <meshStandardMaterial color="#6b4423" roughness={0.3} metalness={0.1} />
        </Sphere>
        
        {/* 좌측 동공 */}
        <Sphere ref={leftPupilRef} args={[0.045, 32, 32]} position={[-0.32, 0.12, 0.93]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        
        {/* 우측 동공 */}
        <Sphere ref={rightPupilRef} args={[0.045, 32, 32]} position={[0.32, 0.12, 0.93]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        
        {/* 좌측 눈 하이라이트 */}
        <Sphere args={[0.025, 16, 16]} position={[-0.30, 0.14, 0.94]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
        
        {/* 우측 눈 하이라이트 */}
        <Sphere args={[0.025, 16, 16]} position={[0.34, 0.14, 0.94]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
        
        {/* 좌측 윗 눈꺼풀 */}
        <Box ref={leftEyelidTopRef} args={[0.38, 0.05, 0.05]} position={[-0.32, 0.27, 0.88]} scale={[1, 0.05, 1]}>
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </Box>
        
        {/* 우측 윗 눈꺼풀 */}
        <Box ref={rightEyelidTopRef} args={[0.38, 0.05, 0.05]} position={[0.32, 0.27, 0.88]} scale={[1, 0.05, 1]}>
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </Box>
        
        {/* 좌측 눈썹 (자연스러운 곡선) */}
        <mesh position={[-0.32, 0.35 + config.eyebrowY, 0.85]} rotation={[0, 0, -0.08]}>
          <capsuleGeometry args={[0.015, 0.25, 8, 16]} />
          <meshStandardMaterial color="#2a1f1a" roughness={0.9} />
        </mesh>
        
        {/* 우측 눈썹 */}
        <mesh position={[0.32, 0.35 + config.eyebrowY, 0.85]} rotation={[0, 0, 0.08]}>
          <capsuleGeometry args={[0.015, 0.25, 8, 16]} />
          <meshStandardMaterial color="#2a1f1a" roughness={0.9} />
        </mesh>
      </group>
      
      {/* 코 (더 자연스러운 형태) */}
      <group position={[0, -0.05, 0.88]}>
        <Sphere args={[0.08, 32, 32]} scale={[0.8, 1.2, 1]}>
          <meshStandardMaterial color={skinDarker} roughness={0.75} />
        </Sphere>
        {/* 콧구멍 (좌) */}
        <Sphere args={[0.02, 16, 16]} position={[-0.04, -0.08, 0.06]}>
          <meshStandardMaterial color="#8b6f5a" roughness={0.9} />
        </Sphere>
        {/* 콧구멍 (우) */}
        <Sphere args={[0.02, 16, 16]} position={[0.04, -0.08, 0.06]}>
          <meshStandardMaterial color="#8b6f5a" roughness={0.9} />
        </Sphere>
      </group>
      
      {/* 입 (자연스러운 곡선) */}
      <group ref={mouthRef} position={[0, -0.38, 0.85]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.02, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#c94d6d" roughness={0.5} />
        </mesh>
        {/* 윗입술 하이라이트 */}
        <mesh position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.01, 8, 16, Math.PI * 0.8]} />
          <meshStandardMaterial color="#e56b8a" roughness={0.4} />
        </mesh>
      </group>
      
      {/* 턱 (자연스러운 라인) */}
      <Sphere 
        ref={jawRef} 
        args={[0.48, 64, 64, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55]} 
        position={[0, -0.68, 0.65]} 
        scale={[0.92, 1, 1]}
        castShadow
      >
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </Sphere>
      
      {/* 턱 그림자 */}
      <Sphere args={[0.15, 32, 32]} position={[0, -0.75, 0.75]}>
        <meshBasicMaterial color={skinDarker} transparent opacity={0.15} />
      </Sphere>
      
      {/* 목 (자연스러운 연결) */}
      <Cylinder args={[0.32, 0.36, 0.65, 32]} position={[0, -1.15, 0.05]} castShadow>
        <meshStandardMaterial color={skinDarker} roughness={0.65} />
      </Cylinder>
      
      {/* 어깨 (좌) */}
      <Sphere args={[0.48, 32, 32]} position={[-0.65, -1.42, 0.02]} castShadow>
        <meshStandardMaterial color="#2c3e50" roughness={0.85} /> {/* 옷 색상 */}
      </Sphere>
      
      {/* 어깨 (우) */}
      <Sphere args={[0.48, 32, 32]} position={[0.65, -1.42, 0.02]} castShadow>
        <meshStandardMaterial color="#2c3e50" roughness={0.85} />
      </Sphere>
      
      {/* 옷깃 */}
      <Torus args={[0.35, 0.08, 16, 32, Math.PI]} position={[0, -1.35, 0.25]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#1a252f" roughness={0.9} />
      </Torus>
    </group>
  );
}

/**
 * 전문가급 3D AI 아바타 컴포넌트
 * - 부드럽고 자연스러운 곡률
 * - 이질감 없는 외모와 비율
 * - 고급 조명과 재질
 */
// WebGL 지원 체크 함수
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

export default function AIAvatar3D({ 
  isSpeaking = false,
  audioVolume = 0,
  emotion = 'neutral',
  className = '',
  mousePosition = { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 }
}: AIAvatarProps) {
  const [webglSupported, setWebglSupported] = React.useState<boolean | null>(null);
  const [renderError, setRenderError] = React.useState<string | null>(null);
  
  // WebGL 지원 체크 (클라이언트에서만)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSupported = checkWebGLSupport();
      console.log('[AIAvatar3D] WebGL 지원:', isSupported);
      setWebglSupported(isSupported);
      
      if (!isSupported) {
        console.error('[AIAvatar3D] WebGL이 지원되지 않습니다. Fallback UI를 표시합니다.');
      }
    }
  }, []);
  
  // WebGL 지원되지 않을 때 fallback UI
  if (webglSupported === false) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900`}>
        <div className="text-center p-8">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <div className="text-6xl">🤖</div>
          </div>
          <p className="text-white text-lg font-semibold mb-2">AI 면접관</p>
          <p className="text-gray-400 text-sm">
            3D 아바타를 표시하려면 WebGL이 필요합니다.
          </p>
          {isSpeaking && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span className="text-primary-400 text-sm">말하는 중...</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // 로딩 중
  if (webglSupported === null) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">AI 아바타 로딩 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className} relative`} style={{ minHeight: '400px' }}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 48 }}
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ width: '100%', height: '100%', minHeight: '400px', background: 'transparent' }}
        onCreated={(state) => {
          console.log('[AIAvatar3D] Canvas 생성 완료', {
            gl: state.gl.capabilities,
            size: state.size
          });
        }}
        onError={(error) => {
          console.error('[AIAvatar3D] Canvas 에러:', error);
          setRenderError(error.message);
        }}
      >
        {/* 전문가급 조명 시스템 - 3점 조명 + 추가 채광 */}
        
        {/* 주광 (Key Light) - 위 앞쪽에서 */}
        <directionalLight 
          position={[2, 5, 4]} 
          intensity={Math.PI * 0.6} 
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        
        {/* 보조광 (Fill Light) - 좌측에서 부드럽게 */}
        <directionalLight 
          position={[-4, 2, 3]} 
          intensity={Math.PI * 0.25} 
          color="#ffe4c4" // 따뜻한 빛
        />
        
        {/* 백라이트 (Rim Light) - 뒤에서 외곽선 강조 */}
        <spotLight 
          position={[0, 4, -4]} 
          angle={0.5} 
          penumbra={1} 
          intensity={Math.PI * 0.3}
          color="#b0d8ff" // 차가운 빛
          castShadow
        />
        
        {/* 환경광 (Ambient Light) - 전체적인 밝기 */}
        <ambientLight intensity={Math.PI * 0.35} color="#f5f5f5" />
        
        {/* 측면 포인트 라이트 (우) - 입체감 */}
        <pointLight position={[4, 1, 2]} intensity={Math.PI * 0.2} color="#ffd4a3" />
        
        {/* 하단 바운스 라이트 - 자연스러운 반사광 */}
        <pointLight position={[0, -2, 2]} intensity={Math.PI * 0.15} color="#e8f4ff" />
        
        {/* 전문가급 아바타 헤드 */}
        <ProfessionalHead 
          isSpeaking={isSpeaking}
          audioVolume={audioVolume}
          emotion={emotion}
          mousePosition={mousePosition}
        />
        
        {/* OrbitControls (사용자 조작 비활성화) */}
        <OrbitControls 
          makeDefault
          enableZoom={false} 
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>
      
      {/* 상태 표시 오버레이 */}
      {isSpeaking && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-gradient-to-r from-blue-500/90 to-indigo-500/90 backdrop-blur-md rounded-full text-white text-sm font-semibold shadow-2xl border border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            AI가 말하고 있습니다
          </div>
        </div>
      )}
    </div>
  );
}
