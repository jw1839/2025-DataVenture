'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

/**
 * 프로필 자동 리다이렉트 페이지
 * 사용자 역할에 따라 알맞은 프로필 페이지로 이동
 */
export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // 역할에 따라 리다이렉트
    if (user?.role === 'CANDIDATE') {
      router.push('/profile/candidate');
    } else if (user?.role === 'RECRUITER') {
      router.push('/profile/recruiter');
    } else {
      // 역할이 없으면 대시보드로
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">프로필 페이지로 이동 중...</p>
      </div>
    </div>
  );
}

