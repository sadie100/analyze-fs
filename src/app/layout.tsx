import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SearchIndexProvider } from './providers/SearchIndexProvider'
import Script from 'next/script'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const viewport: Viewport = {
  themeColor: '#162B43',
}

export const metadata: Metadata = {
  title: '재무AI | 재무제표 데이터 분석 서비스',
  description:
    '재무AI는 금융감독원 DART 2025년 1분기 보고서를 바탕으로 2,664개 기업의 재무제표를 자동 분석해 수익성·안정성·성장성·활동성 지표와 등급을 제공하는 서비스입니다.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: '재무AI | 재무제표 데이터 분석 서비스',
    description:
      '재무AI는 금융감독원 DART 2025년 1분기 보고서를 바탕으로 2,664개 기업의 재무제표를 자동 분석해 수익성·안정성·성장성·활동성 지표와 등급을 제공하는 서비스입니다.',
    url: 'https://analyze-fs.vercel.app/',
    siteName: '재무AI',
    images: [
      {
        url: './android-chrome-512x512.png', // Must be an absolute URL
        width: 512,
        height: 512,
        alt: '재무AI 아이콘',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SearchIndexProvider>{children}</SearchIndexProvider>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-1L06CC0FWS"
        ></Script>
        <Script>
          {`window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-1L06CC0FWS');`}
        </Script>
      </body>
    </html>
  )
}
