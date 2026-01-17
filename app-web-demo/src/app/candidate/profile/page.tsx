'use client';

import Link from 'next/link';
import { 
  User, 
  Mail, 
  Edit,
  Award,
  Briefcase,
  Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { currentCandidateUser, myLatestInterview } from '@/data/mockData';
import { getScoreColor } from '@/lib/utils';

export default function CandidateProfilePage() {
  const user = currentCandidateUser;
  const interview = myLatestInterview;

  return (
    <div className="py-8">
      <div className="container-custom max-w-5xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              내 프로필
            </h1>
            <p className="text-gray-600">
              채용담당자에게 보이는 프로필입니다
            </p>
          </div>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            프로필 수정
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-4xl font-bold">
                    {user.name[0]}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {user.name}
                  </h2>
                  <p className="text-gray-600">{user.desiredPosition}</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {user.email}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary-600" />
                  최근 평가 점수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className={`text-5xl font-bold ${getScoreColor(interview.overallScore)}`}>
                    {interview.overallScore}점
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    상위 {interview.percentile}%
                  </div>
                </div>
                <Link href="/evaluation/latest">
                  <Button className="w-full" variant="outline">
                    평가 결과 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  자기소개
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {user.bio}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  경력
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">프론트엔드 개발자</h4>
                    <p className="text-sm text-gray-600">TechCorp • 2022 - 현재</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">주니어 개발자</h4>
                    <p className="text-sm text-gray-600">StartUp Inc. • 2020 - 2022</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  보유 기술
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  AI 평가 역량 프로필
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">IT 능력</span>
                    <span className={`text-sm font-bold ${getScoreColor(interview.competencies.itSkills)}`}>
                      {interview.competencies.itSkills}점
                    </span>
                  </div>
                  <Progress value={interview.competencies.itSkills} max={100} />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">문제 해결</span>
                    <span className={`text-sm font-bold ${getScoreColor(interview.competencies.problemSolving)}`}>
                      {interview.competencies.problemSolving}점
                    </span>
                  </div>
                  <Progress value={interview.competencies.problemSolving} max={100} />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">정보 분석</span>
                    <span className={`text-sm font-bold ${getScoreColor(interview.competencies.informationAnalysis)}`}>
                      {interview.competencies.informationAnalysis}점
                    </span>
                  </div>
                  <Progress value={interview.competencies.informationAnalysis} max={100} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
