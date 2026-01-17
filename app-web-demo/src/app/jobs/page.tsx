'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Users,
  Calendar,
  ArrowRight,
  Filter,
  Search,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { recommendedJobPostings, allJobPostings } from '@/data/mockData';
import { formatDateKorean } from '@/lib/utils';

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | '전산' | '경영관리' | '영업'>('all');
  
  const filteredJobs = selectedCategory === 'all' 
    ? allJobPostings 
    : allJobPostings.filter(job => job.category === selectedCategory);

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            채용 공고 탐색
          </h1>
          <p className="text-gray-600">
            AI가 추천하는 맞춤형 채용 공고를 확인하세요
          </p>
        </div>

        {/* 검색 및 필터 */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 검색 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="회사명, 직무, 기술 스택으로 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              {/* 카테고리 필터 */}
              <div className="flex gap-2">
                <Button 
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                >
                  전체
                </Button>
                <Button 
                  variant={selectedCategory === '전산' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('전산')}
                >
                  전산
                </Button>
                <Button 
                  variant={selectedCategory === '경영관리' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('경영관리')}
                >
                  경영관리
                </Button>
                <Button 
                  variant={selectedCategory === '영업' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('영업')}
                >
                  영업
                </Button>
              </div>

              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                필터
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI 추천 공고 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary-600" />
              당신을 위한 AI 추천 공고
            </h2>
            <Badge variant="default">매칭도 85%+</Badge>
          </div>

          <div className="grid gap-6">
            {recommendedJobPostings.map((job) => (
              <Card key={job.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {job.companyName[0]}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {job.position}
                          </h3>
                          <p className="text-gray-600">{job.companyName}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                        {job.description}
                      </p>

                      {/* 기술 스택 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {/* 상세 정보 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          {job.salary}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          {job.experience}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          {job.applicantsCount}명 지원
                        </div>
                      </div>

                      {/* 복지 */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.benefits.slice(0, 3).map((benefit) => (
                          <span key={benefit} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 매칭 점수 */}
                    <div className="ml-6 text-center">
                      <div className="mb-2">
                        <div className="text-xs text-gray-500 mb-1">매칭도</div>
                        <div className="text-4xl font-bold text-primary-600">95</div>
                        <div className="text-xs text-gray-500">점</div>
                      </div>
                      <Badge variant="success" className="mb-2">
                        최고 매칭
                      </Badge>
                    </div>
                  </div>

                  {/* 액션 */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Link href={`/jobs/${job.id}`} className="flex-1">
                      <Button className="w-full" variant="default">
                        상세 보기
                      </Button>
                    </Link>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      지원하기
                    </Button>
                  </div>

                  {/* 마감일 */}
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    마감일: {formatDateKorean(job.deadline)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 일반 공고 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            전체 채용 공고
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {filteredJobs.slice(3).map((job) => (
              <Card key={job.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {job.companyName[0]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{job.position}</CardTitle>
                        <CardDescription>{job.companyName}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{job.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* 기술 스택 */}
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    {/* 정보 */}
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        {job.experience}
                      </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/jobs/${job.id}`} className="flex-1">
                        <Button className="w-full" size="sm" variant="outline">
                          상세 보기
                        </Button>
                      </Link>
                      <Button className="flex-1" size="sm">
                        지원하기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

