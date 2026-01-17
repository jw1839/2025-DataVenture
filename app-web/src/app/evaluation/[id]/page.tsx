'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, FileText, Trophy, TrendingUp, MessageSquare, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { evaluationAPI, Evaluation } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

export default function EvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const evaluationId = params.id as string;
  
  const { user, isAuthenticated } = useAuthStore();
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScript, setShowScript] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }
    
    loadEvaluation();
  }, [isAuthenticated, evaluationId]);

  // 평가 결과 로드 (evaluationId로 직접 조회, 자동 재시도 포함)
  const loadEvaluation = async (isRetry = false) => {
    if (!evaluationId) {
      toast.error('평가 ID를 찾을 수 없습니다.');
      return;
    }
    
    if (!isRetry) {
      setIsLoading(true);
    }
    
    try {
      // interviewId로 평가 조회 (올바른 API 사용)
      const response = await evaluationAPI.getByInterview(evaluationId);
      setEvaluation(response.data);
      setIsLoading(false);
      setIsRetrying(false);
      
      if (isRetry) {
        toast.success('평가 결과를 불러왔습니다!');
      }
    } catch (error: any) {
      console.error('평가 결과 로드 실패:', error);
      
      // 404 에러 시 아직 평가가 생성되지 않음 - 자동 재시도
      if (error.response?.status === 404) {
        // 최대 10번까지 재시도 (3초 간격, 총 30초)
        if (retryCount < 10) {
          if (!isRetrying) {
            setIsRetrying(true);
            toast('평가 생성 중입니다... 잠시만 기다려주세요.', {
              icon: '⏳',
            });
          }
          
          setRetryCount(prev => prev + 1);
          
          // 3초 후 재시도
          setTimeout(() => {
            loadEvaluation(true);
          }, 3000);
        } else {
          // 재시도 횟수 초과
          setIsLoading(false);
          setIsRetrying(false);
          toast.error('평가 생성이 지연되고 있습니다. 대시보드에서 나중에 확인해주세요.');
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        setIsLoading(false);
        setIsRetrying(false);
        toast.error('평가 결과를 불러오는데 실패했습니다.');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    }
  };

  // 의사소통 능력 데이터 (가로 바 차트용)
  const getCommunicationData = () => {
    if (!evaluation) return [];
    
    return [
      { name: '전달력', value: evaluation.deliveryScore, max: 100 },
      { name: '어휘 사용', value: evaluation.vocabularyScore, max: 100 },
      { name: '문제 이해력', value: evaluation.comprehensionScore, max: 100 },
    ];
  };

  // 직무 역량 데이터 (레이더 차트용)
  const getSkillsData = () => {
    if (!evaluation) return [];
    
    return [
      { subject: '정보 분석', score: evaluation.informationAnalysis, fullMark: 100 },
      { subject: '문제 해결', score: evaluation.problemSolving, fullMark: 100 },
      { subject: '유연한 사고', score: evaluation.flexibleThinking, fullMark: 100 },
      { subject: '협상/설득', score: evaluation.negotiation, fullMark: 100 },
      { subject: 'IT 능력', score: evaluation.itSkills, fullMark: 100 },
    ];
  };

  // 추천 직무 파싱 (백엔드에서 이미 파싱된 배열을 반환하지만, 문자열일 수도 있음)
  const getRecommendedPositions = () => {
    if (!evaluation || !evaluation.recommendedPositions) return [];
    
    try {
      // 이미 배열이면 그대로 반환
      if (Array.isArray(evaluation.recommendedPositions)) {
        return evaluation.recommendedPositions;
      }
      // 문자열이면 파싱
      return JSON.parse(evaluation.recommendedPositions as string);
    } catch {
      return [];
    }
  };

  // 강점/약점 파싱 (백엔드에서 이미 파싱된 배열을 반환하지만, 문자열일 수도 있음)
  const getStrengths = () => {
    if (!evaluation || !evaluation.strengthsJson) return [];
    
    try {
      // 이미 배열이면 그대로 반환
      if (Array.isArray(evaluation.strengthsJson)) {
        return evaluation.strengthsJson;
      }
      // 문자열이면 파싱
      return JSON.parse(evaluation.strengthsJson as string);
    } catch {
      return [];
    }
  };

  const getWeaknesses = () => {
    if (!evaluation || !evaluation.weaknessesJson) return [];
    
    try {
      // 이미 배열이면 그대로 반환
      if (Array.isArray(evaluation.weaknessesJson)) {
        return evaluation.weaknessesJson;
      }
      // 문자열이면 파싱
      return JSON.parse(evaluation.weaknessesJson as string);
    } catch {
      return [];
    }
  };

  // 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          {isRetrying ? (
            <div>
              <p className="text-gray-600 font-medium mb-2">평가 생성 중입니다...</p>
              <p className="text-sm text-gray-500">AI가 인터뷰 내용을 분석하고 있습니다. ({retryCount}/10)</p>
              <p className="text-xs text-gray-400 mt-2">평균 10-30초 소요됩니다.</p>
            </div>
          ) : (
            <p className="text-gray-600">평가 결과를 불러오는 중...</p>
          )}
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>평가 결과를 찾을 수 없습니다</CardTitle>
            <CardDescription>
              평가가 아직 진행 중이거나, 오류가 발생했을 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              대시보드로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const communicationData = getCommunicationData();
  const skillsData = getSkillsData();
  const recommendedPositions = getRecommendedPositions();
  const strengths = getStrengths();
  const weaknesses = getWeaknesses();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">인터뷰 평가 결과</h1>
              <p className="mt-2 text-gray-600">
                {evaluation.interview?.mode === 'REAL' ? '실전 모드' : '연습 모드'} | {' '}
                {new Date(evaluation.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">종합 점수</div>
              <div className={`text-4xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                {evaluation.overallScore.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* 의사소통 능력 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              의사소통 능력
            </CardTitle>
            <CardDescription>전달력, 어휘 사용, 문제 이해력 평가</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {communicationData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className={`text-sm font-semibold ${getScoreColor(item.value)}`}>
                      {item.value.toFixed(1)}점
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">평균</span>
                  <span className={`font-bold ${getScoreColor(evaluation.communicationAvg)}`}>
                    {evaluation.communicationAvg.toFixed(1)}점
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 직무 역량 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              직무 역량 평가
            </CardTitle>
            <CardDescription>5가지 핵심 역량 분석</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="역량 점수"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {skillsData.map((skill) => (
                <div key={skill.subject} className="text-center">
                  <div className="text-sm text-gray-600">{skill.subject}</div>
                  <div className={`text-2xl font-bold ${getScoreColor(skill.score)}`}>
                    {skill.score.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 추천 직무 */}
        {recommendedPositions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                추천 직무 순위
              </CardTitle>
              <CardDescription>역량 분석 기반 추천 직무</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendedPositions.map((position: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{position.position || position}</div>
                      {position.reason && (
                        <p className="text-sm text-gray-600 mt-1">{position.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 강점 & 약점 */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* 강점 */}
          {strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Trophy className="h-5 w-5" />
                  강점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 약점 */}
          {weaknesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <TrendingUp className="h-5 w-5" />
                  개선 사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-600 mt-1">•</span>
                      <span className="text-gray-700">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 상세 피드백 */}
        {evaluation.detailedFeedback && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                상세 피드백
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {evaluation.detailedFeedback}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/dashboard')}
          >
            대시보드로 이동
          </Button>
          <Button
            size="lg"
            onClick={() => router.push('/interview/setup')}
          >
            다시 인터뷰하기
          </Button>
        </div>
      </div>
    </div>
  );
}
