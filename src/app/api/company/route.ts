import { jsonWithCache, jsonError } from '@/lib/http'
import { loadFinancialDatabase } from '@/lib/company-search'

export async function GET() {
  try {
    const db = await loadFinancialDatabase()

    return jsonWithCache({
      success: true,
      db,
    })
  } catch (error) {
    console.error('❌ 회사 데이터베이스 로드 오류:', error)
    return jsonError(
      {
        success: false,
        error: '데이터베이스를 불러오지 못했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
