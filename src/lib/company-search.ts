import { loadFinancialDatabaseFromBlob } from './external-data-loader'
import type {
  FinancialDatabase,
  SearchIndex,
  DatabaseMetadata,
} from './external-data-loader'

// 데이터베이스 로딩 (싱글톤 패턴)
let cachedDatabase: FinancialDatabase | null = null

/**
 * 재무 데이터베이스 로드 (Vercel Blob Storage에서)
 */
export async function loadFinancialDatabase(): Promise<FinancialDatabase> {
  if (cachedDatabase) {
    return cachedDatabase
  }

  try {
    cachedDatabase = await loadFinancialDatabaseFromBlob()
    return cachedDatabase
  } catch (error) {
    console.error('❌ 데이터베이스 로드 실패:', error)
    throw new Error('재무 데이터베이스를 로드할 수 없습니다.')
  }
}

/**
 * 회사명으로 정확히 검색
 */
export async function findCompanyByExactName({
  db,
  companyName,
}: {
  db: FinancialDatabase
  companyName: string
}): Promise<any | null> {
  return db.companies[companyName] || null
}

/**
 * 퍼지 검색 (부분 일치)
 */
export async function searchCompaniesByName({
  db,
  searchTerm,
  limit = 10,
}: {
  db: FinancialDatabase
  searchTerm: string
  limit?: number
}): Promise<string[]> {
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

export type { FinancialDatabase, SearchIndex, DatabaseMetadata }
