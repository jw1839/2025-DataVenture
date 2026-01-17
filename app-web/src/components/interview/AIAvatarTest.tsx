'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

interface AIAvatarTestProps {
  isSpeaking?: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'surprised';
  className?: string;
  mousePosition?: { x: number; y: number };
  modelUrl?: string;
  // 조정 가능한 설정
  cameraPosition?: { x: number; y: number; z: number };
  cameraFov?: number;
  cameraTarget?: { x: number; y: number; z: number };
  avatarScale?: number;
  avatarPosition?: { x: number; y: number; z: number };
  ambientIntensity?: number;
  directionalIntensity?: number;
  // 실제 카메라 위치 콜백
  onCameraUpdate?: (pos: { x: number; y: number; z: number }) => void;
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
 * 테스트용 GLTF 3D 아바타 (위치 조정 가능)
 */
function GLTFAvatarTest({ 
  isSpeaking, 
  emotion, 
  mousePosition, 
  modelUrl,
  avatarScale = 2.5,
  avatarPosition = { x: 0, y: 0, z: 0 }
}: AIAvatarTestProps) {
  // 환경변수에서 기본 모델 URL 가져오기
  const DEFAULT_MODEL_URL = modelUrl || 
    process.env.NEXT_PUBLIC_AVATAR_MODEL_URL || 
    'https://models.readyplayer.me/65a8dba831b23abb4f401bae.glb';
  
  // GLTF 모델 로드
  const { scene, animations } = useGLTF(DEFAULT_MODEL_URL);
  
  // 모델 복제
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
      scale={avatarScale}
      position={[avatarPosition.x, avatarPosition.y, avatarPosition.z]}
    >
      <primitive object={clone} />
    </group>
  );
}

/**
 * 카메라 위치 추적 컴포넌트
 */
function CameraTracker({ 
  onUpdate 
}: { 
  onUpdate: (pos: [number, number, number]) => void 
}) {
  useFrame(({ camera }) => {
    onUpdate([camera.position.x, camera.position.y, camera.position.z]);
  });
  return null;
}

/**
 * AIAvatarTest 컴포넌트 (Canvas 래퍼 포함)
 * 위치 조정을 위한 테스트용 컴포넌트
 */
export default function AIAvatarTest({
  isSpeaking = false,
  emotion = 'neutral',
  className = '',
  mousePosition,
  modelUrl,
  cameraPosition = { x: 0, y: 1.6, z: 1.5 },
  cameraFov = 50,
  cameraTarget = { x: 0, y: 1.6, z: 0 },
  avatarScale = 2.5,
  avatarPosition = { x: 0, y: 0, z: 0 },
  ambientIntensity = 1.2,
  directionalIntensity = 1.0,
  onCameraUpdate
}: AIAvatarTestProps) {
  const [realCameraPos, setRealCameraPos] = useState<[number, number, number]>([
    cameraPosition.x, 
    cameraPosition.y, 
    cameraPosition.z
  ]);
  
  // 부모 컴포넌트에 실제 카메라 위치 전달
  const handleCameraUpdate = (pos: [number, number, number]) => {
    setRealCameraPos(pos);
    if (onCameraUpdate) {
      onCameraUpdate({ x: pos[0], y: pos[1], z: pos[2] });
    }
  };

  return (
    <div className={`w-full h-full ${className} relative`}>
      {/* 실제 카메라 위치 표시 (휠 줌 반영됨) */}
      <div className="absolute top-4 right-4 bg-red-600/90 backdrop-blur-sm px-4 py-3 rounded-lg text-white text-xs font-mono z-50">
        <div className="font-bold mb-1">🎯 실제 카메라 위치 (휠 반영)</div>
        <div>X: {realCameraPos[0].toFixed(3)}</div>
        <div>Y: {realCameraPos[1].toFixed(3)}</div>
        <div className="font-bold text-yellow-300">Z: {realCameraPos[2].toFixed(3)} ← 이 값 사용!</div>
      </div>
      
      <Canvas
        camera={{ 
          position: [cameraPosition.x, cameraPosition.y, cameraPosition.z], 
          fov: cameraFov 
        }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* 카메라 위치 추적 */}
        <CameraTracker onUpdate={handleCameraUpdate} />
        {/* 조명 */}
        <ambientLight intensity={ambientIntensity} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={directionalIntensity}
          castShadow
        />
        <pointLight position={[-5, 5, 0]} intensity={0.4} />
        
        {/* 환경 */}
        <Environment preset="city" />
        
        {/* 그리드 헬퍼 (위치 참조용) */}
        <Grid
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#444444"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#666666"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={false}
        />
        
        {/* 좌표축 헬퍼 */}
        <axesHelper args={[2]} />
        
        {/* 아바타 */}
        <GLTFAvatarTest
          isSpeaking={isSpeaking}
          emotion={emotion}
          mousePosition={mousePosition}
          modelUrl={modelUrl}
          avatarScale={avatarScale}
          avatarPosition={avatarPosition}
        />
        
        {/* OrbitControls - 마우스로 회전/줌 가능 */}
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={10}
          target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]}
        />
      </Canvas>
    </div>
  );
}

// GLTF 모델 프리로드
const PRELOAD_URL = process.env.NEXT_PUBLIC_AVATAR_MODEL_URL || 
  'https://models.readyplayer.me/65a8dba831b23abb4f401bae.glb';

try {
  useGLTF.preload(PRELOAD_URL);
} catch (error) {
  console.error('[AIAvatarTest] 프리로드 실패:', error);
}

