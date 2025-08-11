import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SearchIndexProvider } from './providers/SearchIndexProvider'

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

export const metadata: Metadata = {
  title: '재무AI',
  description: 'AI 재무제표 데이터 분석 서비스',
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
      </body>
    </html>
  )
}
