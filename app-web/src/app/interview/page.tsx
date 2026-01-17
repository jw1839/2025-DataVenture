'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AI 인터뷰 리다이렉트 페이지
 * /interview/setup으로 자동 리다이렉트
 */
export default function InterviewPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'CANDIDATE') {
      toast.error('구직자만 인터뷰를 진행할 수 있습니다.');
      router.push('/');
      return;
    }

    // /interview/setup으로 리다이렉트
    router.push('/interview/setup');
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">인터뷰 설정 페이지로 이동 중...</p>
      </div>
    </div>
  );
}
