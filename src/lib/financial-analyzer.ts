import Decimal from 'decimal.js'

/**
 * -------------------------------------------------------------
 *  밥 파이프 (Next.js 개발 담당) - 재무 분석 모듈 v2
 * -------------------------------------------------------------
 *  FINANCIAL_ANALYSIS_GUIDE.md 의 전반적인 절차를 그대로 코드화했습니다.
 *  - 입력 데이터 : company-search 모듈이 반환하는 companyData 객체
 *  - 출력 형식 : route.ts 가 기대하는 AnalysisResult 타입 (불변)
 *  - 주요 변경점
 *    1. ETL 로직을 별도 함수로 분리하여 단위/문자열 정규화 수행
 *    2. 매핑 규칙을 상수화하여 유지보수 용이
 *    3. Ratio → Score → Evaluation 흐름을 선언형으로 재작성
 *    4. Decimal.js 로 모든 분수 계산 수행(소수 오차 방지)
 * -------------------------------------------------------------
 */

// -----------------------------
//  Type Definitions
// -----------------------------
export interface FinancialItemRaw {
  재무제표종류: string
  항목코드: string
  항목명: string
  /**
   * 손익계산서 → 누적 / 3개월 값,
   * 재무상태표   → 시점 값
   * null 이면 값 없음
   */
  값들: Record<string, number | string | null>
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

export interface CompanyData {
  basicInfo: CompanyBasicInfo
  /** 이미 추출·정규화된 데이터 */
  financialData: ExtractedFinancialData
}

// -----------------------------
//  Extracted & Result Types
// -----------------------------
export interface ExtractedFinancialData {
  // 손익계산서
  매출액: number | null
  영업이익: number | null
  당기순이익: number | null

  // 재무상태표
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

  // 전년도(동기) 비교용
  전년매출액: number | null
  전년영업이익: number | null
  전년당기순이익: number | null
}

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
    자기자본비율: number | null
  }
  성장성: {
    매출액증가율: number | null
    영업이익증가율: number | null
  }
  활동성: {
    총자산회전율: number | null
    재고자산회전율: number | null
  }
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

export interface AnalysisResult {
  companyName: string
  basicInfo: CompanyBasicInfo
  extractedData: ExtractedFinancialData
  ratios: FinancialRatios
  evaluation: CompanyEvaluation
  recommendations: string[]
}

function safeDiv(
  numerator: number | null,
  denominator: number | null
): Decimal | null {
  if (numerator === null || denominator === null || denominator === 0)
    return null
  return new Decimal(numerator).dividedBy(new Decimal(denominator))
}

// -----------------------------
//  1. Extract (Legacy ⇢ Normalized)
// -----------------------------
function extractFinancialData(
  companyData: CompanyData
): ExtractedFinancialData {
  // Optimized 구조라면 그대로 반환 (null 보강)
  const base: ExtractedFinancialData = {
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
  return { ...base, ...companyData.financialData }
}

// -----------------------------
//  2. Ratio Calculation
// -----------------------------
function calculateRatios(data: ExtractedFinancialData): FinancialRatios {
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
      자기자본비율: null,
    },
    성장성: {
      매출액증가율: null,
      영업이익증가율: null,
    },
    활동성: {
      총자산회전율: null,
      재고자산회전율: null,
    },
  }

  // 수익성
  const 매출 = data.매출액
  if (매출 !== null && 매출 !== 0) {
    // 매출이 0이 아닐 때만 계산 (음수 포함)
    if (data.영업이익 !== null)
      ratios.수익성.영업이익률 =
        safeDiv(data.영업이익, 매출)?.times(100).toNumber() ?? null
    if (data.당기순이익 !== null)
      ratios.수익성.순이익률 =
        safeDiv(data.당기순이익, 매출)?.times(100).toNumber() ?? null
  }
  if (data.자산총계 && data.자산총계 > 0 && data.당기순이익 !== null)
    ratios.수익성.ROA =
      safeDiv(data.당기순이익, data.자산총계)?.times(100).toNumber() ?? null
  if (data.자본총계 && data.자본총계 > 0 && data.당기순이익 !== null)
    ratios.수익성.ROE =
      safeDiv(data.당기순이익, data.자본총계)?.times(100).toNumber() ?? null

  // 안정성
  if (data.자본총계 && data.자본총계 > 0 && data.부채총계 !== null)
    ratios.안정성.부채비율 =
      safeDiv(data.부채총계, data.자본총계)?.times(100).toNumber() ?? null
  if (data.유동부채 && data.유동부채 > 0 && data.유동자산 !== null)
    ratios.안정성.유동비율 =
      safeDiv(data.유동자산, data.유동부채)?.times(100).toNumber() ?? null
  if (data.자산총계 && data.자산총계 > 0 && data.자본총계 !== null)
    ratios.안정성.자기자본비율 =
      safeDiv(data.자본총계, data.자산총계)?.times(100).toNumber() ?? null

  // 성장성
  if (data.전년매출액 && data.전년매출액 > 0 && 매출 !== null)
    ratios.성장성.매출액증가율 =
      safeDiv(
        new Decimal(매출).minus(data.전년매출액).toNumber(),
        data.전년매출액
      )
        ?.times(100)
        .toNumber() ?? null
  if (data.전년영업이익 && data.전년영업이익 > 0 && data.영업이익 !== null)
    ratios.성장성.영업이익증가율 =
      safeDiv(
        new Decimal(data.영업이익).minus(data.전년영업이익).toNumber(),
        data.전년영업이익
      )
        ?.times(100)
        .toNumber() ?? null

  // 활동성
  if (data.자산총계 && data.자산총계 > 0 && 매출 !== null)
    ratios.활동성.총자산회전율 =
      safeDiv(매출, data.자산총계)?.toNumber() ?? null
  if (data.재고자산 && data.재고자산 > 0 && 매출 !== null)
    ratios.활동성.재고자산회전율 =
      safeDiv(매출, data.재고자산)?.toNumber() ?? null

  return ratios
}

