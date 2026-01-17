'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Loader2, User, Star, TrendingUp } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface CandidateRecommendation {
  candidate: {
    userId: string;
    resumeText?: string;
    skills: string[];
    experience: number;
    desiredPosition: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
    evaluation?: {
      informationAnalysis: number;
      problemSolving: number;
      flexibleThinking: number;
      negotiation: number;
      itSkills: number;
    };
  };
  matchingScore: number;
  matchingReason: string;
}

export default function RecruiterRecommendationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams?.get('jobId');
  const { user, isAuthenticated } = useAuthStore();
  const [recommendations, setRecommendations] = useState<CandidateRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    if (!jobId) {
      toast.error('공고 ID가 필요합니다.');
      router.push('/dashboard/recruiter');
      return;
    }

    fetchRecommendations();
  }, [isAuthenticated, user, jobId]);

  const fetchRecommendations = async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get(
        `/api/v1/recommendations/candidates/${jobId}`,
        { params: { limit: 10 } }
      );

      setRecommendations(response.data.recommendations);
    } catch (err: any) {
      console.error('추천 조회 실패:', err);
      setError(
        err.response?.data?.message ||
          '추천 후보를 불러올 수 없습니다.'
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

  const prepareRadarData = (evaluation: any) => {
    return [
      { subject: '정보분석', value: evaluation.informationAnalysis, fullMark: 100 },
      { subject: '문제해결', value: evaluation.problemSolving, fullMark: 100 },
      { subject: '유연사고', value: evaluation.flexibleThinking, fullMark: 100 },
      { subject: '협상설득', value: evaluation.negotiation, fullMark: 100 },
      { subject: 'IT능력', value: evaluation.itSkills, fullMark: 100 },
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">추천 후보를 분석하는 중...</p>
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
            <h1 className="text-xl font-bold text-gray-900">AI 추천 후보</h1>
            <p className="text-sm text-gray-600 mt-1">
              공고에 가장 적합한 후보를 추천합니다
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/recruiter')}
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
          </div>
        )}

        {recommendations.length === 0 && !isLoading && !error ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">추천할 후보가 없습니다.</p>
            <p className="text-sm text-gray-400 mb-6">
              실전 인터뷰를 완료한 구직자가 없거나 조건에 맞는 후보가 없습니다.
            </p>
            <button
              onClick={() => router.push('/dashboard/recruiter')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {recommendations.map((rec, index) => (
              <div
                key={rec.candidate.userId}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200"
              >
                {/* 헤더: 순위 + 매칭 점수 */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-gray-300">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">
                          {rec.candidate.user?.name || '익명'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {rec.candidate.desiredPosition} · 경력 {rec.candidate.experience}년
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-lg font-bold border flex items-center gap-2 ${getScoreColor(
                      rec.matchingScore
                    )}`}
                  >
                    <Star className="w-4 h-4" />
                    {rec.matchingScore.toFixed(0)}점
                  </span>
                </div>

                {/* 매칭 근거 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    매칭 근거
                  </p>
                  <p className="text-sm text-blue-700">{rec.matchingReason}</p>
                </div>

                {/* 5각형 차트 + 상세 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 5각형 역량 차트 */}
                  {rec.candidate.evaluation && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">역량 분석</h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={prepareRadarData(rec.candidate.evaluation)}>
                          <PolarGrid stroke="#cbd5e1" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#475569', fontSize: 12 }}
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar
                            name="역량"
                            dataKey="value"
                            stroke="#0891b2"
                            fill="#0891b2"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* 기술 스택 및 경력 */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">보유 기술</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.candidate.skills.slice(0, 8).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-200"
                          >
                            {skill}
                          </span>
                        ))}
                        {rec.candidate.skills.length > 8 && (
                          <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                            +{rec.candidate.skills.length - 8}
                          </span>
                        )}
                      </div>
                    </div>

                    {rec.candidate.resumeText && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">소개</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {rec.candidate.resumeText}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => router.push(`/profile/candidate/${rec.candidate.userId}`)}
                    className="flex-1 px-4 py-2 bg-white border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    프로필 보기
                  </button>
                  <button
                    onClick={() => {
                      // TODO: 연락하기 기능
                      toast.success('연락 기능은 추후 구현 예정입니다.');
                    }}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    연락하기
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

