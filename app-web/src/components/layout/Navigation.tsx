'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Home, 
  Briefcase, 
  MessageSquare, 
  User, 
  Bell, 
  Search, 
  Menu, 
  X,
  LogOut,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationPanel from './NotificationPanel';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: ('CANDIDATE' | 'RECRUITER' | 'ADMIN')[];
}

const navItems: NavItem[] = [
  {
    name: '홈',
    href: '/',
    icon: Home,
  },
  {
    name: 'AI 인터뷰',
    href: '/interview',
    icon: MessageSquare,
    roles: ['CANDIDATE'],
  },
  {
    name: '채용 공고',
    href: '/jobs',
    icon: Briefcase,
  },
  {
    name: '추천',
    href: '/recommendations',
    icon: Search,
  },
  {
    name: '대시보드',
    href: '/dashboard',
    icon: User,
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600">
              <span className="text-lg font-bold text-white">F</span>
            </div>
            <span className="hidden text-xl font-bold text-gradient sm:block">
              flex-AI Recruiter
            </span>
            <span className="text-xl font-bold text-gradient sm:hidden">
              FAR
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="destructive" className="ml-1">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* 알림 */}
                <NotificationPanel />

                {/* 사용자 메뉴 */}
                <div className="hidden md:flex md:items-center md:gap-2">
                  <Link href="/profile">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={logout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex md:items-center md:gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost">로그인</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>회원가입</Button>
                </Link>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 pb-3 pt-2 md:hidden">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                    {item.badge && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>

            {!isAuthenticated && (
              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                <Link href="/auth/login" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    로그인
                  </Button>
                </Link>
                <Link href="/auth/register" className="block">
                  <Button className="w-full">회원가입</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

