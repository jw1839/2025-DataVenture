'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { recruiterJobPostings } from '@/data/mockData';
import { formatDateKorean } from '@/lib/utils';

export default function RecruiterJobsPage() {
  const [selectedTab, setSelectedTab] = useState<'active' | 'draft' | 'closed'>('active');

  const filteredJobs = recruiterJobPostings.filter(job => job.status === selectedTab);
  const activeCount = recruiterJobPostings.filter(j => j.status === 'active').length;
  const draftCount = recruiterJobPostings.filter(j => j.status === 'draft').length;
  const closedCount = recruiterJobPostings.filter(j => j.status === 'closed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">활성</Badge>;
      case 'draft':
        return <Badge variant="secondary">임시저장</Badge>;
      case 'closed':
        return <Badge variant="outline">마감</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* 헤더 */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              채용 공고 관리
            </h1>
            <p className="text-gray-600">
              우리 회사의 채용 공고를 관리하세요
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 공고 작성
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>활성 공고</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeCount}개</div>
              <p className="text-sm text-gray-600 mt-1">지원 받는 중</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>총 지원자</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">97명</div>
              <p className="text-sm text-gray-600 mt-1">전체 공고</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>평균 조회수</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary-600">901</div>
              <p className="text-sm text-gray-600 mt-1">공고당</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>임시저장</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{draftCount}개</div>
              <p className="text-sm text-gray-600 mt-1">작성 중</p>
            </CardContent>
          </Card>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('active')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
              selectedTab === 'active'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            활성 공고 ({activeCount})
          </button>
          <button
            onClick={() => setSelectedTab('draft')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
              selectedTab === 'draft'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            임시저장 ({draftCount})
          </button>
          <button
            onClick={() => setSelectedTab('closed')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
              selectedTab === 'closed'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            마감 공고 ({closedCount})
          </button>
        </div>

        {/* 공고 리스트 */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{job.position}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-gray-600 mb-3">{job.description}</p>

                    {/* 기술 스택 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    {/* 정보 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {job.applicantsCount}명 지원
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {job.viewCount.toLocaleString()}회 조회
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDateKorean(job.createdDate)} 작성
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {formatDateKorean(job.deadline)} 마감
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="ml-6 flex flex-col gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="mr-1 h-3 w-3" />
                      수정
                    </Button>
                    {job.status === 'active' ? (
                      <Button variant="outline" size="sm">
                        <EyeOff className="mr-1 h-3 w-3" />
                        비활성화
                      </Button>
                    ) : job.status === 'draft' ? (
                      <Button variant="default" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        게시
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="mr-1 h-3 w-3" />
                      삭제
                    </Button>
                  </div>
                </div>

                {/* 하단 액션 */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Link href={`/recruiter?job=${job.id}`} className="flex-1">
                    <Button className="w-full" variant="default" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      지원자 보기 ({job.applicantsCount}명)
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    공고 미리보기
                  </Button>
                  <Button variant="outline" size="sm">
                    통계 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {selectedTab === 'active' && '활성 공고가 없습니다'}
                  {selectedTab === 'draft' && '임시저장된 공고가 없습니다'}
                  {selectedTab === 'closed' && '마감된 공고가 없습니다'}
                </p>
                <p className="text-sm mb-4">새로운 채용 공고를 작성해보세요</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  새 공고 작성
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

