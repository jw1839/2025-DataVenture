/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 환경 변수 (NEXT_PUBLIC_ 접두사는 클라이언트에 노출됨)
  env: {
    NEXT_PUBLIC_CORE_API_URL: process.env.NEXT_PUBLIC_CORE_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },

  // 이미지 최적화 설정
  images: {
    domains: ['storage.googleapis.com', 'localhost'], // GCP Cloud Storage + localhost
    unoptimized: true, // 로컬 개발 시 이미지 최적화 비활성화
  },

  // 업로드 파일 프록시
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8080/uploads/:path*',
      },
      // service-worker.js 요청 무시 (브라우저 캐시 문제 해결)
      {
        source: '/service-worker.js',
        destination: '/404',
      },
    ];
  },

  // Webpack 설정 (필요 시)
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig;

