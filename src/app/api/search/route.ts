import { jsonWithCache, jsonError } from '@/lib/http'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const isLocal = process.env.USE_LOCAL_DATABASE === 'true'
    let payload: { companyNames?: unknown }

    if (isLocal) {
      // 로컬 파일 읽기
      const filePath = path.join(process.cwd(), 'src/data/company-index.json')
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      payload = JSON.parse(fileContent) as { companyNames?: unknown }
    } else {
      // 기존 fetch 방식
      const indexUrl = process.env.COMPANY_INDEX_URL
      if (!indexUrl) {
        return jsonError(
          { error: 'COMPANY_INDEX_URL is not configured' },
          { status: 500 }
        )
      }
      const res = await fetch(indexUrl, { cache: 'no-store' })
      if (!res.ok) {
        return jsonError(
          { error: `Failed to fetch company index: ${res.status}` },
          { status: 502 }
        )
      }
      payload = (await res.json()) as { companyNames?: unknown }
    }

    const companyNames = Array.isArray(payload.companyNames)
      ? (payload.companyNames as unknown[]).filter(
          (n): n is string => typeof n === 'string'
        )
      : []
    // 정렬 및 중복 제거
    const uniqueSorted = Array.from(new Set(companyNames)).sort((a, b) =>
      a.localeCompare(b)
    )
    return jsonWithCache({
      companyNames: uniqueSorted,
      total: uniqueSorted.length,
    })
  } catch (error) {
    console.error('❌ 검색 API 오류:', error)

    return jsonError(
      {
        error: '검색 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
