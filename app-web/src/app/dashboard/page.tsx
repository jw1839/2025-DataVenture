'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // 역할에 따라 적절한 대시보드로 리다이렉트
    if (user?.role === 'CANDIDATE') {
      router.push('/dashboard/candidate');
    } else if (user?.role === 'RECRUITER') {
      router.push('/dashboard/recruiter');
    } else {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
