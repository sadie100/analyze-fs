// Vercel Blob Storage에서 JSON 데이터를 가져오는 로더
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

// 캐시 설정
let cachedDatabase: FinancialDatabase | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30분

const FINANCIAL_DATABASE_URL = process.env.FINANCIAL_DATABASE_URL

/**
 * Vercel Blob Storage에서 재무 데이터베이스 로드
 */
export async function loadFinancialDatabaseFromBlob(): Promise<FinancialDatabase> {
  const now = Date.now()

  // 캐시가 유효한 경우 캐시된 데이터 반환
  if (cachedDatabase && now < cacheExpiry) {
    return cachedDatabase
  }

  try {
    console.log('📥 Vercel Blob Storage에서 데이터베이스 로드 중...')
    if (!FINANCIAL_DATABASE_URL) {
      throw new Error('FINANCIAL_DATABASE_URL is not set')
    }
    const response = await fetch(FINANCIAL_DATABASE_URL)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = (await response.json()) as FinancialDatabase

    // 캐시 업데이트
    cachedDatabase = data
    cacheExpiry = now + CACHE_DURATION

    console.log(
      `📊 Blob Storage 데이터베이스 로드 완료: ${data.metadata.totalCompanies}개 회사`
    )

    return data
  } catch (error) {
    console.error('❌ Blob Storage 데이터베이스 로드 실패:', error)

    // 캐시된 데이터가 있으면 임시로 사용
    if (cachedDatabase) {
      console.log('⚠️ 캐시된 데이터를 사용합니다.')
      return cachedDatabase
    }

    throw new Error('재무 데이터베이스를 로드할 수 없습니다.')
  }
}

/**
 * 캐시 무효화
 */
export function clearCache(): void {
  cachedDatabase = null
  cacheExpiry = 0
}

/**
 * 캐시 상태 확인
 */
export function getCacheStatus(): { hasCache: boolean; expiresIn: number } {
  const now = Date.now()
  return {
    hasCache: cachedDatabase !== null,
    expiresIn: Math.max(0, cacheExpiry - now),
  }
}

export type { FinancialDatabase, SearchIndex, DatabaseMetadata }
