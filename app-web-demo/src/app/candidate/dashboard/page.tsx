'use client';

import Link from 'next/link';
import { 
  TrendingUp, 
  Calendar, 
  Briefcase, 
  Award, 
  ArrowRight,
  BarChart3,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  currentCandidateUser, 
  myLatestInterview, 
  recommendedJobPostings,
  practiceInterviews 
} from '@/data/mockData';
import { formatDateKorean, getScoreColor, formatPercentile } from '@/lib/utils';

export default function CandidateDashboardPage() {
  const user = currentCandidateUser;
  const latestInterview = myLatestInterview;

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            안녕하세요, {user.name}님! 👋
          </h1>
          <p className="text-gray-600">
            오늘도 좋은 하루 되세요. 최근 인터뷰 결과와 추천 공고를 확인해보세요.
          </p>
        </div>

        {/* 주요 통계 카드 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>최근 평가 점수</CardDescription>
                <Award className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(latestInterview.overallScore)}`}>
                {latestInterview.overallScore}점
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatPercentile(latestInterview.percentile)} 우수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>추천 공고</CardDescription>
                <Briefcase className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">
                {recommendedJobPostings.length}개
              </div>
              <p className="text-xs text-gray-600 mt-1">
                매칭도 85% 이상
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>완료한 인터뷰</CardDescription>
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary-600">
                {practiceInterviews.length + 1}회
              </div>
              <p className="text-xs text-gray-600 mt-1">
                실전 1회, 연습 {practiceInterviews.length}회
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>성장률</CardDescription>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                +13점
              </div>
              <p className="text-xs text-gray-600 mt-1">
                첫 연습 대비 향상
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 왼쪽 컬럼 (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* 최근 인터뷰 결과 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>최근 인터뷰 결과</CardTitle>
                    <CardDescription>
                      {formatDateKorean(latestInterview.date)} • 실전 모드 • {latestInterview.duration}분
                    </CardDescription>
                  </div>
                  <Badge variant="success">
                    실전 완료
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* 종합 점수 */}
                <div className="mb-6 p-6 rounded-lg bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">종합 점수</div>
                    <div className={`text-5xl font-bold mb-2 ${getScoreColor(latestInterview.overallScore)}`}>
                      {latestInterview.overallScore}점
                    </div>
                    <div className="text-sm text-gray-600">
                      전체 사용자 중 {formatPercentile(latestInterview.percentile)}
                    </div>
                  </div>
                </div>

                {/* 역량 점수 */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-900">직무 역량 평가</h4>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">IT 능력</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {latestInterview.competencies.itSkills}점
                      </span>
                    </div>
                    <Progress value={latestInterview.competencies.itSkills} max={100} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">문제 해결</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {latestInterview.competencies.problemSolving}점
                      </span>
                    </div>
                    <Progress value={latestInterview.competencies.problemSolving} max={100} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">정보 분석</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {latestInterview.competencies.informationAnalysis}점
                      </span>
                    </div>
                    <Progress value={latestInterview.competencies.informationAnalysis} max={100} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">유연한 사고</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {latestInterview.competencies.flexibleThinking}점
                      </span>
                    </div>
                    <Progress value={latestInterview.competencies.flexibleThinking} max={100} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">협상·설득</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {latestInterview.competencies.negotiation}점
                      </span>
                    </div>
                    <Progress value={latestInterview.competencies.negotiation} max={100} />
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-3">
                  <Link href="/evaluation/latest" className="flex-1">
                    <Button className="w-full" variant="default">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      상세 결과 보기
                    </Button>
                  </Link>
                  <Link href="/interview" className="flex-1">
                    <Button className="w-full" variant="outline">
                      다시 인터뷰하기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 추천 직무 */}
            <Card>
              <CardHeader>
                <CardTitle>당신에게 추천하는 직무</CardTitle>
                <CardDescription>
                  AI 평가 결과를 바탕으로 가장 적합한 직무를 추천합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge variant="default" className="mb-2">1위 추천</Badge>
                        <h4 className="font-semibold text-lg text-gray-900">
                          {latestInterview.topPosition.position}
                        </h4>
                      </div>
                      <div className="text-2xl font-bold text-primary-600">
                        {latestInterview.topPosition.score}점
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {latestInterview.topPosition.reason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 (1/3) */}
          <div className="space-y-8">
            {/* 빠른 액션 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">빠른 액션</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/interview">
                  <Button className="w-full justify-start" variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    새 인터뷰 시작
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button className="w-full justify-start" variant="outline">
                    <Briefcase className="mr-2 h-4 w-4" />
                    채용공고 탐색
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    프로필 수정
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 추천 채용 공고 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">추천 공고</CardTitle>
                  <Link href="/jobs">
                    <Button variant="ghost" size="sm">
                      전체보기
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>당신에게 딱 맞는 포지션</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedJobPostings.slice(0, 3).map((job) => (
                  <div 
                    key={job.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{job.position}</h4>
                    <p className="text-sm text-gray-600 mb-2">{job.companyName}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        매칭 95%
                      </Badge>
                      <span className="text-xs text-gray-500">{job.location}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 연습 기록 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">연습 기록</CardTitle>
                <CardDescription>꾸준한 연습으로 성장하고 있어요!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {practiceInterviews.map((practice, idx) => (
                    <div key={practice.id} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium text-gray-900">연습 {practiceInterviews.length - idx}</div>
                        <div className="text-xs text-gray-500">{formatDateKorean(practice.date)}</div>
                      </div>
                      <div className={`font-semibold ${getScoreColor(practice.overallScore)}`}>
                        {practice.overallScore}점
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
