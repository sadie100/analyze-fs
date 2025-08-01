import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 정적 파일 최적화
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs',
    ],
  },

  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // 압축 활성화
  compress: true,

  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

export default nextConfig
