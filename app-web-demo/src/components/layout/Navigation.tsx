'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, User, Menu, Building2, UserCircle, LogOut, RefreshCw } from 'lucide-react';
import { useRoleStore } from '@/stores/role-store';

export default function Navigation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { role, userName, companyName, toggleRole } = useRoleStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isRecruiter = role === 'recruiter';
  const displayName = isRecruiter ? companyName : userName;

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600" />
              <span className="text-xl font-bold text-gray-900">
                flex-AI-Recruiter
                <span className="ml-2 text-xs font-normal text-gray-500">[DEMO]</span>
              </span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600" />
            <span className="text-xl font-bold text-gray-900">
              flex-AI-Recruiter
              <span className="ml-2 text-xs font-normal text-gray-500">[DEMO]</span>
            </span>
          </Link>

          {/* 네비게이션 링크 */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              대시보드
            </Link>
            {!isRecruiter && (
              <Link
                href="/interview"
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                AI 인터뷰
              </Link>
            )}
            <Link
              href="/jobs"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isRecruiter ? '공고 관리' : '채용공고'}
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isRecruiter ? '회사 정보' : '프로필'}
            </Link>
          </div>

          {/* 우측 액션 */}
          <div className="flex items-center gap-3">
            {/* 알림 */}
            <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />
            </button>

            {/* 사용자 메뉴 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 hover:border-gray-300 transition-colors"
              >
                {isRecruiter ? (
                  <Building2 className="h-4 w-4 text-gray-600" />
                ) : (
                  <User className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">{displayName}</span>
              </button>

              {/* 드롭다운 메뉴 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">
                      {isRecruiter ? '채용담당자 계정' : '구직자 계정'}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    {isRecruiter ? '회사 정보' : '내 프로필'}
                  </Link>

                  <button
                    onClick={() => {
                      toggleRole();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isRecruiter ? '구직자로 전환' : '채용담당자로 전환'}
                  </button>

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LogOut className="h-4 w-4" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 모바일 메뉴 */}
            <button className="md:hidden rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