// -----------------------------
//  3. Scoring & Evaluation
// -----------------------------
interface Threshold {
  excellent: number
  good: number
  average: number
  poor: number
}

const THRESHOLDS = {
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
} as const

function score(value: number | null, th: Threshold, reverse = false): number {
  if (value === null) return 0
  const val = new Decimal(value)
  if (reverse) {
    if (val.lessThanOrEqualTo(th.excellent)) return 100
    if (val.lessThanOrEqualTo(th.good)) return 80
    if (val.lessThanOrEqualTo(th.average)) return 60
    if (val.lessThanOrEqualTo(th.poor)) return 40
    return 20
  } else {
    if (val.greaterThanOrEqualTo(th.excellent)) return 100
    if (val.greaterThanOrEqualTo(th.good)) return 80
    if (val.greaterThanOrEqualTo(th.average)) return 60
    if (val.greaterThanOrEqualTo(th.poor)) return 40
    return 20
  }
}

function evaluate(ratios: FinancialRatios): CompanyEvaluation {
  /** 영역별 평균 점수 */
  const 영역별 = {
    수익성: 0,
    안정성: 0,
    성장성: 0,
    활동성: 0,
  }
  const count: Record<keyof typeof 영역별, number> = {
    수익성: 0,
    안정성: 0,
    성장성: 0,
    활동성: 0,
  }

  // 수익성
  if (ratios.수익성.영업이익률 !== null) {
    영역별.수익성 += score(
      ratios.수익성.영업이익률,
      THRESHOLDS.수익성.영업이익률
    )
    count.수익성++
  }
  if (ratios.수익성.순이익률 !== null) {
    영역별.수익성 += score(ratios.수익성.순이익률, THRESHOLDS.수익성.순이익률)
    count.수익성++
  }
  if (ratios.수익성.ROA !== null) {
    영역별.수익성 += score(ratios.수익성.ROA, THRESHOLDS.수익성.ROA)
    count.수익성++
  }
  if (ratios.수익성.ROE !== null) {
    영역별.수익성 += score(ratios.수익성.ROE, THRESHOLDS.수익성.ROE)
    count.수익성++
  }

  // 안정성
  if (ratios.안정성.부채비율 !== null) {
    영역별.안정성 += score(
      ratios.안정성.부채비율,
      THRESHOLDS.안정성.부채비율,
      true
    )
    count.안정성++
  }
  if (ratios.안정성.유동비율 !== null) {
    영역별.안정성 += score(ratios.안정성.유동비율, THRESHOLDS.안정성.유동비율)
    count.안정성++
  }
  if (ratios.안정성.자기자본비율 !== null) {
    영역별.안정성 += score(
      ratios.안정성.자기자본비율,
      THRESHOLDS.안정성.자기자본비율
    )
    count.안정성++
  }

  // 성장성
  if (ratios.성장성.매출액증가율 !== null) {
    영역별.성장성 += score(
      ratios.성장성.매출액증가율,
      THRESHOLDS.성장성.매출액증가율
    )
    count.성장성++
  }
  if (ratios.성장성.영업이익증가율 !== null) {
    영역별.성장성 += score(
      ratios.성장성.영업이익증가율,
      THRESHOLDS.성장성.영업이익증가율
    )
    count.성장성++
  }

  // 활동성
  if (ratios.활동성.총자산회전율 !== null) {
    영역별.활동성 += score(
      ratios.활동성.총자산회전율,
      THRESHOLDS.활동성.총자산회전율
    )
    count.활동성++
  }
  if (ratios.활동성.재고자산회전율 !== null) {
    영역별.활동성 += score(
      ratios.활동성.재고자산회전율,
      THRESHOLDS.활동성.재고자산회전율
    )
    count.활동성++
  }

  // 평균화
  ;(Object.keys(영역별) as (keyof typeof 영역별)[]).forEach((k) => {
    if (count[k] > 0) 영역별[k] = 영역별[k] / count[k]
  })

  const 총점 =
    영역별.수익성 * 0.4 +
    영역별.안정성 * 0.3 +
    영역별.성장성 * 0.2 +
    영역별.활동성 * 0.1

  // 등급 매핑
  let 등급: 'S' | 'A' | 'B' | 'C' | 'D' = 'D'
  let 상태 = '주의 필요'
  let 색상 = 'bg-red-100'
  let 이모지 = '😟'
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
  }

  return {
    총점: Math.round(총점),
    등급,
    상태,
    색상,
    이모지,
    수익성점수: Math.round(영역별.수익성),
    안정성점수: Math.round(영역별.안정성),
    성장성점수: Math.round(영역별.성장성),
    활동성점수: Math.round(영역별.활동성),
  }
}

