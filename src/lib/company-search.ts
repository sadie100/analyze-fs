import { readFileSync } from 'fs'
import { join } from 'path'

// 데이터베이스 타입 정의
interface DatabaseMetadata {
  buildDate: string
  totalCompanies: number
  totalFiles: number
  industries: number
  markets: number
}

interface SearchIndex {
  companyNames: string[]
  industryMap: Record<string, string[]>
  marketMap: Record<string, string[]>
}

interface FinancialDatabase {
  metadata: DatabaseMetadata
  companies: Record<string, any>
  searchIndex: SearchIndex
}

// 데이터베이스 로딩 (싱글톤 패턴)
let cachedDatabase: FinancialDatabase | null = null

/**
 * 재무 데이터베이스 로드
 */
export function loadFinancialDatabase(): FinancialDatabase {
  if (cachedDatabase) {
    return cachedDatabase
  }

  try {
    const dbPath = join(process.cwd(), 'src/data/financial-database.json')
    const content = readFileSync(dbPath, 'utf8')
    cachedDatabase = JSON.parse(content) as FinancialDatabase

    console.log(
      `📊 데이터베이스 로드 완료: ${cachedDatabase.metadata.totalCompanies}개 회사`
    )
    return cachedDatabase
  } catch (error) {
    console.error('❌ 데이터베이스 로드 실패:', error)
    throw new Error('재무 데이터베이스를 로드할 수 없습니다.')
  }
}

/**
 * 회사명으로 정확히 검색
 */
export function findCompanyByExactName(companyName: string): any | null {
  const db = loadFinancialDatabase()
  return db.companies[companyName] || null
}

/**
 * 퍼지 검색 (부분 일치)
 */
export function searchCompaniesByName(
  searchTerm: string,
  limit = 10
): string[] {
  const db = loadFinancialDatabase()
  const searchLower = searchTerm.toLowerCase()

  // 정확한 매치 우선
  const exactMatches = db.searchIndex.companyNames.filter(
    (name) => name.toLowerCase() === searchLower
  )

  // 부분 매치
  const partialMatches = db.searchIndex.companyNames.filter(
    (name) =>
      name.toLowerCase().includes(searchLower) &&
      name.toLowerCase() !== searchLower
  )

  // 시작 매치
  const startMatches = db.searchIndex.companyNames.filter(
    (name) =>
      name.toLowerCase().startsWith(searchLower) &&
      name.toLowerCase() !== searchLower &&
      !name.toLowerCase().includes(searchLower)
  )

  // 결과 조합 및 중복 제거
  const results = [
    ...new Set([...exactMatches, ...partialMatches, ...startMatches]),
  ]

  return results.slice(0, limit)
}

/**
 * 업종별 회사 검색
 */
export function searchCompaniesByIndustry(industryName: string): string[] {
  const db = loadFinancialDatabase()
  return db.searchIndex.industryMap[industryName] || []
}

/**
 * 시장별 회사 검색
 */
export function searchCompaniesByMarket(marketName: string): string[] {
  const db = loadFinancialDatabase()
  return db.searchIndex.marketMap[marketName] || []
}

/**
 * 자동완성용 회사명 추천
 */
export function getCompanyNameSuggestions(
  searchTerm: string,
  limit = 5
): string[] {
  if (!searchTerm || searchTerm.length < 1) {
    return []
  }

  const db = loadFinancialDatabase()
  const searchLower = searchTerm.toLowerCase()

  // 시작하는 문자열 우선
  const startsWith = db.searchIndex.companyNames.filter((name) =>
    name.toLowerCase().startsWith(searchLower)
  )

  // 포함하는 문자열
  const includes = db.searchIndex.companyNames.filter(
    (name) =>
      name.toLowerCase().includes(searchLower) &&
      !name.toLowerCase().startsWith(searchLower)
  )

  const results = [...startsWith, ...includes]
  return results.slice(0, limit)
}

/**
 * 데이터베이스 메타데이터 조회
 */
export function getDatabaseInfo(): DatabaseMetadata {
  const db = loadFinancialDatabase()
  return db.metadata
}

/**
 * 업종 목록 조회
 */
export function getIndustryList(): string[] {
  const db = loadFinancialDatabase()
  return Object.keys(db.searchIndex.industryMap).sort()
}

/**
 * 시장 목록 조회
 */
export function getMarketList(): string[] {
  const db = loadFinancialDatabase()
  return Object.keys(db.searchIndex.marketMap).sort()
}

export type { FinancialDatabase, SearchIndex, DatabaseMetadata }
