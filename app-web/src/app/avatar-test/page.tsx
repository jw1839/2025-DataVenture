'use client';

import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Settings, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

// 3D 아바타를 동적으로 로드 (SSR 비활성화)
const AIAvatarTest = dynamic(() => import('@/components/interview/AIAvatarTest'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

/**
 * 3D 아바타 위치 조정 테스트 페이지
 * - 카메라 위치, 캐릭터 스케일, 회전 등을 실시간으로 조정
 * - 조정된 값을 복사하여 실제 페이지에 적용 가능
 */
function AvatarTestContent() {
  const router = useRouter();
  
  // 카메라 설정
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 1.6, z: 1.5 });
  const [cameraFov, setCameraFov] = useState(50);
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 1.6, z: 0 });
  
  // 캐릭터 설정
  const [avatarScale, setAvatarScale] = useState(2.5);
  const [avatarPosition, setAvatarPosition] = useState({ x: 0, y: 0, z: 0 });
  
  // 조명 설정
  const [ambientIntensity, setAmbientIntensity] = useState(1.2);
  const [directionalIntensity, setDirectionalIntensity] = useState(1.0);
  
  // UI 상태
  const [showControls, setShowControls] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 마우스 위치
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // 마우스 이동 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // 실제 카메라 위치 (휠 줌 반영) - 자식 컴포넌트에서 업데이트
  const [realCameraPosition, setRealCameraPosition] = useState({ x: 0, y: 1.6, z: 1.5 });
  
  // 설정 복사
  const copySettings = () => {
    const settings = {
      camera: {
        position: `[${realCameraPosition.x.toFixed(3)}, ${realCameraPosition.y.toFixed(3)}, ${realCameraPosition.z.toFixed(3)}]`,
        fov: cameraFov,
        target: `[${cameraTarget.x}, ${cameraTarget.y}, ${cameraTarget.z}]`,
      },
      avatar: {
        scale: avatarScale,
        position: `[${avatarPosition.x}, ${avatarPosition.y}, ${avatarPosition.z}]`,
      },
      lighting: {
        ambient: ambientIntensity,
        directional: directionalIntensity,
      },
    };
    
    const settingsText = `// 3D 아바타 설정 (얼굴/상반신 클로즈업)
// ⚠️ 휠 줌이 반영된 실제 카메라 위치입니다!

// Canvas 설정
camera={{ position: ${settings.camera.position}, fov: ${settings.camera.fov} }}

// OrbitControls 설정
target={${settings.camera.target}}

// 아바타 설정
avatarScale={${settings.avatar.scale}}
avatarPosition={${settings.avatar.position}}

// 조명 설정
ambientIntensity={${settings.lighting.ambient}}
directionalIntensity={${settings.lighting.directional}}`;
    
    navigator.clipboard.writeText(settingsText);
    setCopied(true);
    toast.success('실제 카메라 위치(휠 반영)가 복사되었습니다!');
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  // 초기화
  const resetSettings = () => {
    setCameraPosition({ x: 0, y: 1.6, z: 1.5 });
    setCameraFov(50);
    setCameraTarget({ x: 0, y: 1.6, z: 0 });
    setAvatarScale(2.5);
    setAvatarPosition({ x: 0, y: 0, z: 0 });
    setAmbientIntensity(1.2);
    setDirectionalIntensity(1.0);
    toast.success('설정이 초기화되었습니다');
  };
  
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white">3D 아바타 위치 조정</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSpeaking(!isSpeaking)}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            {isSpeaking ? '말하기 중지' : '말하기 테스트'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowControls(!showControls)}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showControls ? '컨트롤 숨기기' : '컨트롤 보기'}
          </Button>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* 3D 아바타 뷰어 */}
        <div className="flex-1 relative">
            <AIAvatarTest
              isSpeaking={isSpeaking}
              emotion={isSpeaking ? 'happy' : 'neutral'}
              mousePosition={mousePosition}
              cameraPosition={cameraPosition}
              cameraFov={cameraFov}
              cameraTarget={cameraTarget}
              avatarScale={avatarScale}
              avatarPosition={avatarPosition}
              ambientIntensity={ambientIntensity}
              directionalIntensity={directionalIntensity}
              onCameraUpdate={setRealCameraPosition}
            />
          
          {/* 좌표 정보 오버레이 */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-3 rounded-lg text-white text-sm font-mono z-10">
            <div className="text-gray-400">슬라이더 값 (초기값)</div>
            <div>Camera Pos: [{cameraPosition.x.toFixed(1)}, {cameraPosition.y.toFixed(1)}, {cameraPosition.z.toFixed(1)}]</div>
            <div>Camera Target: [{cameraTarget.x.toFixed(1)}, {cameraTarget.y.toFixed(1)}, {cameraTarget.z.toFixed(1)}]</div>
            <div>Scale: {avatarScale.toFixed(2)}</div>
            <div>FOV: {cameraFov}°</div>
          </div>
        </div>
        
        {/* 컨트롤 패널 */}
        {showControls && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto p-4 space-y-6">
            {/* 카메라 설정 */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                카메라 설정
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm">Position X</label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={cameraPosition.x}
                    onChange={(e) => setCameraPosition({ ...cameraPosition, x: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{cameraPosition.x.toFixed(1)}</span>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Position Y</label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={cameraPosition.y}
                    onChange={(e) => setCameraPosition({ ...cameraPosition, y: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{cameraPosition.y.toFixed(1)}</span>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Position Z (거리)</label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={cameraPosition.z}
                    onChange={(e) => setCameraPosition({ ...cameraPosition, z: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{cameraPosition.z.toFixed(1)}</span>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">FOV (시야각)</label>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    step="5"
                    value={cameraFov}
                    onChange={(e) => setCameraFov(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{cameraFov}°</span>
                </div>
              </div>
            </div>
            
            {/* 카메라 타겟 설정 */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-white font-semibold mb-3">카메라 타겟 (시선)</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm">Target Y (시선 높이)</label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={cameraTarget.y}
                    onChange={(e) => setCameraTarget({ ...cameraTarget, y: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{cameraTarget.y.toFixed(1)}</span>
                </div>
                
                <div className="bg-gray-700/50 p-2 rounded text-xs text-gray-400">
                  💡 카메라가 바라보는 높이입니다. 얼굴: 1.6~1.8, 가슴: 1.2~1.4
                </div>
              </div>
            </div>
            
            {/* 캐릭터 설정 */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-white font-semibold mb-3">캐릭터 설정</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm">Scale (크기)</label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={avatarScale}
                    onChange={(e) => setAvatarScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{avatarScale.toFixed(2)}</span>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Position Y (높이)</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={avatarPosition.y}
                    onChange={(e) => setAvatarPosition({ ...avatarPosition, y: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{avatarPosition.y.toFixed(1)}</span>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Position X (좌우)</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={avatarPosition.x}
                    onChange={(e) => setAvatarPosition({ ...avatarPosition, x: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{avatarPosition.x.toFixed(1)}</span>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Position Z (앞뒤)</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={avatarPosition.z}
                    onChange={(e) => setAvatarPosition({ ...avatarPosition, z: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{avatarPosition.z.toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            {/* 조명 설정 */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-white font-semibold mb-3">조명 설정</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm">Ambient (전체 밝기)</label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={ambientIntensity}
                    onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{ambientIntensity.toFixed(1)}</span>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Directional (방향광)</label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={directionalIntensity}
                    onChange={(e) => setDirectionalIntensity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{directionalIntensity.toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            {/* 액션 버튼 */}
            <div className="pt-4 border-t border-gray-700 space-y-2">
              <Button
                onClick={copySettings}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    설정 복사
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetSettings}
                variant="outline"
                className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                초기화
              </Button>
            </div>
            
            {/* 사용 가이드 */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-white font-semibold mb-2 text-sm">사용 방법</h3>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• 좌클릭 + 드래그: 회전</li>
                <li>• 마우스 휠: 줌 인/아웃</li>
                <li>• 우클릭 + 드래그: 카메라 팬 이동</li>
                <li className="mt-2 text-blue-400">💡 얼굴 클로즈업 방법:</li>
                <li className="ml-4">1. Camera Z를 줄여서 가까이 이동</li>
                <li className="ml-4">2. Target Y를 1.6~1.8로 조정</li>
                <li className="ml-4">3. FOV를 줄이면 더 확대됨</li>
                <li className="mt-2 text-blue-400">💡 상반신 프레임:</li>
                <li className="ml-4">1. Camera Z를 1.5~2.0으로 설정</li>
                <li className="ml-4">2. Target Y를 1.2~1.4로 조정</li>
                <li className="ml-4">3. FOV 50~60 추천</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 메인 페이지 (Suspense로 래핑)
 */
export default function AvatarTestPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <AvatarTestContent />
    </Suspense>
  );
}

