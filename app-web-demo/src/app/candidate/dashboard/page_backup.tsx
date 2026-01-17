'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleStore } from '@/stores/role-store';

export default function DashboardPage() {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);

  useEffect(() => {
    if (role === 'recruiter') {
      router.push('/recruiter');
    } else {
      router.push('/candidate/dashboard');
    }
  }, [role, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">대시보드로 이동 중...</p>
      </div>
    </div>
  );
}
