'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

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
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchJobs();
  }, [currentPage]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get('/api/v1/jobs', {
        params: {
          page: currentPage,
          limit: 9,
          status: 'ACTIVE',
        },
      });

      setJobs(response.data.jobs);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      console.error('공고 조회 실패:', err);
      setError('채용 공고를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToDetail = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">채용 공고를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">채용 공고</h1>
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
          </div>
        )}

        {jobs.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">등록된 채용 공고가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 공고 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => goToDetail(job.id)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border border-gray-200"
                >
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-sm text-primary-600 font-medium mb-3">
                    {job.company}
                  </p>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {job.position}
                    </span>
                    {job.location && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {job.location}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    경력: {job.experienceMin}
                    {job.experienceMax ? `-${job.experienceMax}` : '+'} 년
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

