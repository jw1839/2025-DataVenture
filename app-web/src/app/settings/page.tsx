'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings2, Crown, Moon, Sun, Bell, Shield, Lock, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleUpgradeToPro = () => {
    toast.success('Pro 업그레이드 기능은 곧 출시됩니다!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          </div>
          <p className="text-gray-600">
            계정, 알림, 테마 등을 관리하세요
          </p>
        </div>

        <div className="space-y-6">
          {/* Pro 업그레이드 */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-amber-900">Pro 플랜으로 업그레이드</CardTitle>
                  <CardDescription className="text-amber-700">
                    더 많은 기능과 혜택을 누리세요
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ul className="space-y-2 text-sm text-amber-900">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    무제한 AI 인터뷰
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    상세한 분석 리포트
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    우선 고객 지원
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    광고 제거
                  </li>
                </ul>
                <Button
                  onClick={handleUpgradeToPro}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Pro로 업그레이드 - 월 9,900원
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 계정 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                계정 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">이메일</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">계정 유형</p>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'CANDIDATE' ? '구직자' : '채용담당자'}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                비밀번호 변경
              </Button>
            </CardContent>
          </Card>

          {/* 테마 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                테마 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">다크 모드</p>
                  <p className="text-sm text-gray-600">
                    {isDarkMode ? '어두운 테마가 적용되었습니다' : '밝은 테마가 적용되었습니다'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDarkMode(!isDarkMode);
                    toast.info('다크 모드 기능은 곧 출시됩니다!');
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 알림 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">알림 수신</p>
                  <p className="text-sm text-gray-600">
                    새로운 추천 및 업데이트 알림
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNotificationsEnabled(!notificationsEnabled);
                    toast.success(
                      notificationsEnabled ? '알림이 비활성화되었습니다' : '알림이 활성화되었습니다'
                    );
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 개인정보 보호 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                개인정보 보호
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                개인정보 처리방침
              </Button>
              <Button variant="outline" className="w-full justify-start">
                서비스 이용약관
              </Button>
              <Button variant="destructive" className="w-full justify-start">
                계정 탈퇴
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 뒤로 가기 */}
        <div className="mt-8">
          <Button variant="ghost" onClick={() => router.back()}>
            ← 뒤로 가기
          </Button>
        </div>
      </div>
    </div>
  );
}

