'use client';

import { 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  Calendar,
  Edit,
  CheckCircle,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { currentCompany } from '@/data/mockData';

export default function CompanyProfilePage() {
  const company = currentCompany;

  return (
    <div className="py-8">
      <div className="container-custom max-w-5xl">
        {/* 헤더 */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              회사 정보
            </h1>
            <p className="text-gray-600">
              구직자에게 보이는 회사 프로필입니다
            </p>
          </div>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            정보 수정
          </Button>
        </div>

        {/* 회사 기본 정보 */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* 로고 */}
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                {company.name[0]}
              </div>

              {/* 정보 */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{company.name}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-4 w-4" />
                    {company.industry}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    {company.employees}명
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    설립 {company.founded}년
                  </div>
                </div>
                <a 
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                >
                  <Globe className="h-4 w-4" />
                  {company.website}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 회사 소개 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              회사 소개
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {company.description}
            </p>
          </CardContent>
        </Card>

        {/* 비전 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>비전</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100">
              <p className="text-lg font-semibold text-gray-900 text-center">
                &ldquo;{company.vision}&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 조직 문화 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              조직 문화
            </CardTitle>
            <CardDescription>
              우리가 중요하게 생각하는 가치들
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {company.culture.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                  <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <span className="text-gray-900">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 복지 혜택 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>복지 혜택</CardTitle>
            <CardDescription>
              우리 회사만의 특별한 복지
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {company.benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="justify-start py-2 px-3">
                  {benefit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 통계 */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>활성 채용 공고</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">3개</div>
              <p className="text-sm text-gray-600 mt-1">진행 중</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>총 지원자</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary-600">97명</div>
              <p className="text-sm text-gray-600 mt-1">이번 달</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>프로필 조회수</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">2,451</div>
              <p className="text-sm text-gray-600 mt-1">최근 30일</p>
            </CardContent>
          </Card>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          <Button className="flex-1">
            <Edit className="mr-2 h-4 w-4" />
            회사 정보 수정
          </Button>
          <Button variant="outline" className="flex-1">
            <Globe className="mr-2 h-4 w-4" />
            공개 프로필 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

