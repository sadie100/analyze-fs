export interface SearchParams {
  company?: string
}

// 기존 타입들
export interface CompanyInfo {
  companyName: string
  stockCode: string
  companyCode?: string
}

export interface FinancialData {
  매출액: number
  영업이익: number
  당기순이익: number
  자산총계: number
  부채총계: number
  자본총계: number
  유동자산: number
  유동부채: number
}

// === 최적화된 DB 타입 (실제로 필요한 데이터만) ===

// 회사 기본정보 (필수)
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

// 분석에 필요한 재무 데이터 (18개 항목만)
export interface OptimizedFinancialData {
  // 손익계산서 항목 (3개)
  매출액: number | null
  영업이익: number | null
  당기순이익: number | null

  // 재무상태표 항목 (9개)
  자산총계: number | null
  유동자산: number | null
  비유동자산: number | null
  부채총계: number | null
  유동부채: number | null
  비유동부채: number | null
  자본총계: number | null
  현금및현금성자산: number | null
  매출채권: number | null
  재고자산: number | null
  단기차입금: number | null
  장기차입금: number | null

  // 전년 동기 데이터 (성장률 계산용, 3개)
  전년매출액: number | null
  전년영업이익: number | null
  전년당기순이익: number | null
}

// 최적화된 회사 데이터 구조
export interface OptimizedCompanyData {
  basicInfo: CompanyBasicInfo
  financialData: OptimizedFinancialData
}

// 최적화된 데이터베이스 구조
export interface OptimizedFinancialDatabase {
  metadata: {
    buildDate: string
    totalCompanies: number
    version: string
  }
  companies: Record<string, OptimizedCompanyData>
  searchIndex: {
    companyNames: string[]
    industryMap: Record<string, string[]>
    marketMap: Record<string, string[]>
  }
}

// === 기존 방대한 DB에서 최적화된 DB로 변환하는 함수 타입 ===
export type DatabaseOptimizer = (originalDB: any) => OptimizedFinancialDatabase
