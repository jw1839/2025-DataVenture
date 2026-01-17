'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  position: string;
  company: string;
  location: string | null;
  employmentType: string | null;
  salary: string | null;
  experienceMin: number;
  experienceMax: number | null;
  requirements: string[];
  preferredSkills: string[];
  status: string;
  createdAt: string;
  recruiter?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get(`/api/v1/jobs/${params.id}`);
      setJob(response.data.jobPosting);
    } catch (err: any) {
      console.error('공고 조회 실패:', err);
      setError('채용 공고를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 지원하기
  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'CANDIDATE') {
      toast.error('구직자만 지원할 수 있습니다.');
      return;
    }

    setIsApplying(true);

    try {
      await apiClient.post('/api/v1/applications', {
        jobPostingId: params.id,
        coverLetter: '', // 추후 자기소개서 입력 모달 추가 가능
      });

      toast.success('지원서가 제출되었습니다!');
      // 지원 내역 페이지로 이동 (추후 구현)
      // router.push('/applications/my');
    } catch (error: any) {
      console.error('지원 실패:', error);
      const errorMessage = error.response?.data?.message || '지원에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">공고를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">오류 발생</h2>
          <p className="text-gray-600 text-center mb-6">{error || '공고를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/jobs')}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            공고 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">채용 공고 상세</h1>
          <button
            onClick={() => router.push('/jobs')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← 목록으로
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 공고 정보 */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{job.title}</h2>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-lg font-semibold text-primary-600">{job.company}</p>
              {job.location && (
                <p className="text-sm text-gray-500">{job.location}</p>
              )}
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">직무</p>
              <p className="font-medium text-gray-900">{job.position}</p>
            </div>
            {job.employmentType && (
              <div>
                <p className="text-sm text-gray-500 mb-1">고용 형태</p>
                <p className="font-medium text-gray-900">{job.employmentType}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">경력</p>
              <p className="font-medium text-gray-900">
                {job.experienceMin}
                {job.experienceMax ? `-${job.experienceMax}` : '+'} 년
              </p>
            </div>
            {job.salary && (
              <div>
                <p className="text-sm text-gray-500 mb-1">급여</p>
                <p className="font-medium text-gray-900">{job.salary}</p>
              </div>
            )}
          </div>

          {/* 공고 설명 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">공고 설명</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* 필수 요건 */}
          {job.requirements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">필수 요건</h3>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 우대 사항 */}
          {job.preferredSkills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">우대 사항</h3>
              <ul className="space-y-2">
                {job.preferredSkills.map((skill, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-gray-700">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 등록 정보 */}
          <div className="text-sm text-gray-500 pt-6 border-t border-gray-200">
            등록일: {new Date(job.createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? '지원 중...' : '지원하기'}
          </button>
          <button
            onClick={() => router.push('/interview')}
            className="flex-1 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            AI 인터뷰 시작
          </button>
          <button
            onClick={() => router.push('/jobs')}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            목록으로
          </button>
        </div>
      </main>
    </div>
  );
}

