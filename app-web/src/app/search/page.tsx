'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2, User, Building2, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { searchAPI } from '@/lib/api';
import toast from 'react-hot-toast';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const { user, isAuthenticated } = useAuthStore();
  
  const [query, setQuery] = useState(queryParam);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // 초기 검색 (URL 파라미터)
  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    }
  }, [queryParam]);

  // 검색 수행
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      toast.error('검색어를 입력하세요.');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await searchAPI.search({
        q: searchQuery,
        limit: 20,
      });
      
      setResults(response.data);
      
      // URL 업데이트
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } catch (error: any) {
      console.error('검색 실패:', error);
      toast.error('검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 자동완성
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await searchAPI.suggestions({
        q: searchQuery,
        limit: 5,
      });
      
      setSuggestions(response.data.suggestions);
    } catch (error) {
      // 자동완성 실패는 조용히 처리
      setSuggestions([]);
    }
  };

  // 검색어 변경
  const handleQueryChange = (value: string) => {
    setQuery(value);
    fetchSuggestions(value);
  };

  // 검색 제출
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  // 구직자 프로필 카드
  const renderCandidateCard = (candidate: any) => (
    <Card key={candidate.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start gap-4">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={candidate.user?.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <User className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {candidate.user?.name}
              {candidate.desiredPosition && (
                <Badge variant="secondary">{candidate.desiredPosition}</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {candidate.bio || '자기소개가 없습니다.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 스킬 */}
        {candidate.skillsJson && (
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Briefcase className="h-4 w-4" />
              보유 기술
            </div>
            <div className="flex flex-wrap gap-2">
              {JSON.parse(candidate.skillsJson).slice(0, 5).map((skill: string) => (
                <Badge key={skill} variant="outline">{skill}</Badge>
              ))}
              {JSON.parse(candidate.skillsJson).length > 5 && (
                <Badge variant="outline">+{JSON.parse(candidate.skillsJson).length - 5}</Badge>
              )}
            </div>
          </div>
        )}
        
        {/* 학력 */}
        {candidate.educationJson && (
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <GraduationCap className="h-4 w-4" />
              학력
            </div>
            <p className="text-sm text-gray-600">
              {JSON.parse(candidate.educationJson)[0]?.school || '학력 정보 없음'}
            </p>
          </div>
        )}
        
        <Button
          onClick={() => router.push(`/profile/candidate?id=${candidate.userId}`)}
          className="w-full mt-4"
        >
          프로필 보기
        </Button>
      </CardContent>
    </Card>
  );

  // 채용담당자 프로필 카드
  const renderRecruiterCard = (recruiter: any) => (
    <Card key={recruiter.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start gap-4">
          {recruiter.companyLogoUrl ? (
            <img
              src={recruiter.companyLogoUrl}
              alt={recruiter.companyName}
              className="h-16 w-16 rounded object-contain bg-gray-50 p-2 border"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1">
            <CardTitle>{recruiter.companyName}</CardTitle>
            <CardDescription className="mt-1">
              {recruiter.position} | {recruiter.department}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 회사 설명 */}
        {recruiter.companyDescription && (
          <p className="mb-3 text-sm text-gray-600 line-clamp-2">
            {recruiter.companyDescription}
          </p>
        )}
        
        {/* 모집 직무 */}
        {recruiter.hiringPositionsJson && (
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Briefcase className="h-4 w-4" />
              모집 직무
            </div>
            <div className="flex flex-wrap gap-2">
              {JSON.parse(recruiter.hiringPositionsJson).map((position: string) => (
                <Badge key={position} variant="secondary">{position}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* 웹사이트 */}
        {recruiter.companyWebsite && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <a
              href={recruiter.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              {recruiter.companyWebsite}
            </a>
          </div>
        )}
        
        <Button
          onClick={() => router.push(`/profile/recruiter?id=${recruiter.userId}`)}
          className="w-full mt-4"
        >
          회사 정보 보기
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* 검색 바 */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative mx-auto max-w-3xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="구직자, 채용담당자, 회사명, 기술 스택을 검색하세요..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="h-14 pl-12 pr-4 text-lg"
              />
            </div>
            
            {/* 자동완성 */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-2 w-full rounded-lg border bg-white shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion);
                      setSuggestions([]);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Search className="inline h-4 w-4 mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* 검색 중 */}
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* 검색 결과 */}
        {!isSearching && results && (
          <div>
            {/* 결과 요약 */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                "{results.query}" 검색 결과
              </h2>
              <p className="mt-2 text-gray-600">
                총 {results.totalCount}개 결과 (구직자 {results.candidates.length}명, 채용담당자 {results.recruiters.length}명)
              </p>
            </div>

            {/* 구직자 결과 */}
            {results.candidates.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  구직자 ({results.candidates.length})
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {results.candidates.map((candidate: any) => renderCandidateCard(candidate))}
                </div>
              </div>
            )}

            {/* 채용담당자 결과 */}
            {results.recruiters.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  채용 중인 회사 ({results.recruiters.length})
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {results.recruiters.map((recruiter: any) => renderRecruiterCard(recruiter))}
                </div>
              </div>
            )}

            {/* 결과 없음 */}
            {results.totalCount === 0 && (
              <div className="py-12 text-center">
                <Search className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-600">
                  다른 검색어로 시도해보세요.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 초기 화면 */}
        {!isSearching && !results && !queryParam && (
          <div className="py-12 text-center">
            <Search className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              검색어를 입력하세요
            </h3>
            <p className="text-gray-600">
              구직자, 채용담당자, 회사명, 기술 스택 등을 검색할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
