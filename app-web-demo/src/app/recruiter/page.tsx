'use client';

import Link from 'next/link';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Briefcase,
  ArrowRight,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  applicantsList, 
  dashboardStats,
  currentRecruiterUser
} from '@/data/mockData';
import { formatDateKorean, getScoreColor, getTimeAgo } from '@/lib/utils';

export default function RecruiterDashboardPage() {
  const stats = dashboardStats;
  const topApplicants = applicantsList.slice(0, 5);

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            채용 대시보드 📊
          </h1>
          <p className="text-gray-600">
            시니어 프론트엔드 개발자 채용 공고의 지원자 현황입니다
          </p>
        </div>

        {/* 주요 통계 카드 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>총 지원자</CardDescription>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">
                {stats.totalApplicants}명
              </div>
              <p className="text-xs text-gray-600 mt-1">
                이번 주 +{stats.newThisWeek}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>평균 점수</CardDescription>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore}점
              </div>
              <p className="text-xs text-gray-600 mt-1">
                전체 평균 대비 +2.3점
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>상위 10% 인재</CardDescription>
                <Award className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.topTenPercent}명
              </div>
              <p className="text-xs text-gray-600 mt-1">
                매칭도 90점 이상
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>주간 증가율</CardDescription>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary-600">
                +26%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                지난주 대비
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 왼쪽 컬럼 (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* 상위 지원자 리스트 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>상위 매칭 지원자</CardTitle>
                    <CardDescription>
                      AI 분석 기반 최적 매칭 순위
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      필터
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topApplicants.map((applicant, index) => (
                    <div 
                      key={applicant.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/20 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* 순위 배지 */}
                        <div className="flex flex-col items-center">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${index === 1 ? 'bg-gray-100 text-gray-700' : ''}
                            ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                            ${index > 2 ? 'bg-blue-50 text-blue-700' : ''}
                          `}>
                            {index + 1}
                          </div>
                        </div>

                        {/* 지원자 정보 */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-900">
                                {applicant.candidateName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {applicant.gender} • {applicant.age}세 • {applicant.experience} 경력
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-1">매칭도</div>
                              <div className="text-2xl font-bold text-primary-600">
                                {applicant.matchingScore}점
                              </div>
                            </div>
                          </div>

                          {/* 기술 스택 */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {applicant.skills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>

                          {/* 매칭 이유 */}
                          <div className="p-3 rounded-md bg-gray-50 mb-3">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {applicant.matchingReason}
                            </p>
                          </div>

                          {/* 역량 점수 */}
                          <div className="mb-3">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-600">종합 평가 점수</span>
                              <span className={`text-xs font-semibold ${getScoreColor(applicant.overallScore)}`}>
                                {applicant.overallScore}점
                              </span>
                            </div>
                            <Progress value={applicant.overallScore} max={100} className="h-2" />
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex gap-2">
                            <Link href={`/profile/${applicant.candidateId}`} className="flex-1">
                              <Button className="w-full" size="sm" variant="default">
                                프로필 상세보기
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline">
                              이력서 다운로드
                            </Button>
                            <Button size="sm" variant="outline">
                              연락하기
                            </Button>
                          </div>

                          {/* 지원 일시 */}
                          <div className="mt-2 text-xs text-gray-500">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {getTimeAgo(applicant.appliedDate)} 지원
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Button variant="outline">
                    전체 지원자 보기 ({stats.totalApplicants}명)
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 주간 지원자 추이 */}
            <Card>
              <CardHeader>
                <CardTitle>주간 지원자 추이</CardTitle>
                <CardDescription>최근 5주간 지원자 변화</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.weeklyTrend.map((week, idx) => (
                    <div key={week.week}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-700">{week.week}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {week.count}명
                        </span>
                      </div>
                      <Progress 
                        value={week.count} 
                        max={20} 
                        indicatorClassName={idx === stats.weeklyTrend.length - 1 ? 'bg-primary-600' : 'bg-gray-400'}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 (1/3) */}
          <div className="space-y-8">
            {/* 직무별 지원 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">직무별 지원 현황</CardTitle>
                <CardDescription>희망 직무 분포</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">전산 (IT)</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.byPosition['전산']}명
                    </span>
                  </div>
                  <Progress 
                    value={stats.byPosition['전산']} 
                    max={stats.totalApplicants} 
                    indicatorClassName="bg-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">경영관리</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.byPosition['경영관리']}명
                    </span>
                  </div>
                  <Progress 
                    value={stats.byPosition['경영관리']} 
                    max={stats.totalApplicants} 
                    indicatorClassName="bg-green-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">영업</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.byPosition['영업']}명
                    </span>
                  </div>
                  <Progress 
                    value={stats.byPosition['영업']} 
                    max={stats.totalApplicants} 
                    indicatorClassName="bg-purple-600"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 역량별 평균 점수 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">역량별 평균 점수</CardTitle>
                <CardDescription>전체 지원자 평균</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">IT 능력</span>
                  <span className={`font-semibold ${getScoreColor(stats.competencyAverages.itSkills)}`}>
                    {stats.competencyAverages.itSkills}점
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">문제 해결</span>
                  <span className={`font-semibold ${getScoreColor(stats.competencyAverages.problemSolving)}`}>
                    {stats.competencyAverages.problemSolving}점
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">정보 분석</span>
                  <span className={`font-semibold ${getScoreColor(stats.competencyAverages.informationAnalysis)}`}>
                    {stats.competencyAverages.informationAnalysis}점
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">유연한 사고</span>
                  <span className={`font-semibold ${getScoreColor(stats.competencyAverages.flexibleThinking)}`}>
                    {stats.competencyAverages.flexibleThinking}점
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">협상·설득</span>
                  <span className={`font-semibold ${getScoreColor(stats.competencyAverages.negotiation)}`}>
                    {stats.competencyAverages.negotiation}점
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 빠른 액션 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">빠른 액션</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Briefcase className="mr-2 h-4 w-4" />
                  새 공고 등록
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  전체 지원자 보기
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  통계 리포트
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

