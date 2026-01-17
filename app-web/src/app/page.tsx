import Link from 'next/link';
import { ArrowRight, Brain, BarChart3, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="gradient-bg py-20 lg:py-32">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl animate-fade-in">
              AI가 만드는
              <br />
              <span className="text-gradient">스마트한 채용 매칭</span>
            </h1>
            <p className="mb-8 text-lg text-gray-600 sm:text-xl animate-slide-up">
              대화형 AI 인터뷰를 통한 객관적이고 전문적인 역량 평가로
              <br className="hidden sm:block" />
              구직자와 기업의 완벽한 매칭을 실현합니다
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2">
                  지금 시작하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/interview">
                <Button size="lg" variant="outline">
                  AI 인터뷰 체험하기
                </Button>
              </Link>
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
              AI 기술과 데이터 분석으로 채용의 새로운 기준을 제시합니다
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="card-hover">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <Brain className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>대화형 AI 인터뷰</CardTitle>
                <CardDescription>
                  자연스러운 대화를 통해 구직자의 역량을 깊이 있게 평가합니다
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
                <CardTitle>통계 기반 평가</CardTitle>
                <CardDescription>
                  데이터 분석으로 객관적이고 신뢰할 수 있는 평가를 제공합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    5가지 직무역량 평가
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    의사소통능력 분석
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
                <CardTitle>정밀한 매칭</CardTitle>
                <CardDescription>
                  AI 알고리즘으로 구직자와 기업의 최적 조합을 찾아드립니다
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

      {/* 사용자 타입별 안내 */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="container-custom">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* 구직자 */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-2xl">구직자를 위한 서비스</CardTitle>
                <CardDescription className="text-base">
                  AI 인터뷰로 당신의 진짜 역량을 증명하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-900">
                      1. 프로필 등록
                    </h4>
                    <p className="text-sm text-gray-600">
                      학력, 경력, 보유 기술 등 상세한 정보를 입력하세요
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-900">
                      2. AI 인터뷰 진행
                    </h4>
                    <p className="text-sm text-gray-600">
                      연습 또는 실전 모드로 AI 면접관과 대화하세요
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-900">
                      3. 평가 및 추천
                    </h4>
                    <p className="text-sm text-gray-600">
                      상세한 평가 결과와 맞춤형 채용 공고를 받아보세요
                    </p>
                  </div>
                </div>
                <Link href="/auth/register?role=candidate" className="block">
                  <Button className="w-full gap-2">
                    구직자로 시작하기
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 채용담당자 */}
            <Card className="card-hover border-primary-200 bg-primary-50/30">
              <CardHeader>
                <CardTitle className="text-2xl">채용담당자를 위한 서비스</CardTitle>
                <CardDescription className="text-base">
                  AI가 검증한 최적의 인재를 만나세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-900">
                      1. 회사 정보 등록
                    </h4>
                    <p className="text-sm text-gray-600">
                      회사 소개, 인재상, 원하는 직무를 상세히 작성하세요
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-900">
                      2. 채용 공고 작성
                    </h4>
                    <p className="text-sm text-gray-600">
                      직무별로 채용 공고를 등록하고 관리하세요
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-900">
                      3. AI 추천 및 대시보드
                    </h4>
                    <p className="text-sm text-gray-600">
                      적합한 지원자를 추천받고 한눈에 관리하세요
                    </p>
                  </div>
                </div>
                <Link href="/auth/register?role=recruiter" className="block">
                  <Button className="w-full gap-2" variant="default">
                    채용담당자로 시작하기
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 p-8 text-center text-white lg:p-12">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              지금 바로 시작하세요
            </h2>
            <p className="mb-8 text-lg opacity-90">
              AI 기반 채용 매칭으로 더 나은 미래를 만들어가세요
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  무료로 시작하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  더 알아보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

