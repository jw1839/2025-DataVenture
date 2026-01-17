'use client';

import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';

interface AIAvatarProps {
  isSpeaking?: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'surprised';
  className?: string;
  mousePosition?: { x: number; y: number };
}

/**
 * AI 아바타 컴포넌트
 * 
 * 현재: 간단한 애니메이션 아바타
 * 추후: Ready Player Me 또는 3D 모델로 업그레이드 가능
 */
export default function AIAvatar({ 
  isSpeaking = false, 
  emotion = 'neutral',
  className = '',
  mousePosition = { x: 0, y: 0 }
}: AIAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // 말하는 동안 입 애니메이션
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }

    // 300ms 간격으로 입 열고 닫기 (립싱크 효과)
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 300);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  // 마우스 커서 추적 - 눈동자 움직임
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const avatarElement = document.getElementById('ai-avatar-center');
    if (!avatarElement) return;
    
    const rect = avatarElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 마우스와 아바타 중심 간의 거리 계산
    const deltaX = mousePosition.x - centerX;
    const deltaY = mousePosition.y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 최대 이동 거리 제한 (눈동자가 너무 많이 움직이지 않도록)
    const maxDistance = 2; // SVG 좌표계 기준
    const normalizedX = (deltaX / distance) * Math.min(distance / 100, maxDistance);
    const normalizedY = (deltaY / distance) * Math.min(distance / 100, maxDistance);
    
    setEyeOffset({ x: normalizedX || 0, y: normalizedY || 0 });
  }, [mousePosition]);

  // 감정별 색상
  const emotionColors = {
    neutral: 'from-blue-400 to-blue-600',
    happy: 'from-green-400 to-green-600',
    thinking: 'from-purple-400 to-purple-600',
    surprised: 'from-yellow-400 to-yellow-600',
  };

  // 감정별 눈 모양
  const getEyeShape = () => {
    switch (emotion) {
      case 'happy':
        return (
          <>
            <circle cx="35" cy="45" r="3" fill="white" />
            <circle cx="65" cy="45" r="3" fill="white" />
            <path
              d="M 30 43 Q 35 38 40 43"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 60 43 Q 65 38 70 43"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
          </>
        );
      case 'thinking':
        return (
          <>
            <circle cx="35" cy="45" r="4" fill="white" />
            <circle cx="65" cy="45" r="4" fill="white" />
            <circle cx="33" cy="43" r="1.5" fill="#1e293b" />
            <circle cx="63" cy="43" r="1.5" fill="#1e293b" />
          </>
        );
      case 'surprised':
        return (
          <>
            <circle cx="35" cy="45" r="5" fill="white" />
            <circle cx="65" cy="45" r="5" fill="white" />
            <circle cx="35" cy="45" r="2" fill="#1e293b" />
            <circle cx="65" cy="45" r="2" fill="#1e293b" />
          </>
        );
      default: // neutral
        return (
          <>
            {/* 왼쪽 눈 흰자 */}
            <circle cx="35" cy="45" r="4" fill="white" />
            {/* 오른쪽 눈 흰자 */}
            <circle cx="65" cy="45" r="4" fill="white" />
            {/* 왼쪽 눈동자 (마우스 추적) */}
            <circle 
              cx={36 + eyeOffset.x} 
              cy={44 + eyeOffset.y} 
              r="2" 
              fill="#1e293b"
              className="transition-all duration-100 ease-out"
            />
            {/* 오른쪽 눈동자 (마우스 추적) */}
            <circle 
              cx={66 + eyeOffset.x} 
              cy={44 + eyeOffset.y} 
              r="2" 
              fill="#1e293b"
              className="transition-all duration-100 ease-out"
            />
          </>
        );
    }
  };

  // 입 모양
  const getMouthShape = () => {
    if (isSpeaking && mouthOpen) {
      return (
        <ellipse
          cx="50"
          cy="70"
          rx="12"
          ry="8"
          fill="#dc2626"
          className="transition-all duration-200"
        />
      );
    }

    switch (emotion) {
      case 'happy':
        return (
          <path
            d="M 35 65 Q 50 75 65 65"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        );
      case 'thinking':
        return (
          <line
            x1="40"
            y1="70"
            x2="60"
            y2="70"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      case 'surprised':
        return (
          <ellipse
            cx="50"
            cy="70"
            rx="8"
            ry="10"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        );
      default: // neutral
        return (
          <path
            d="M 40 70 Q 50 72 60 70"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        );
    }
  };

  return (
    <div id="ai-avatar-center" className={`relative ${className}`}>
      {/* 아바타 컨테이너 */}
      <div className="relative">
        {/* 배경 원 (펄스 효과) */}
        {isSpeaking && (
          <div className="absolute inset-0 animate-ping rounded-full bg-primary-400 opacity-20" />
        )}
        
        {/* 아바타 얼굴 */}
        <div
          className={`
            relative flex items-center justify-center 
            rounded-full bg-gradient-to-br ${emotionColors[emotion]}
            shadow-lg transition-all duration-300
            ${isSpeaking ? 'scale-105' : 'scale-100'}
          `}
        >
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 얼굴 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="url(#faceGradient)"
              opacity="0.9"
            />
            
            {/* 그라데이션 정의 */}
            <defs>
              <linearGradient id="faceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>
            
            {/* 눈 */}
            {getEyeShape()}
            
            {/* 입 */}
            {getMouthShape()}
          </svg>
        </div>
        
        {/* AI 아이콘 배지 */}
        <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-1.5 shadow-md">
          <Bot className="h-4 w-4 text-primary-600" />
        </div>
      </div>
      
      {/* 상태 표시 */}
      {isSpeaking && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-400">
          말하는 중...
        </div>
      )}
    </div>
  );
}

