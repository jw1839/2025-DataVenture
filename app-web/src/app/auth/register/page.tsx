'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Building2, Loader2, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');
  
  // 비밀번호 검증 규칙
  const passwordRules = {
    minLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasMatch: password.length > 0 && confirmPassword.length > 0 && password === confirmPassword,
  };

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // 에러 메시지 표시
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!email || !password || !name) {
      toast.error('모든 필드를 입력하세요.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      toast.error('비밀번호에 대문자를 포함해야 합니다.');
      return;
    }
    
    if (!/[a-z]/.test(password)) {
      toast.error('비밀번호에 소문자를 포함해야 합니다.');
      return;
    }
    
    try {
      await register({ email, password, name, role });
      toast.success('회원가입 성공! 프로필을 작성해주세요.');
      
      // 프로필 작성 페이지로 이동
      setTimeout(() => {
        if (role === 'CANDIDATE') {
          router.push('/profile/candidate');
        } else {
          router.push('/profile/recruiter');
        }
      }, 500);
    } catch (error: any) {
      // 에러 메시지 표시
      const errorMessage = error.response?.data?.message || error.response?.data?.error || '회원가입에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600">
              <span className="text-2xl font-bold text-white">F</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              flex-AI Recruiter
            </span>
          </Link>
          <p className="text-gray-600">
            AI 기반 채용 매칭 플랫폼
          </p>
        </div>

        {/* 회원가입 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
            <CardDescription className="text-center">
              새 계정을 만들고 AI 인터뷰를 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 역할 선택 */}
              <div className="space-y-3">
                <Label>가입 유형을 선택하세요</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* 구직자 */}
                  <button
                    type="button"
                    onClick={() => setRole('CANDIDATE')}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                      role === 'CANDIDATE'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`rounded-full p-3 ${
                      role === 'CANDIDATE' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <User className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">구직자</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        AI 인터뷰를 통한 역량 평가
                      </p>
                    </div>
                    {role === 'CANDIDATE' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </button>

                  {/* 채용담당자 */}
                  <button
                    type="button"
                    onClick={() => setRole('RECRUITER')}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                      role === 'RECRUITER'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`rounded-full p-3 ${
                      role === 'RECRUITER' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">채용담당자</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        우수 인재 발굴 및 채용
                      </p>
                    </div>
                    {role === 'RECRUITER' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-200" />

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="최소 6자 이상"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
                {/* 비밀번호 규칙 표시 (입력 시작 후에만) */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5 rounded-md bg-gray-50 p-3 text-sm">
                    <div className={`flex items-center gap-2 ${passwordRules.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordRules.minLength ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>최소 6자 이상</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRules.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordRules.hasUpperCase ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>대문자 포함</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRules.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordRules.hasLowerCase ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>소문자 포함</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
                {/* 비밀번호 일치 여부 표시 */}
                {confirmPassword.length > 0 && (
                  <div className="mt-2">
                    {passwordRules.hasMatch ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>비밀번호가 일치합니다</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <X className="h-4 w-4" />
                        <span>비밀번호가 일치하지 않습니다</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 약관 동의 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    <Link href="/terms" className="text-primary-600 hover:underline">
                      이용약관
                    </Link>
                    {' '}및{' '}
                    <Link href="/privacy" className="text-primary-600 hover:underline">
                      개인정보처리방침
                    </Link>
                    에 동의합니다. *
                  </label>
                </div>
              </div>

              {/* 회원가입 버튼 */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || !passwordRules.minLength || !passwordRules.hasUpperCase || !passwordRules.hasLowerCase || (password !== confirmPassword && password.length > 0)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    회원가입
                  </>
                )}
              </Button>
            </form>

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">또는</span>
              </div>
            </div>

            {/* 로그인 링크 */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
