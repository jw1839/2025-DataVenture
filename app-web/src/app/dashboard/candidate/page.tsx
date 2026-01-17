'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Play,
  FileText,
  TrendingUp,
  Briefcase,
  Calendar,
  Award,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { profileAPI, interviewAPI, evaluationAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [latestEvaluation, setLatestEvaluation] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (user?.role !== 'CANDIDATE') {
      toast.error('구직자만 접근 가능합니다.');
      router.push('/');
      return;
    }
    
    loadDashboardData();
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // 프로필 로드
      try {
        const profileRes = await profileAPI.getMyCandidateProfile();
        setProfile(profileRes.data);
      } catch (error: any) {
        console.error('프로필 로드 실패:', error);
      }
      
      // TODO: 최근 인터뷰 목록 API 구현 필요
      // const interviewsRes = await interviewAPI.getMyInterviews();
      // setRecentInterviews(interviewsRes.data);
      
      // TODO: 최신 평가 API 구현 필요
      // const evaluationRes = await evaluationAPI.getLatest(user.id);
      // setLatestEvaluation(evaluationRes.data);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileCompleteness = () => {
    if (!profile) return 0;
    
    let completed = 0;
    const total = 10; // 더 세밀한 평가를 위해 총 10개 항목으로 확장
    
    // 각 필드가 실제로 채워져 있는지 확인 (빈 문자열, null, undefined 체크)
    const hasValue = (value: any): boolean => {
      if (!value) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'object') {
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          return Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0;
        } catch {
          return false;
        }
      }
      return true;
    };
    
    // 각 필드의 깊이를 평가
    if (hasValue(profile.photoUrl)) completed++;
    
    // 자기소개 (50자 이상일 때만 카운트)
    if (hasValue(profile.bio) && profile.bio.trim().length >= 50) completed++;
    
    // 학력
    if (hasValue(profile.educationJson)) completed++;
    
    // 경력
    if (hasValue(profile.experienceJson)) completed++;
    
    // 프로젝트
    if (hasValue(profile.projectsJson)) completed++;
    
    // 스킬 (3개 이상일 때만 카운트)
    try {
      const skills = Array.isArray(profile.skillsJson) ? profile.skillsJson : [];
      if (skills.length >= 3) completed++;
    } catch {}
    
    // 희망 직무
    if (hasValue(profile.desiredPosition)) completed++;
    
    // 포트폴리오 또는 GitHub
    if (hasValue(profile.portfolioUrl) || hasValue(profile.portfolioFileUrl) || hasValue(profile.githubUrl)) completed++;
    
    // 블로그 또는 LinkedIn
    if (hasValue(profile.blogUrl) || hasValue(profile.linkedinUrl)) completed++;
    
    // 이력서
    if (hasValue(profile.resumeUrl)) completed++;
    
    return Math.round((completed / total) * 100);
  };
  
  // 완성도에 따른 색상 반환
  const getCompletenessColors = (percentage: number) => {
    if (percentage <= 40) {
      return {
        card: 'border-amber-200 bg-amber-50',
        text: 'text-amber-900',
        textSecondary: 'text-amber-800',
        bg: 'bg-amber-200',
        bar: 'bg-amber-600',
      };
    } else if (percentage <= 70) {
      return {
        card: 'border-green-200 bg-green-50',
        text: 'text-green-900',
        textSecondary: 'text-green-800',
        bg: 'bg-green-200',
        bar: 'bg-green-600',
      };
    } else {
      return {
        card: 'border-blue-200 bg-blue-50',
        text: 'text-blue-900',
        textSecondary: 'text-blue-800',
        bg: 'bg-blue-200',
        bar: 'bg-blue-600',
      };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const profileCompleteness = getProfileCompleteness();
  const colors = getCompletenessColors(profileCompleteness);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            안녕하세요, {user?.name}님! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            오늘도 성공적인 하루 되세요!
          </p>
        </div>

        {/* 프로필 완성도 */}
        {profileCompleteness < 100 && (
          <Card className={`mb-6 ${colors.card}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-semibold ${colors.text} mb-2`}>
                    프로필을 완성하세요 ({profileCompleteness}%)
                  </h3>
                  <p className={`text-sm ${colors.textSecondary} mb-3`}>
                    {profileCompleteness <= 40 
                      ? '프로필 작성을 시작하세요! 더 많은 정보를 입력하면 AI 평가가 더 정확해집니다.'
                      : profileCompleteness <= 70
                      ? '좋은 진행입니다! 조금만 더 입력하면 완벽한 프로필이 됩니다.'
                      : '거의 완성되었습니다! 몇 가지만 더 입력하면 완벽합니다.'}
                  </p>
                  <div className={`h-2 ${colors.bg} rounded-full overflow-hidden mb-3`}>
                    <div
                      className={`h-full ${colors.bar} transition-all duration-500`}
                      style={{ width: `${profileCompleteness}%` }}
                    />
                  </div>
                </div>
                <Link href="/profile/candidate">
                  <Button variant="outline" size="sm" className="ml-4">
                    프로필 작성
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 빠른 액션 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link href="/interview/setup">
            <Card className="card-hover cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                    <Play className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI 인터뷰</h3>
                    <p className="text-sm text-gray-600">시작하기</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile/candidate">
            <Card className="card-hover cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">프로필</h3>
                    <p className="text-sm text-gray-600">수정하기</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/search">
            <Card className="card-hover cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">채용 공고</h3>
                    <p className="text-sm text-gray-600">탐색하기</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/recommendations">
            <Card className="card-hover cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI 추천</h3>
                    <p className="text-sm text-gray-600">보기</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 최근 인터뷰 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                최근 인터뷰
              </CardTitle>
              <CardDescription>
                진행한 AI 인터뷰 목록을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentInterviews.length === 0 ? (
                <div className="py-12 text-center">
                  <Play className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">
                    아직 진행한 인터뷰가 없습니다.
                  </p>
                  <Link href="/interview/setup">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      첫 인터뷰 시작하기
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInterviews.map((interview: any) => (
                    <div
                      key={interview.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {interview.mode === 'PRACTICE' ? '연습 모드' : '실전 모드'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(interview.startedAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <Badge variant={interview.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {interview.status === 'COMPLETED' ? '완료' : '진행 중'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최신 평가 결과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                최신 평가
              </CardTitle>
              <CardDescription>
                가장 최근 인터뷰 평가 결과
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!latestEvaluation ? (
                <div className="py-8 text-center">
                  <Award className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-sm text-gray-600">
                    평가 결과가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {latestEvaluation.overallScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">종합 점수</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">의사소통</span>
                      <span className="font-medium">{latestEvaluation.communicationAvg.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">문제 해결</span>
                      <span className="font-medium">{latestEvaluation.problemSolving.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">정보 분석</span>
                      <span className="font-medium">{latestEvaluation.informationAnalysis.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <Link href={`/evaluation/${latestEvaluation.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      상세 보기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

