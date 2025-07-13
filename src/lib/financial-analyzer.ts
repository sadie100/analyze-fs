import Decimal from 'decimal.js'

// 재무데이터 타입 정의
export interface FinancialItem {
  재무제표종류: string
  항목코드: string
  항목명: string
  '당기 1분기말': number | null
  전기말: number | null
  전전기말: number | null
}

export interface CompanyBasicInfo {
  종목코드: string
  시장구분: string
  업종: string
  업종명: string
  결산월: string
  결산기준일: string
  보고서종류: string
  통화: string
}

// 기존 방대한 DB 구조 (백워드 호환성)
export interface LegacyCompanyData {
  basicInfo: CompanyBasicInfo
  financialStatements: {
    재무상태표: FinancialItem[]
    손익계산서: FinancialItem[]
    현금흐름표: FinancialItem[]
    자본변동표: FinancialItem[]
  }
  rawData: unknown[]
}

// 최적화된 DB 구조 (새로운 구조)
export interface OptimizedCompanyData {
  basicInfo: CompanyBasicInfo
  financialData: ExtractedFinancialData
}

// 통합 타입 (둘 다 지원)
export type CompanyData = LegacyCompanyData | OptimizedCompanyData

// 분석 결과 타입
interface FinancialRatios {
  수익성: {
    영업이익률: number | null
    순이익률: number | null
    ROA: number | null
    ROE: number | null
  }
  안정성: {
    부채비율: number | null
    유동비율: number | null
    당좌비율: number | null
    자기자본비율: number | null
  }
  성장성: {
    매출액증가율: number | null
    영업이익증가율: number | null
    당기순이익증가율: number | null
  }
  활동성: {
    총자산회전율: number | null
    재고자산회전율: number | null
    매출채권회전율: number | null
  }
}

interface AnalysisResult {
  companyName: string
  basicInfo: CompanyBasicInfo
  extractedData: ExtractedFinancialData
  ratios: FinancialRatios
  evaluation: CompanyEvaluation
  recommendations: string[]
}

interface ExtractedFinancialData {
  // 손익계산서 항목
  매출액: number | null
  영업이익: number | null
  당기순이익: number | null

  // 재무상태표 항목
  자산총계: number | null
  유동자산: number | null
  비유동자산: number | null
  부채총계: number | null
  유동부채: number | null
  비유동부채: number | null
  자본총계: number | null

  // 세부 항목
  현금및현금성자산: number | null
  매출채권: number | null
  재고자산: number | null
  단기차입금: number | null
  장기차입금: number | null

  // 전년 동기 데이터 (성장률 계산용)
  전년매출액: number | null
  전년영업이익: number | null
  전년당기순이익: number | null
}

