'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import SearchBar from '@/components/SearchBar'
import {
  TrendingUp,
  Shield,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { AnalysisResult } from '@/lib/financial-analyzer'

// 타입은 lib 모듈의 공개 타입을 사용

const NO_DATA_LABEL = '데이터 없음' as const

interface FinancialResultProps {
  initialCompany: string
  data: AnalysisResult | null
  usedExactMatch: boolean
  error: string | null
}

interface GuidelineBoxProps {
  description: string
  children: React.ReactNode
}

const GuidelineBox: React.FC<GuidelineBoxProps> = ({
  description,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm transition-all duration-200">
      <div className="flex justify-between items-start gap-4">
        <p className="text-gray-600 flex-1">{description}</p>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 font-medium text-xs flex items-center gap-1 hover:text-blue-800 transition-colors whitespace-nowrap mt-0.5"
        >
          {isOpen ? '접기' : '더보기'}
          {isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-gray-200 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

const FinancialResult: React.FC<FinancialResultProps> = ({
  initialCompany,
  data,
  usedExactMatch,
  error,
}: FinancialResultProps) => {
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState(initialCompany)
  const [isLoading] = useState(false)

  const handleSearch = useCallback(
    (term: string) => {
      if (term) {
        setSearchTerm(term)
        router.replace(`/result?company=${encodeURIComponent(term)}`)
      } else {
        router.push('/')
      }
    },
    [router]
  )

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatRatio = (value: number | null, suffix = '%') => {
    if (value === null) return NO_DATA_LABEL
    return `${value.toFixed(1)}${suffix}`
  }

  // 기본 검색 화면으로 리디렉션 유도
  if (!data && !isLoading && !error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">🏢 기업 재무분석 시스템</h2>
              <p className="text-gray-600">
                2,664개 기업의 2025년 1분기 재무데이터를 분석합니다
              </p>
              <div className="relative max-w-md mx-auto">
                <SearchBar
                  defaultValue={searchTerm}
                  onSearch={(term) => handleSearch(term)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h3 className="text-lg font-semibold">재무데이터 분석 중...</h3>
              <p className="text-gray-600">
                2,664개 기업 데이터에서 검색하고 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-red-700">분석 실패</h3>
              <p className="text-red-600">{error}</p>
              <Button
                onClick={() => {
                  router.replace('/result')
                }}
                variant="outline"
              >
                다시 검색하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchBar
                  defaultValue={searchTerm}
                  onSearch={(term) => handleSearch(term)}
                  placeholder="다른 회사 검색..."
                />
              </div>
            </div>
            {!usedExactMatch && (
              <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                유사한 회사명으로 검색되었습니다
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={data.evaluation.색상}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-6xl">{data.evaluation.이모지}</div>
              <div>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {data.companyName}
                  <span className="text-2xl bg-white px-3 py-1 rounded-full text-gray-800">
                    {data.evaluation.등급}등급
                  </span>
                </div>
                <div className="text-xl text-gray-700 mt-1">
                  재무상태: {data.evaluation.상태} ({data.evaluation.총점}점)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-sm text-gray-600">수익성</div>
                <div
                  className={`text-lg font-bold ${getScoreColor(
                    data.evaluation.수익성점수
                  )}`}
                >
                  {data.evaluation.수익성점수}점
                </div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-sm text-gray-600">안정성</div>
                <div
                  className={`text-lg font-bold ${getScoreColor(
                    data.evaluation.안정성점수
                  )}`}
                >
                  {data.evaluation.안정성점수}점
                </div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-sm text-gray-600">성장성</div>
                <div
                  className={`text-lg font-bold ${getScoreColor(
                    data.evaluation.성장성점수
                  )}`}
                >
                  {data.evaluation.성장성점수}점
                </div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-sm text-gray-600">활동성</div>
                <div
                  className={`text-lg font-bold ${getScoreColor(
                    data.evaluation.활동성점수
                  )}`}
                >
                  {data.evaluation.활동성점수}점
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-white/30 rounded-lg p-3">
              <div className="font-medium mb-1">기업 정보</div>
              <div>
                업종: {data.basicInfo.업종명} | 시장: {data.basicInfo.시장구분}
              </div>
              <div>
                결산기준일: {data.basicInfo.결산기준일} | 종목코드:{' '}
                {data.basicInfo.종목코드}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              수익성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GuidelineBox description="본업의 수익 창출력과 자본 효율성을 보여줍니다. 높을수록 좋습니다.">
              <div className="space-y-2">
                <div className="font-semibold pt-1">계산식</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>영업이익률 = (영업이익 ÷ 매출액) × 100</li>
                  <li>순이익률 = (당기순이익 ÷ 매출액) × 100</li>
                  <li>ROA = (당기순이익 ÷ 자산총계) × 100</li>
                  <li>ROE = (당기순이익 ÷ 자본총계) × 100</li>
                </ul>
                <div className="font-semibold pt-1">가이드라인</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>영업이익률: 10%+ 양호, 15%+ 매우 우수</li>
                  <li>순이익률: 7%+ 양호, 10%+ 매우 우수</li>
                  <li>ROA: 7%+ 양호, 10%+ 매우 우수</li>
                  <li>ROE: 10%+ 양호, 15%+ 매우 우수</li>
                </ul>
              </div>
            </GuidelineBox>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>영업이익률</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.수익성점수
                  )}`}
                >
                  {formatRatio(data.ratios.수익성.영업이익률)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>순이익률</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.수익성점수
                  )}`}
                >
                  {formatRatio(data.ratios.수익성.순이익률)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>ROA (총자산수익률)</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.수익성점수
                  )}`}
                >
                  {formatRatio(data.ratios.수익성.ROA)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>ROE (자기자본수익률)</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.수익성점수
                  )}`}
                >
                  {formatRatio(data.ratios.수익성.ROE)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              안정성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GuidelineBox description="부채와 유동성 관점에서 재무구조의 안전도를 봅니다. 일부 항목은 낮을수록 좋습니다.">
              <div className="space-y-2">
                <div className="font-semibold pt-1">계산식</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>부채비율 = (부채총계 ÷ 자본총계) × 100</li>
                  <li>유동비율 = (유동자산 ÷ 유동부채) × 100</li>
                  <li>자기자본비율 = (자본총계 ÷ 자산총계) × 100</li>
                </ul>
                <div className="font-semibold pt-1">가이드라인</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>부채비율: 낮을수록 좋음 (≤ 50% 우수, ≤ 100% 양호)</li>
                  <li>유동비율: 150%+ 양호, 200%+ 매우 우수</li>
                  <li>자기자본비율: 40%+ 양호, 60%+ 매우 우수</li>
                </ul>
              </div>
            </GuidelineBox>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>부채비율</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.안정성점수
                  )}`}
                >
                  {formatRatio(data.ratios.안정성.부채비율)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>유동비율</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.안정성점수
                  )}`}
                >
                  {formatRatio(data.ratios.안정성.유동비율)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>자기자본비율</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.안정성점수
                  )}`}
                >
                  {formatRatio(data.ratios.안정성.자기자본비율)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              성장성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GuidelineBox description="매출과 이익의 성장 속도를 보여줍니다. 높을수록 좋습니다.">
              <div className="space-y-2">
                <div className="font-semibold pt-1">계산식</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    매출액 증가율 = ((당해 매출액 − 전년 매출액) ÷ 전년 매출액)
                    × 100
                  </li>
                  <li>
                    영업이익 증가율 = ((당해 영업이익 − 전년 영업이익) ÷ 전년
                    영업이익) × 100
                  </li>
                </ul>
                <div className="font-semibold pt-1">가이드라인</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>매출액 증가율: 10%+ 양호, 20%+ 매우 우수</li>
                  <li>영업이익 증가율: 15%+ 양호, 30%+ 매우 우수</li>
                </ul>
              </div>
            </GuidelineBox>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>매출액 증가율</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.성장성점수
                  )}`}
                >
                  {formatRatio(data.ratios.성장성.매출액증가율)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>영업이익 증가율</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.성장성점수
                  )}`}
                >
                  {formatRatio(data.ratios.성장성.영업이익증가율)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              활동성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GuidelineBox description="보유 자산과 재고를 매출로 얼마나 효율적으로 전환하는지 보여줍니다. 높을수록 좋습니다.">
              <div className="space-y-2">
                <div className="font-semibold pt-1">계산식</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>총자산회전율 = (매출액 ÷ 자산총계)</li>
                  <li>재고자산회전율 = (매출원가 ÷ 재고자산)</li>
                </ul>
                <div className="font-semibold pt-1">가이드라인</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>총자산회전율: 1.0+ 양호, 1.5+ 매우 우수</li>
                  <li>재고자산회전율: 8회+ 양호, 12회+ 매우 우수</li>
                </ul>
              </div>
            </GuidelineBox>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>총자산회전율</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.활동성점수
                  )}`}
                >
                  {formatRatio(data.ratios.활동성.총자산회전율, '회')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>재고자산회전율</span>
                <span
                  className={`font-bold ${getScoreColor(
                    data.evaluation.활동성점수
                  )}`}
                >
                  {formatRatio(data.ratios.활동성.재고자산회전율, '회')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            재무제표 원본 데이터 (2025년 1분기)
            <span className="text-sm font-normal text-gray-500">
              - 계산 근거가 되는 실제 수치
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 border-b pb-2">
                📊 손익계산서 (단위: 백만원)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>매출액 (누적)</span>
                  <span className="font-mono">
                    {data.extractedData.매출액 !== null
                      ? data.extractedData.매출액.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>영업이익 (누적)</span>
                  <span className="font-mono">
                    {data.extractedData.영업이익 !== null
                      ? data.extractedData.영업이익.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>당기순이익 (누적)</span>
                  <span className="font-mono">
                    {data.extractedData.당기순이익 !== null
                      ? data.extractedData.당기순이익.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                {data.extractedData.전년매출액 !== null && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-gray-600">
                      <span>전년 매출액 (누적)</span>
                      <span className="font-mono">
                        {data.extractedData.전년매출액.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 border-b pb-2">
                🏢 재무상태표 - 자산 (단위: 백만원)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-medium">
                  <span>자산총계</span>
                  <span className="font-mono">
                    {data.extractedData.자산총계 !== null
                      ? data.extractedData.자산총계.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>유동자산</span>
                  <span className="font-mono">
                    {data.extractedData.유동자산 !== null
                      ? data.extractedData.유동자산.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>현금성자산</span>
                  <span className="font-mono">
                    {data.extractedData.현금및현금성자산 !== null
                      ? data.extractedData.현금및현금성자산.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>매출채권</span>
                  <span className="font-mono">
                    {data.extractedData.매출채권 !== null
                      ? data.extractedData.매출채권.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>재고자산</span>
                  <span className="font-mono">
                    {data.extractedData.재고자산 !== null
                      ? data.extractedData.재고자산.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>비유동자산</span>
                  <span className="font-mono">
                    {data.extractedData.비유동자산 !== null
                      ? data.extractedData.비유동자산.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 border-b pb-2">
                💰 재무상태표 - 부채·자본 (단위: 백만원)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-medium">
                  <span>부채총계</span>
                  <span className="font-mono">
                    {data.extractedData.부채총계 !== null
                      ? data.extractedData.부채총계.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>유동부채</span>
                  <span className="font-mono">
                    {data.extractedData.유동부채 !== null
                      ? data.extractedData.유동부채.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>단기차입금</span>
                  <span className="font-mono">
                    {data.extractedData.단기차입금 !== null
                      ? data.extractedData.단기차입금.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>비유동부채</span>
                  <span className="font-mono">
                    {data.extractedData.비유동부채 !== null
                      ? data.extractedData.비유동부채.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>장기차입금</span>
                  <span className="font-mono">
                    {data.extractedData.장기차입금 !== null
                      ? data.extractedData.장기차입금.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>자본총계</span>
                  <span className="font-mono">
                    {data.extractedData.자본총계 !== null
                      ? data.extractedData.자본총계.toLocaleString()
                      : NO_DATA_LABEL}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-semibold text-gray-700 mb-2">
              📝 주요 비율 계산 공식
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div>• 영업이익률 = (영업이익 ÷ 매출액) × 100</div>
                <div>• 순이익률 = (당기순이익 ÷ 매출액) × 100</div>
                <div>• ROA = (당기순이익 ÷ 자산총계) × 100</div>
              </div>
              <div>
                <div>• ROE = (당기순이익 ÷ 자본총계) × 100</div>
                <div>• 부채비율 = (부채총계 ÷ 자본총계) × 100</div>
                <div>• 자기자본비율 = (자본총계 ÷ 자산총계) × 100</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              분석 의견 및 추천사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-green-600 mt-0.5">•</div>
                  <div className="text-sm">{recommendation}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FinancialResult
