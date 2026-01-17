'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Briefcase, TrendingUp, Eye, Search, Filter, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@radix-ui/react-avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { ProfileCardSkeleton } from '@/components/ui/loading-skeleton';

const COLORS = ['#0891b2', '#9333ea', '#059669', '#ea580c', '#eab308'];

interface Stats {
  activeJobCount: number;
  totalApplicants: number;
  avgMatchingScore: number;
  profileViews: number;
}

interface Applicant {
  id: string;
  candidateId: string;
  name: string;
  email: string;
  position: string;
  experience: number;
  matchScore: number;
  overallScore: number;
  appliedDate: string;
  status: string;
  jobPosting: {
    id: string;
    title: string;
    position: string;
  };
}

interface SkillData {
  name: string;
  value: number;
}

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [skillDistribution, setSkillDistribution] = useState<SkillData[]>([]);

  // 인증 확인 및 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (user?.role !== 'RECRUITER') {
      toast.error('채용담당자만 접근 가능합니다.');
      router.push('/');
      return;
    }
    
    fetchDashboardData();
  }, [isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // 병렬로 데이터 조회
      const [statsRes, applicantsRes, skillsRes] = await Promise.all([
        apiClient.get('/api/v1/dashboard/recruiter/stats'),
        apiClient.get('/api/v1/dashboard/recruiter/applicants', { params: { limit: 20 } }),
        apiClient.get('/api/v1/dashboard/recruiter/skill-distribution'),
      ]);

      setStats(statsRes.data);
      setApplicants(applicantsRes.data.applicants);
      setSkillDistribution(skillsRes.data.distribution);
    } catch (err: any) {
      console.error('대시보드 데이터 로드 실패:', err);
      const errorMessage = err.response?.data?.message || err.message || '대시보드 데이터를 불러올 수 없습니다.';
      toast.error(errorMessage);
      
      // 오류가 발생해도 빈 데이터로 초기화
      setStats({
        activeJobCount: 0,
        totalApplicants: 0,
        avgMatchingScore: 0,
        profileViews: 0,
      });
      setApplicants([]);
      setSkillDistribution([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApplicants = applicants.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="default">검토 중</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success">합격</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">불합격</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadReport = () => {
    if (!stats || !applicants) {
      toast.error('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      // CSV 형식으로 리포트 생성
      const reportData = [
        ['=== 채용 대시보드 통계 리포트 ==='],
        ['생성 일시:', new Date().toLocaleString('ko-KR')],
        [''],
        ['[통계 요약]'],
        ['활성 채용 공고:', stats.activeJobCount],
        ['전체 지원자:', stats.totalApplicants],
        ['평균 매칭 점수:', stats.avgMatchingScore.toFixed(1)],
        ['프로필 조회수:', stats.profileViews],
        [''],
        ['[지원자 목록]'],
        ['이름', '이메일', '지원 직무', '경력(년)', '매칭 점수', '종합 점수', '상태', '지원일'],
        ...applicants.map(app => [
          app.name,
          app.email,
          app.position,
          app.experience,
          app.matchScore,
          app.overallScore,
          app.status,
          app.appliedDate,
        ]),
        [''],
        ['[역량 분포]'],
        ['역량', '인원'],
        ...skillDistribution.map(skill => [skill.name, skill.value]),
      ];

      // CSV 문자열 생성
      const csvContent = reportData
        .map(row => row.join(','))
        .join('\n');

      // BOM 추가 (한글 깨짐 방지)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 다운로드
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `채용_리포트_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('리포트가 다운로드되었습니다!');
    } catch (error) {
      console.error('리포트 다운로드 실패:', error);
      toast.error('리포트 다운로드에 실패했습니다.');
    }
  };

  const statsData = stats
    ? [
        { label: '활성 공고', value: stats.activeJobCount, icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { label: '전체 지원자', value: stats.totalApplicants, icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
        { label: '평균 매칭 점수', value: stats.avgMatchingScore, icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { label: '프로필 조회', value: stats.profileViews, icon: Eye, color: 'text-orange-600', bgColor: 'bg-orange-100' }
      ]
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            안녕하세요, {user?.name}님! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            지원자 현황과 통계를 한눈에 확인하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 지원자 리스트 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>지원자 목록</CardTitle>
                    <CardDescription>
                      최근 지원자 {applicants.length}명
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    필터
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* 검색 */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="이름 또는 직무로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* 리스트 */}
                <div className="space-y-3">
                  {filteredApplicants.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      검색 결과가 없습니다
                    </div>
                  ) : (
                    filteredApplicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:shadow-md"
                      >
                        {/* 프로필 이미지 */}
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                          {applicant.name[0]}
                        </div>

                        {/* 정보 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{applicant.name}</h3>
                            {getStatusBadge(applicant.status)}
                          </div>
                          <p className="text-sm text-gray-600">{applicant.position}</p>
                          <div className="mt-1 flex gap-3 text-xs text-gray-500">
                            <span>매칭: {applicant.matchScore}점</span>
                            <span>•</span>
                            <span>종합: {applicant.overallScore}점</span>
                            <span>•</span>
                            <span>{applicant.appliedDate}</span>
                          </div>
                        </div>

                        {/* 액션 */}
                        <Button variant="outline" size="sm">
                          프로필 보기
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 통계 */}
          <div className="space-y-6">
            {/* 역량 분포 */}
            <Card>
              <CardHeader>
                <CardTitle>지원자 역량 분포</CardTitle>
                <CardDescription>
                  주요 강점 역량 분석
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={skillDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {skillDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 지원자 요약 */}
            <Card>
              <CardHeader>
                <CardTitle>지원자 3줄 평</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>
                  • <strong>평균 역량:</strong> IT능력과 문제해결능력이 전반적으로 우수합니다.
                </p>
                <p>
                  • <strong>추천 후보:</strong> 박민수님이 92점으로 가장 높은 매칭 점수를 기록했습니다.
                </p>
                <p>
                  • <strong>트렌드:</strong> 최근 1주일간 지원자가 35% 증가했습니다.
                </p>
              </CardContent>
            </Card>

            {/* 빠른 액션 */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/job-posting/create')}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  새 채용 공고 작성
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/recommendations')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  추천 후보 보기
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleDownloadReport}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  통계 리포트 다운로드
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

