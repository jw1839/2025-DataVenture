import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'flex-AI-Recruiter | AI 기반 채용 매칭 플랫폼',
  description: '대화형 AI 인터뷰를 통한 객관적이고 전문적인 역량 평가 및 최적의 채용 매칭',
  keywords: ['AI 채용', '인터뷰', '채용 매칭', '구직', '채용담당자', 'AI 면접'],
  authors: [{ name: 'flex-AI-Recruiter Team' }],
  openGraph: {
    title: 'flex-AI-Recruiter',
    description: '대화형 AI 기반 채용 매칭 플랫폼',
    type: 'website',
    locale: 'ko_KR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="antialiased">
        <Toaster position="top-right" />
        <Navigation />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="container-custom py-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  flex-AI-Recruiter
                </h3>
                <p className="text-sm text-gray-600">
                  AI 기반 대화형 인터뷰를 통한
                  <br />
                  스마트한 채용 매칭 플랫폼
                </p>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900">
                  서비스
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <a href="/interview" className="hover:text-primary-600">
                      AI 인터뷰
                    </a>
                  </li>
                  <li>
                    <a href="/jobs" className="hover:text-primary-600">
                      채용 공고
                    </a>
                  </li>
                  <li>
                    <a href="/recommendations" className="hover:text-primary-600">
                      AI 추천
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900">
                  지원
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <a href="/help" className="hover:text-primary-600">
                      도움말
                    </a>
                  </li>
                  <li>
                    <a href="/privacy" className="hover:text-primary-600">
                      개인정보처리방침
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="hover:text-primary-600">
                      이용약관
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
              © 2025 flex-AI-Recruiter. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