interface CompanyEvaluation {
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

// 평가 기준
const EVALUATION_THRESHOLDS = {
  수익성: {
    영업이익률: { excellent: 15, good: 10, average: 5, poor: 0 },
    순이익률: { excellent: 10, good: 7, average: 3, poor: 0 },
    ROA: { excellent: 10, good: 7, average: 3, poor: 0 },
    ROE: { excellent: 15, good: 10, average: 5, poor: 0 },
  },
  안정성: {
    부채비율: { excellent: 30, good: 50, average: 100, poor: 200 }, // 낮을수록 좋음
    유동비율: { excellent: 200, good: 150, average: 120, poor: 100 },
    자기자본비율: { excellent: 60, good: 40, average: 30, poor: 20 },
  },
  성장성: {
    매출액증가율: { excellent: 20, good: 10, average: 5, poor: 0 },
    영업이익증가율: { excellent: 30, good: 15, average: 5, poor: 0 },
  },
  활동성: {
    총자산회전율: { excellent: 1.5, good: 1.0, average: 0.7, poor: 0.5 },
    재고자산회전율: { excellent: 12, good: 8, average: 4, poor: 2 },
  },
}

/**
 * 재무데이터에서 주요 항목들을 추출
 * 최적화된 DB와 기존 DB 모두 지원
 */
function extractFinancialData(
  companyData: CompanyData
): ExtractedFinancialData {
  // 최적화된 DB 구조인 경우 이미 추출된 데이터 반환
  if ('financialData' in companyData) {
    return companyData.financialData
  }

  // 기존 방대한 DB 구조인 경우 추출 로직 실행
  const legacyData = companyData as LegacyCompanyData
  const allData = [
    ...legacyData.financialStatements.재무상태표,
    ...legacyData.financialStatements.손익계산서,
    ...legacyData.financialStatements.현금흐름표,
    ...legacyData.financialStatements.자본변동표,
  ]

  const result: ExtractedFinancialData = {
    매출액: null,
    영업이익: null,
    당기순이익: null,
    자산총계: null,
    유동자산: null,
    비유동자산: null,
    부채총계: null,
    유동부채: null,
    비유동부채: null,
    자본총계: null,
    현금및현금성자산: null,
    매출채권: null,
    재고자산: null,
    단기차입금: null,
    장기차입금: null,
    전년매출액: null,
    전년영업이익: null,
    전년당기순이익: null,
  }

  // 항목명 매핑 테이블
  const itemMapping: Record<string, string[]> = {
    매출액: ['매출액', '매출', '수익(매출액)', '영업수익'],
    영업이익: ['영업이익', '영업이익(손실)'],
    당기순이익: ['당기순이익', '당기순이익(손실)', '분기순이익'],
    자산총계: ['자산총계'],
    유동자산: ['유동자산'],
    비유동자산: ['비유동자산'],
    부채총계: ['부채총계'],
    유동부채: ['유동부채'],
    비유동부채: ['비유동부채'],
    자본총계: ['자본총계', '자기자본'],
    현금및현금성자산: ['현금및현금성자산', '현금 및 현금성자산'],
    매출채권: ['매출채권', '매출채권 및 기타채권'],
    재고자산: ['재고자산', '재고'],
    단기차입금: ['단기차입금'],
    장기차입금: ['장기차입금'],
  }

  // 데이터 매핑
  allData.forEach((item) => {
    const currentValue = item['당기 1분기말']
    const previousValue = item['전기말']

    Object.entries(itemMapping).forEach(([key, searchTerms]) => {
      searchTerms.forEach((term) => {
        if (item.항목명.includes(term) && currentValue !== null) {
          const resultKey = key as keyof ExtractedFinancialData
          if (result[resultKey] === null) {
            ;(result[resultKey] as number) = currentValue

            // 전년 동기 데이터도 저장
            if (key === '매출액' && previousValue !== null) {
              result.전년매출액 = previousValue
            } else if (key === '영업이익' && previousValue !== null) {
              result.전년영업이익 = previousValue
            } else if (key === '당기순이익' && previousValue !== null) {
              result.전년당기순이익 = previousValue
            }
          }
        }
      })
    })
  })

  return result
}

/**
 * 재무비율 계산
 */
function calculateFinancialRatios(
  data: ExtractedFinancialData
): FinancialRatios {
  const ratios: FinancialRatios = {
    수익성: {
      영업이익률: null,
      순이익률: null,
      ROA: null,
      ROE: null,
    },
    안정성: {
      부채비율: null,
      유동비율: null,
      당좌비율: null,
      자기자본비율: null,
    },
    성장성: {
      매출액증가율: null,
      영업이익증가율: null,
      당기순이익증가율: null,
    },
    활동성: {
      총자산회전율: null,
      재고자산회전율: null,
      매출채권회전율: null,
    },
  }

  // 수익성 비율
  if (data.매출액 && data.매출액 > 0) {
    if (data.영업이익) {
      ratios.수익성.영업이익률 = new Decimal(data.영업이익)
        .dividedBy(new Decimal(data.매출액))
        .times(100)
        .toNumber()
    }
    if (data.당기순이익) {
      ratios.수익성.순이익률 = new Decimal(data.당기순이익)
        .dividedBy(new Decimal(data.매출액))
        .times(100)
        .toNumber()
    }
  }

  if (data.자산총계 && data.자산총계 > 0) {
    if (data.당기순이익) {
      ratios.수익성.ROA = new Decimal(data.당기순이익)
        .dividedBy(new Decimal(data.자산총계))
        .times(100)
        .toNumber()
    }
  }

  if (data.자본총계 && data.자본총계 > 0) {
    if (data.당기순이익) {
      ratios.수익성.ROE = new Decimal(data.당기순이익)
        .dividedBy(new Decimal(data.자본총계))
        .times(100)
        .toNumber()
    }
  }

  // 안정성 비율
  if (data.자본총계 && data.자본총계 > 0 && data.부채총계) {
    ratios.안정성.부채비율 = new Decimal(data.부채총계)
      .dividedBy(new Decimal(data.자본총계))
      .times(100)
      .toNumber()
  }

  if (data.유동부채 && data.유동부채 > 0 && data.유동자산) {
    ratios.안정성.유동비율 = new Decimal(data.유동자산)
      .dividedBy(new Decimal(data.유동부채))
      .times(100)
      .toNumber()
  }

  if (data.자산총계 && data.자산총계 > 0 && data.자본총계) {
    ratios.안정성.자기자본비율 = new Decimal(data.자본총계)
      .dividedBy(new Decimal(data.자산총계))
      .times(100)
      .toNumber()
  }

  // 성장성 비율
  if (data.전년매출액 && data.전년매출액 > 0 && data.매출액) {
    ratios.성장성.매출액증가율 = new Decimal(data.매출액)
      .minus(new Decimal(data.전년매출액))
      .dividedBy(new Decimal(data.전년매출액))
      .times(100)
      .toNumber()
  }

  if (data.전년영업이익 && data.전년영업이익 > 0 && data.영업이익) {
    ratios.성장성.영업이익증가율 = new Decimal(data.영업이익)
      .minus(new Decimal(data.전년영업이익))
      .dividedBy(new Decimal(data.전년영업이익))
      .times(100)
      .toNumber()
  }

  // 활동성 비율
  if (data.자산총계 && data.자산총계 > 0 && data.매출액) {
    ratios.활동성.총자산회전율 = new Decimal(data.매출액)
      .dividedBy(new Decimal(data.자산총계))
      .toNumber()
  }

  if (data.재고자산 && data.재고자산 > 0 && data.매출액) {
    ratios.활동성.재고자산회전율 = new Decimal(data.매출액)
      .dividedBy(new Decimal(data.재고자산))
      .toNumber()
  }

  return ratios
}

// 평가 기준 타입 정의
interface EvaluationThreshold {
  excellent: number
  good: number
  average: number
  poor: number
}

/**
 * 점수 계산 (0-100점)
 */
function calculateScore(
  value: number | null,
  thresholds: EvaluationThreshold,
  isReverse = false
): number {
  if (value === null) return 0

  const decimalValue = new Decimal(value)

  if (isReverse) {
    // 낮을수록 좋은 지표 (부채비율 등)
    if (decimalValue.lessThanOrEqualTo(thresholds.excellent)) return 100
    if (decimalValue.lessThanOrEqualTo(thresholds.good)) return 80
    if (decimalValue.lessThanOrEqualTo(thresholds.average)) return 60
    if (decimalValue.lessThanOrEqualTo(thresholds.poor)) return 40
    return 20
  } else {
    // 높을수록 좋은 지표
    if (decimalValue.greaterThanOrEqualTo(thresholds.excellent)) return 100
    if (decimalValue.greaterThanOrEqualTo(thresholds.good)) return 80
    if (decimalValue.greaterThanOrEqualTo(thresholds.average)) return 60
    if (decimalValue.greaterThanOrEqualTo(thresholds.poor)) return 40
    return 20
  }
}

/**
 * 종합 평가
 */
function evaluateCompany(ratios: FinancialRatios): CompanyEvaluation {
  const scores = {
    수익성: 0,
    안정성: 0,
    성장성: 0,
    활동성: 0,
  }

  // 수익성 점수
  let profitabilityCount = 0
  if (ratios.수익성.영업이익률 !== null) {
    scores.수익성 += calculateScore(
      ratios.수익성.영업이익률,
      EVALUATION_THRESHOLDS.수익성.영업이익률
    )
    profitabilityCount++
  }
  if (ratios.수익성.순이익률 !== null) {
    scores.수익성 += calculateScore(
      ratios.수익성.순이익률,
      EVALUATION_THRESHOLDS.수익성.순이익률
    )
    profitabilityCount++
  }
  if (ratios.수익성.ROA !== null) {
    scores.수익성 += calculateScore(
      ratios.수익성.ROA,
      EVALUATION_THRESHOLDS.수익성.ROA
    )
    profitabilityCount++
  }
  if (ratios.수익성.ROE !== null) {
    scores.수익성 += calculateScore(
      ratios.수익성.ROE,
      EVALUATION_THRESHOLDS.수익성.ROE
    )
    profitabilityCount++
  }
  if (profitabilityCount > 0) scores.수익성 /= profitabilityCount

  // 안정성 점수
  let stabilityCount = 0
  if (ratios.안정성.부채비율 !== null) {
    scores.안정성 += calculateScore(
      ratios.안정성.부채비율,
      EVALUATION_THRESHOLDS.안정성.부채비율,
      true
    )
    stabilityCount++
  }
  if (ratios.안정성.유동비율 !== null) {
    scores.안정성 += calculateScore(
      ratios.안정성.유동비율,
      EVALUATION_THRESHOLDS.안정성.유동비율
    )
    stabilityCount++
  }
  if (ratios.안정성.자기자본비율 !== null) {
    scores.안정성 += calculateScore(
      ratios.안정성.자기자본비율,
      EVALUATION_THRESHOLDS.안정성.자기자본비율
    )
    stabilityCount++
  }
  if (stabilityCount > 0) scores.안정성 /= stabilityCount

  // 성장성 점수
  let growthCount = 0
  if (ratios.성장성.매출액증가율 !== null) {
    scores.성장성 += calculateScore(
      ratios.성장성.매출액증가율,
      EVALUATION_THRESHOLDS.성장성.매출액증가율
    )
    growthCount++
  }
  if (ratios.성장성.영업이익증가율 !== null) {
    scores.성장성 += calculateScore(
      ratios.성장성.영업이익증가율,
      EVALUATION_THRESHOLDS.성장성.영업이익증가율
    )
    growthCount++
  }
  if (growthCount > 0) scores.성장성 /= growthCount

  // 활동성 점수
  let activityCount = 0
  if (ratios.활동성.총자산회전율 !== null) {
    scores.활동성 += calculateScore(
      ratios.활동성.총자산회전율,
      EVALUATION_THRESHOLDS.활동성.총자산회전율
    )
    activityCount++
  }
  if (ratios.활동성.재고자산회전율 !== null) {
    scores.활동성 += calculateScore(
      ratios.활동성.재고자산회전율,
      EVALUATION_THRESHOLDS.활동성.재고자산회전율
    )
    activityCount++
  }
  if (activityCount > 0) scores.활동성 /= activityCount

  // 총점 계산 (수익성 40%, 안정성 30%, 성장성 20%, 활동성 10%)
  const 총점 =
    scores.수익성 * 0.4 +
    scores.안정성 * 0.3 +
    scores.성장성 * 0.2 +
    scores.활동성 * 0.1

  // 등급 산정
  let 등급: 'S' | 'A' | 'B' | 'C' | 'D'
  let 상태: string
  let 색상: string
  let 이모지: string

  if (총점 >= 90) {
    등급 = 'S'
    상태 = '매우 우수'
    색상 = 'bg-purple-100'
    이모지 = '🌟'
  } else if (총점 >= 80) {
    등급 = 'A'
    상태 = '우수'
    색상 = 'bg-blue-100'
    이모지 = '😊'
  } else if (총점 >= 70) {
    등급 = 'B'
    상태 = '양호'
    색상 = 'bg-green-100'
    이모지 = '🙂'
  } else if (총점 >= 60) {
    등급 = 'C'
    상태 = '보통'
    색상 = 'bg-yellow-100'
    이모지 = '😐'
  } else {
    등급 = 'D'
    상태 = '주의 필요'
    색상 = 'bg-red-100'
    이모지 = '😟'
  }

  return {
    총점: Math.round(총점),
    등급,
    상태,
    색상,
    이모지,
    수익성점수: Math.round(scores.수익성),
    안정성점수: Math.round(scores.안정성),
    성장성점수: Math.round(scores.성장성),
    활동성점수: Math.round(scores.활동성),
  }
}

/**
 * 추천사항 생성
 */
function generateRecommendations(
  ratios: FinancialRatios,
  evaluation: CompanyEvaluation
): string[] {
  const recommendations: string[] = []

  // 수익성 기반 추천
  if (evaluation.수익성점수 < 60) {
    recommendations.push(
      '💡 수익성 개선이 필요합니다. 매출 증대와 비용 절감을 통한 영업이익률 향상을 검토해보세요.'
    )
  } else if (evaluation.수익성점수 >= 80) {
    recommendations.push(
      '✅ 우수한 수익성을 보이고 있습니다. 현재 수준을 유지하며 성장을 지속하세요.'
    )
  }

  // 안정성 기반 추천
  if (evaluation.안정성점수 < 60) {
    recommendations.push(
      '⚠️ 재무 안정성에 주의가 필요합니다. 부채 관리와 유동성 확보에 집중하세요.'
    )
  } else if (evaluation.안정성점수 >= 80) {
    recommendations.push(
      '🛡️ 안정적인 재무구조를 갖고 있습니다. 적극적인 투자 기회를 모색해볼 수 있습니다.'
    )
  }

  // 성장성 기반 추천
  if (ratios.성장성.매출액증가율 !== null && ratios.성장성.매출액증가율 < 0) {
    recommendations.push(
      '📈 매출액이 감소하고 있습니다. 새로운 시장 개척이나 제품 혁신을 고려해보세요.'
    )
  } else if (
    ratios.성장성.매출액증가율 !== null &&
    ratios.성장성.매출액증가율 > 20
  ) {
    recommendations.push(
      '🚀 높은 성장률을 보이고 있습니다. 성장에 따른 운영 효율성 관리에 주의하세요.'
    )
  }

  // 종합 평가 기반 추천
  if (evaluation.등급 === 'S' || evaluation.등급 === 'A') {
    recommendations.push('🎯 장기 투자 관점에서 매력적인 기업입니다.')
  } else if (evaluation.등급 === 'D') {
    recommendations.push('🔍 투자 전 추가적인 실사와 리스크 분석이 필요합니다.')
  }

  return recommendations
}

/**
 * 메인 분석 함수
 */
export function analyzeCompany(
  companyName: string,
  companyData: CompanyData
): AnalysisResult {
  const extractedData = extractFinancialData(companyData)
  const ratios = calculateFinancialRatios(extractedData)
  const evaluation = evaluateCompany(ratios)
  const recommendations = generateRecommendations(ratios, evaluation)

  return {
    companyName,
    basicInfo: companyData.basicInfo,
    extractedData,
    ratios,
    evaluation,
    recommendations,
  }
}

export type {
  AnalysisResult,
  FinancialRatios,
  CompanyEvaluation,
  ExtractedFinancialData,
}
