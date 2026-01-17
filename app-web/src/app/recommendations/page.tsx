'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import apiClient from '@/lib/api-client';

interface Recommendation {
  jobPosting: {
    id: string;
    title: string;
    description: string;
    position: string;
    company: string;
    location: string | null;
    experienceMin: number;
    experienceMax: number | null;
    requirements: string[];
    preferredSkills: string[];
  };
  matchingScore: number;
  matchingReason: string;
}

export default function RecommendationsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'CANDIDATE') {
      setError('구직자만 추천 공고를 볼 수 있습니다.');
      setIsLoading(false);
      return;
    }

    fetchRecommendations();
  }, [isAuthenticated, user]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get('/api/v1/recommendations/jobs', {
        params: { limit: 10 },
      });

      setRecommendations(response.data.recommendations);
    } catch (err: any) {
      console.error('추천 조회 실패:', err);
      setError(
        err.response?.data?.message ||
          '추천 공고를 불러올 수 없습니다. 프로필을 먼저 작성해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">추천 공고를 분석하는 중...</p>
          <p className="mt-2 text-sm text-gray-500">AI가 맞춤 공고를 찾고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI 추천 공고</h1>
            <p className="text-sm text-gray-600 mt-1">
              당신의 프로필에 가장 적합한 공고를 추천합니다
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← 대시보드로
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
            >
              프로필 작성하러 가기
            </button>
          </div>
        )}

        {recommendations.length === 0 && !isLoading && !error ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">추천할 공고가 없습니다.</p>
            <p className="text-sm text-gray-400 mb-6">
              프로필을 더 자세히 작성하거나 나중에 다시 시도해주세요.
            </p>
            <button
              onClick={() => router.push('/jobs')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              전체 공고 보기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <div
                key={rec.jobPosting.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200"
              >
                {/* 매칭 점수 배지 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(
                          rec.matchingScore
                        )}`}
                      >
                        매칭도 {rec.matchingScore.toFixed(0)}%
                      </span>
                    </div>
                    <h3
                      onClick={() => router.push(`/jobs/${rec.jobPosting.id}`)}
                      className="font-bold text-xl text-gray-900 hover:text-primary-600 cursor-pointer mb-2"
                    >
                      {rec.jobPosting.title}
                    </h3>
                    <p className="text-md text-primary-600 font-medium mb-3">
                      {rec.jobPosting.company}
                    </p>
                  </div>
                </div>

                {/* 매칭 근거 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">매칭 근거</p>
                  <p className="text-sm text-blue-700">{rec.matchingReason}</p>
                </div>

                {/* 공고 정보 */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {rec.jobPosting.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {rec.jobPosting.position}
                  </span>
                  {rec.jobPosting.location && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {rec.jobPosting.location}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    경력: {rec.jobPosting.experienceMin}
                    {rec.jobPosting.experienceMax ? `-${rec.jobPosting.experienceMax}` : '+'} 년
                  </span>
                </div>

                {/* 요구 기술 */}
                {rec.jobPosting.requirements.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">필수 요건:</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.jobPosting.requirements.slice(0, 5).map((req, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200"
                        >
                          {req}
                        </span>
                      ))}
                      {rec.jobPosting.requirements.length > 5 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                          +{rec.jobPosting.requirements.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/jobs/${rec.jobPosting.id}`)}
                    className="flex-1 px-4 py-2 bg-white border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    상세 보기
                  </button>
                  <button
                    onClick={() => router.push('/interview')}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    AI 인터뷰 시작
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

