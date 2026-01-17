'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Award, 
  TrendingUp, 
  FileText, 
  ArrowLeft,
  Download,
  Share2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { myLatestInterview } from '@/data/mockData';
import { formatDateKorean, getScoreColor, getScoreGrade, formatPercentile, getScoreBgColor } from '@/lib/utils';

export default function EvaluationPage() {
  const interview = myLatestInterview;
  const [showFullScript, setShowFullScript] = useState(false);

  // 레이더 차트 데이터
  const radarData = [
    {
      subject: 'IT 능력',
      score: interview.competencies.itSkills,
      fullMark: 100,
    },
    {
      subject: '문제 해결',
      score: interview.competencies.problemSolving,
      fullMark: 100,
    },
    {
      subject: '정보 분석',
      score: interview.competencies.informationAnalysis,
      fullMark: 100,
    },
    {
      subject: '유연한 사고',
      score: interview.competencies.flexibleThinking,
      fullMark: 100,
    },
    {
      subject: '협상·설득',
      score: interview.competencies.negotiation,
      fullMark: 100,
    },
  ];

  // 의사소통 능력 바 차트 데이터
  const communicationData = [
    {
      name: '전달력',
      score: interview.communication.delivery,
    },
    {
      name: '어휘 사용',
      score: interview.communication.vocabulary,
    },
    {
      name: '문제 이해력',
      score: interview.communication.comprehension,
    },
  ];

  // 바 차트 색상 결정
  const getBarColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="py-8">
      <div className="container-custom max-w-6xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드로 돌아가기
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                AI 인터뷰 평가 결과
              </h1>
              <p className="text-gray-600">
                {formatDateKorean(interview.date)} • 실전 모드 • {interview.duration}분
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                공유하기
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                PDF 다운로드
              </Button>
            </div>
          </div>
        </div>

        {/* 종합 점수 카드 */}
        <Card className={`mb-8 border-2 ${getScoreBgColor(interview.overallScore)}`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge variant="success" className="mb-4">
                실전 모드 완료
              </Badge>
              <div className="mb-2">
                <span className="text-2xl font-bold text-gray-700">종합 점수</span>
              </div>
              <div className={`text-7xl font-bold mb-4 ${getScoreColor(interview.overallScore)}`}>
                {interview.overallScore}점
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div>
                  <span className="text-gray-600">등급: </span>
                  <span className="font-bold text-gray-900">
                    {getScoreGrade(interview.overallScore)}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div>
                  <span className="text-gray-600">백분위: </span>
                  <span className="font-bold text-gray-900">
                    {formatPercentile(interview.percentile)}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div>
                  <span className="text-gray-600">전체 사용자 대비: </span>
                  <span className="font-bold text-primary-600">
                    상위권
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 의사소통 능력 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>의사소통 능력 평가</CardTitle>
            <CardDescription>
              전달력, 어휘 사용, 문제 이해력 3대 지표 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">평균 점수</span>
                <span className={`text-3xl font-bold ${getScoreColor(interview.communication.average)}`}>
                  {interview.communication.average}점
                </span>
              </div>
              <Progress value={interview.communication.average} max={100} className="h-3" />
            </div>

            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={communicationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {communicationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-600 mb-1">전달력</div>
                <div className={`text-2xl font-bold ${getScoreColor(interview.communication.delivery)}`}>
                  {interview.communication.delivery}점
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  논리적 문장 구조와 명확한 전달이 우수함
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-600 mb-1">어휘 사용</div>
                <div className={`text-2xl font-bold ${getScoreColor(interview.communication.vocabulary)}`}>
                  {interview.communication.vocabulary}점
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  전문 용어를 적절히 사용하여 전문성 표현
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-600 mb-1">문제 이해력</div>
                <div className={`text-2xl font-bold ${getScoreColor(interview.communication.comprehension)}`}>
                  {interview.communication.comprehension}점
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  질문 의도를 정확히 파악하여 답변함
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 직무 역량 평가 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>직무 역량 평가 (5대 역량)</CardTitle>
            <CardDescription>
              각 직무별 핵심 역량을 종합적으로 평가합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* 레이더 차트 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 text-center">역량 분포도</h4>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar 
                        name="점수" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6} 
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 역량별 상세 점수 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">역량별 상세 점수</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">IT 능력</span>
                      <span className={`text-lg font-bold ${getScoreColor(interview.competencies.itSkills)}`}>
                        {interview.competencies.itSkills}점
                      </span>
                    </div>
                    <Progress value={interview.competencies.itSkills} max={100} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">
                      알고리즘과 시스템 설계에 대한 깊은 이해
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">문제 해결</span>
                      <span className={`text-lg font-bold ${getScoreColor(interview.competencies.problemSolving)}`}>
                        {interview.competencies.problemSolving}점
                      </span>
                    </div>
                    <Progress value={interview.competencies.problemSolving} max={100} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">
                      복잡한 문제를 논리적으로 해결하는 능력
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">정보 분석</span>
                      <span className={`text-lg font-bold ${getScoreColor(interview.competencies.informationAnalysis)}`}>
                        {interview.competencies.informationAnalysis}점
                      </span>
                    </div>
                    <Progress value={interview.competencies.informationAnalysis} max={100} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">
                      데이터를 해석하고 인사이트를 도출하는 능력
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">유연한 사고</span>
                      <span className={`text-lg font-bold ${getScoreColor(interview.competencies.flexibleThinking)}`}>
                        {interview.competencies.flexibleThinking}점
                      </span>
                    </div>
                    <Progress value={interview.competencies.flexibleThinking} max={100} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">
                      다양한 관점에서 문제를 바라보는 능력
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">협상·설득</span>
                      <span className={`text-lg font-bold ${getScoreColor(interview.competencies.negotiation)}`}>
                        {interview.competencies.negotiation}점
                      </span>
                    </div>
                    <Progress value={interview.competencies.negotiation} max={100} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">
                      논리적으로 설득하고 협상하는 능력
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 추천 직무 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>추천 직무 분석</CardTitle>
            <CardDescription>
              AI가 당신의 역량을 분석하여 가장 적합한 직무를 추천합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant="default" className="mb-2">
                    <Award className="mr-1 h-3 w-3" />
                    1위 추천 직무
                  </Badge>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {interview.topPosition.position}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">적합도</div>
                  <div className="text-4xl font-bold text-primary-600">
                    {interview.topPosition.score}점
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                {interview.topPosition.reason}
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary">IT 개발</Badge>
                <Badge variant="secondary">프론트엔드</Badge>
                <Badge variant="secondary">Full-Stack</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 강점과 개선사항 */}
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          {/* 강점 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                주요 강점
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 개선사항 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                개선 포인트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 상세 피드백 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI 종합 피드백
            </CardTitle>
            <CardDescription>
              GPT-5가 생성한 상세한 평가 및 조언
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {interview.detailedFeedback}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/jobs" className="flex-1">
            <Button className="w-full" size="lg">
              추천 공고 보기
            </Button>
          </Link>
          <Link href="/interview" className="flex-1">
            <Button className="w-full" size="lg" variant="outline">
              다시 인터뷰하기
            </Button>
          </Link>
          <Button className="flex-1" size="lg" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            스크립트 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

