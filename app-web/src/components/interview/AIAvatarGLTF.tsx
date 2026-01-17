'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

interface AIAvatarGLTFProps {
  isSpeaking?: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'surprised';
  className?: string;
  mousePosition?: { x: number; y: number };
  modelUrl?: string; // Ready Player Me 아바타 URL
}

/**
 * Viseme 매핑 (음소 → 블렌드 셰이프)
 * Ready Player Me 모델의 표준 viseme 이름
 */
const VISEME_MAPPING: Record<string, string> = {
  'A': 'viseme_aa',
  'E': 'viseme_E',
  'I': 'viseme_I',
  'O': 'viseme_O',
  'U': 'viseme_U',
  'M': 'viseme_PP',
  'F': 'viseme_FF',
  'V': 'viseme_FF',
  'TH': 'viseme_TH',
  'S': 'viseme_SS',
  'CH': 'viseme_CH',
  'L': 'viseme_nn',
  'R': 'viseme_RR',
  'DEFAULT': 'viseme_sil' // 침묵
};

/**
 * GLTF 3D 아바타 (Ready Player Me 기반)
 */
function GLTFAvatar({ isSpeaking, emotion, mousePosition, modelUrl }: AIAvatarGLTFProps) {
  // 환경변수에서 기본 모델 URL 가져오기 (없으면 공식 예시 사용)
  const DEFAULT_MODEL_URL = modelUrl || 
    process.env.NEXT_PUBLIC_AVATAR_MODEL_URL || 
    'https://models.readyplayer.me/65a8dba831b23abb4f401bae.glb';
  
  // GLTF 모델 로드 (에러는 Error Boundary에서 처리)
  const { scene, animations } = useGLTF(DEFAULT_MODEL_URL);
  
  // 모델 복제 (여러 인스턴스 사용 시 필요)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);
  
  // 애니메이션 설정
  const { actions, mixer } = useAnimations(animations, clone);
  
  // Refs
  const avatarRef = useRef<THREE.Group>(null);
  const currentViseme = useRef<string>('viseme_sil');
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
    
    // 립싱크 (Morph Targets 사용)
    // Ready Player Me 모델의 표준 메쉬 이름: Wolf3D_Head, Wolf3D_Teeth
    const headMesh = nodes.Wolf3D_Head as THREE.SkinnedMesh;
    
    if (headMesh && headMesh.morphTargetDictionary && headMesh.morphTargetInfluences) {
      if (isSpeaking) {
        // 간단한 립싱크 애니메이션 (음소 순환)
        const visemeIndex = Math.floor(state.clock.elapsedTime * 5) % 3;
        const visemes = ['viseme_aa', 'viseme_O', 'viseme_I'];
        currentViseme.current = visemes[visemeIndex];
        
        // Morph Target 적용
        const targetIndex = headMesh.morphTargetDictionary[currentViseme.current];
        if (targetIndex !== undefined) {
          headMesh.morphTargetInfluences[targetIndex] = THREE.MathUtils.lerp(
            headMesh.morphTargetInfluences[targetIndex] || 0,
            0.6,
            0.3
          );
        }
        
        // 다른 viseme들은 0으로
        Object.keys(headMesh.morphTargetDictionary).forEach((key) => {
          if (key !== currentViseme.current && key.startsWith('viseme')) {
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
    
    // 눈 깜빡임 (블렌드 셰이프 사용)
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
    <group ref={avatarRef} scale={0.5} position={[0, 0, 0]}>
      <primitive object={clone} />
    </group>
  );
}

/**
 * AIAvatarGLTF 컴포넌트 (Canvas 래퍼 포함)
 * 에러 처리는 AvatarErrorBoundary에서 수행
 */
export default function AIAvatarGLTF({
  isSpeaking = false,
  emotion = 'neutral',
  className = '',
  mousePosition,
  modelUrl
}: AIAvatarGLTFProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [-0.016, 0.674, 0.494], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'none' }}
      >
        {/* 조명 - 얼굴 클로즈업 최적화 */}
        <ambientLight intensity={1.9} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.3}
          castShadow
        />
        <pointLight position={[-5, 5, 0]} intensity={0.4} />
        
        {/* 환경 */}
        <Environment preset="city" />
        
        {/* 아바타 */}
        <GLTFAvatar
          isSpeaking={isSpeaking}
          emotion={emotion}
          mousePosition={mousePosition}
          modelUrl={modelUrl}
        />
        
        {/* 카메라 컨트롤 (얼굴/상반신 클로즈업 최적화) */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          target={[0, 0.6, 0]}
        />
      </Canvas>
</div>
  );
}

// GLTF 모델 프리로드 (환경변수 또는 공식 예시 사용)
const PRELOAD_URL = process.env.NEXT_PUBLIC_AVATAR_MODEL_URL || 
  'https://models.readyplayer.me/65a8dba831b23abb4f401bae.glb';

try {
  useGLTF.preload(PRELOAD_URL);
} catch (error) {
  console.error('[AIAvatarGLTF] 프리로드 실패:', error);
}

