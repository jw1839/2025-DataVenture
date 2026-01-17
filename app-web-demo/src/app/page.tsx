import Link from 'next/link';
import { ArrowRight, Brain, BarChart3, Target, CheckCircle, TrendingUp, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <>
      {/* 데모 안내 배너 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-2">
        <div className="container-custom">
          <p className="text-center text-sm font-medium text-white">
            🎬 발표용 데모 버전입니다. 모든 데이터는 시연을 위한 더미 데이터입니다.
          </p>
        </div>
      </div>

      {/* 히어로 섹션 */}
      <section className="gradient-bg py-20 lg:py-32">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6" variant="secondary">
              <TrendingUp className="mr-1 h-3 w-3" />
              현재 활성 사용자 10,000명+
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl animate-fade-in">
              AI가 만드는
              <br />
              <span className="text-gradient">스마트한 채용 매칭</span>
            </h1>
            <p className="mb-8 text-lg text-gray-600 sm:text-xl animate-slide-up">
              GPT-5 기반 대화형 AI 인터뷰로 객관적이고 전문적인 역량 평가
              <br className="hidden sm:block" />
              구직자와 기업의 완벽한 매칭을 실현합니다
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  대시보드 보기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/interview">
                <Button size="lg" variant="outline">
                  AI 인터뷰 체험하기
                </Button>
              </Link>
            </div>

            {/* 실시간 통계 */}
            <div className="mt-12 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">10,247</div>
                <div className="text-sm text-gray-600">총 사용자</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-600">7,593</div>
                <div className="text-sm text-gray-600">완료된 인터뷰</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">892</div>
                <div className="text-sm text-gray-600">성공 매칭</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              왜 flex-AI-Recruiter인가요?
            </h2>
            <p className="text-lg text-gray-600">
              GPT-5 AI 기술과 데이터 분석으로 채용의 새로운 기준을 제시합니다
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="card-hover">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <Brain className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>GPT-5 기반 AI 인터뷰</CardTitle>
                <CardDescription>
                  3D 아바타와 실시간 음성 대화로 자연스러운 면접 경험
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    실시간 맞춤형 질문 생성
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    꼬리 질문으로 심층 평가
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    연습/실전 모드 지원
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100">
                  <BarChart3 className="h-6 w-6 text-secondary-600" />
                </div>
                <CardTitle>통계 기반 객관적 평가</CardTitle>
                <CardDescription>
                  데이터 분석으로 신뢰할 수 있는 평가 제공
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    5가지 직무역량 정량화
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    의사소통능력 3대 지표
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    상세한 피드백 제공
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>AI 매칭 알고리즘</CardTitle>
                <CardDescription>
                  구직자와 기업의 최적 조합을 찾아드립니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    벡터 기반 유사도 분석
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    맞춤형 추천 이유 제시
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    실시간 매칭 점수 계산
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 실적 섹션 */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              검증된 성과
            </h2>
            <p className="text-lg text-gray-600">
              이미 많은 구직자와 기업이 flex-AI-Recruiter를 통해 성공했습니다
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <Card>
              <CardHeader className="text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-primary-600" />
                <CardTitle className="text-4xl">10,247</CardTitle>
                <CardDescription>활성 사용자</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Brain className="mx-auto mb-2 h-8 w-8 text-secondary-600" />
                <CardTitle className="text-4xl">7,593</CardTitle>
                <CardDescription>완료된 AI 인터뷰</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Award className="mx-auto mb-2 h-8 w-8 text-green-600" />
                <CardTitle className="text-4xl">892</CardTitle>
                <CardDescription>성공 매칭</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-orange-600" />
                <CardTitle className="text-4xl">94%</CardTitle>
                <CardDescription>사용자 만족도</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 p-8 text-center text-white lg:p-12">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              지금 바로 데모를 체험해보세요
            </h2>
            <p className="mb-8 text-lg opacity-90">
              실제와 동일한 UI/UX로 모든 기능을 시연할 수 있습니다
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="gap-2">
                  대시보드 둘러보기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/evaluation/latest">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  평가 결과 보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