// -----------------------------
//  4. Recommendations
// -----------------------------
function generateRecommendations(
  ratios: FinancialRatios,
  evaluation: CompanyEvaluation
): string[] {
  const rec: string[] = []

  // 수익성
  if (evaluation.수익성점수 < 60)
    rec.push(
      '💡 수익성 개선이 필요합니다. 매출 증대 & 비용 절감 전략을 검토하세요.'
    )
  else if (evaluation.수익성점수 >= 80)
    rec.push('✅ 우수한 수익성을 보이고 있습니다. 현재 전략을 유지하세요.')

  // 안정성
  if (evaluation.안정성점수 < 60)
    rec.push(
      '⚠️ 재무 안정성이 낮습니다. 부채 구조 개선과 유동성 확보에 주력하세요.'
    )
  else if (evaluation.안정성점수 >= 80)
    rec.push(
      '🛡️ 안정적인 재무구조입니다. 공격적인 투자도 고려해볼 수 있습니다.'
    )

  // 성장성 - 매출 감소 시 경고, 고성장 시 주의
  if (ratios.성장성.매출액증가율 !== null && ratios.성장성.매출액증가율 < 0)
    rec.push('📉 매출이 감소세입니다. 신시장 개척 또는 제품 혁신이 필요합니다.')
  else if (
    ratios.성장성.매출액증가율 !== null &&
    ratios.성장성.매출액증가율 > 20
  )
    rec.push('🚀 고성장 중입니다. 성장에 따른 운영 리스크 관리에 유의하세요.')

  // 종합
  if (evaluation.등급 === 'S' || evaluation.등급 === 'A')
    rec.push('🎯 장기 투자 매력도가 높은 기업입니다.')
  if (evaluation.등급 === 'D')
    rec.push('🔍 투자 전 추가적인 리스크 분석이 필요합니다.')

  return rec
}

// -----------------------------
//  5. Main Orchestrator
// -----------------------------
export function analyzeCompany(
  companyName: string,
  companyData: CompanyData
): AnalysisResult {
  const extracted = extractFinancialData(companyData)
  const ratios = calculateRatios(extracted)
  const evaluation = evaluate(ratios)
  const recommendations = generateRecommendations(ratios, evaluation)

  return {
    companyName,
    basicInfo: companyData.basicInfo,
    extractedData: extracted,
    ratios,
    evaluation,
    recommendations,
  }
}

// 개별 유틸 Export (테스트용)
export {
  extractFinancialData,
  calculateRatios as calculateFinancialRatios,
  evaluate as evaluateCompany,
  generateRecommendations,
}

export type { FinancialRatios, CompanyEvaluation }
