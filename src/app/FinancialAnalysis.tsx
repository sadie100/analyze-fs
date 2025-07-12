'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  Shield,
  Search,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import GuideModal from './GuideModal'

// 타입 정의
interface AnalysisResult {
  companyName: string
  basicInfo: {
    종목코드: string
    업종명: string
    시장구분: string
    결산기준일: string
  }
  extractedData: any
  ratios: {
    수익성: any
    안정성: any
    성장성: any
    활동성: any
  }
  evaluation: {
    총점: number
    등급: 'S' | 'A' | 'B' | 'C' | 'D'
    상태: string
    색상: string
    이모지: string
    수익성점수: number
    안정성점수: number
    성장성점수: number
    활동성점수: number
  }
  recommendations: string[]
}

interface ApiResponse {
  success: boolean
  data: AnalysisResult
  usedExactMatch: boolean
  error?: string
  message?: string
  suggestions?: string[]
}

const FinancialAnalysis = ({
  companyName = '',
  initialData = null,
  isLoading: externalLoading = false,
  error: externalError = null,
}) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(companyName)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(externalLoading)
  const [error, setError] = useState<string | null>(externalError)
  const [data, setData] = useState<AnalysisResult | null>(initialData)
  const [usedExactMatch, setUsedExactMatch] = useState(true)

  // 자동완성 검색
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=suggestions&limit=5`
      )
      const result = await response.json()
      setSuggestions(result.suggestions || [])
    } catch (error) {
      console.error('자동완성 오류:', error)
      setSuggestions([])
    }
  }, [])

  // 회사 분석 데이터 로드
  const fetchCompanyData = useCallback(async (name: string) => {
    if (!name) return

    setIsLoading(true)
    setError(null)
    setShowSuggestions(false)

    try {
      const response = await fetch(`/api/company/${encodeURIComponent(name)}`)
      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        setData(result.data)
        setUsedExactMatch(result.usedExactMatch)
      } else {
        setError(
          result.message || result.error || '분석 데이터를 가져올 수 없습니다'
        )
        setData(null)
      }
    } catch (error) {
      console.error('API 호출 오류:', error)
      setError('서버 연결에 실패했습니다')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 검색어 변경 시 자동완성
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, fetchSuggestions])

  // 초기 회사명이 있으면 데이터 로드
  useEffect(() => {
    if (companyName && !initialData) {
      fetchCompanyData(companyName)
    }
  }, [companyName, initialData, fetchCompanyData])

  const handleSearch = useCallback(
    (term: string) => {
      if (term) {
        setSearchTerm(term)
        router.push(`/?company=${encodeURIComponent(term)}`)
        fetchCompanyData(term)
      } else {
        router.push('/')
        setData(null)
      }
    },
    [router, fetchCompanyData]
  )

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
    handleSearch(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchTerm)
    }
  }

  // 점수에 따른 색상 반환
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 비율 표시 헬퍼
  const formatRatio = (value: number | null, suffix = '%') => {
    if (value === null) return 'N/A'
    return `${value.toFixed(1)}${suffix}`
  }

  // 기본 검색 화면
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="회사명을 입력하세요 (예: 삼성전자, LG화학)"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSearch(searchTerm)}
                    disabled={!searchTerm}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    분석
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 로딩 화면
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

  // 오류 화면
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
                  setError(null)
                  setData(null)
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
      {/* 검색 바 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="다른 회사 검색..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => handleSearch(searchTerm)}
                disabled={!searchTerm || isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                분석
              </Button>
              <GuideModal />
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

      {/* 종합 평가 */}
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

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 수익성 지표 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              수익성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* 안정성 지표 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              안정성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* 성장성 지표 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              성장성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* 활동성 지표 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              활동성 지표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

      {/* 실제 재무제표 데이터 */}
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
            {/* 손익계산서 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 border-b pb-2">
                📊 손익계산서 (단위: 백만원)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>매출액</span>
                  <span className="font-mono">
                    {data.extractedData.매출액 !== null
                      ? data.extractedData.매출액.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>영업이익</span>
                  <span className="font-mono">
                    {data.extractedData.영업이익 !== null
                      ? data.extractedData.영업이익.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>당기순이익</span>
                  <span className="font-mono">
                    {data.extractedData.당기순이익 !== null
                      ? data.extractedData.당기순이익.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                {data.extractedData.전년매출액 !== null && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-gray-600">
                      <span>전년 매출액</span>
                      <span className="font-mono">
                        {data.extractedData.전년매출액.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 재무상태표 - 자산 */}
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
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>유동자산</span>
                  <span className="font-mono">
                    {data.extractedData.유동자산 !== null
                      ? data.extractedData.유동자산.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>현금성자산</span>
                  <span className="font-mono">
                    {data.extractedData.현금및현금성자산 !== null
                      ? data.extractedData.현금및현금성자산.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>매출채권</span>
                  <span className="font-mono">
                    {data.extractedData.매출채권 !== null
                      ? data.extractedData.매출채권.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>재고자산</span>
                  <span className="font-mono">
                    {data.extractedData.재고자산 !== null
                      ? data.extractedData.재고자산.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>비유동자산</span>
                  <span className="font-mono">
                    {data.extractedData.비유동자산 !== null
                      ? data.extractedData.비유동자산.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* 재무상태표 - 부채와 자본 */}
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
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>유동부채</span>
                  <span className="font-mono">
                    {data.extractedData.유동부채 !== null
                      ? data.extractedData.유동부채.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>단기차입금</span>
                  <span className="font-mono">
                    {data.extractedData.단기차입금 !== null
                      ? data.extractedData.단기차입금.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>비유동부채</span>
                  <span className="font-mono">
                    {data.extractedData.비유동부채 !== null
                      ? data.extractedData.비유동부채.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between ml-4 text-gray-600">
                  <span>장기차입금</span>
                  <span className="font-mono">
                    {data.extractedData.장기차입금 !== null
                      ? data.extractedData.장기차입금.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>자본총계</span>
                  <span className="font-mono">
                    {data.extractedData.자본총계 !== null
                      ? data.extractedData.자본총계.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 계산 공식 안내 */}
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

      {/* 추천사항 */}
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

export default FinancialAnalysis
