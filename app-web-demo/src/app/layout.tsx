import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import Navigation from '@/components/layout/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'flex-AI-Recruiter - 데모',
  description: 'AI 기반 채용 매칭 플랫폼 발표용 데모',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Navigation />

        {/* 메인 콘텐츠 */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="container-custom">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-gray-600">
                © 2025 flex-AI-Recruiter. All rights reserved. (데모 버전)
              </p>
              <div className="flex gap-6">
                <Link
                  href="#"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  서비스 소개
                </Link>
                <Link
                  href="#"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  이용약관
                </Link>
                <Link
                  href="#"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  개인정보처리방침
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

