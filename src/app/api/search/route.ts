import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const indexUrl = process.env.COMPANY_INDEX_URL
    if (!indexUrl) {
      return NextResponse.json(
        { error: 'COMPANY_INDEX_URL is not configured' },
        { status: 500 }
      )
    }
    const res = await fetch(indexUrl, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch company index: ${res.status}` },
        { status: 502 }
      )
    }
    const payload = (await res.json()) as { companyNames?: unknown }
    const companyNames = Array.isArray(payload.companyNames)
      ? (payload.companyNames as unknown[]).filter(
          (n): n is string => typeof n === 'string'
        )
      : []
    // 정렬 및 중복 제거
    const uniqueSorted = Array.from(new Set(companyNames)).sort((a, b) =>
      a.localeCompare(b)
    )
    return NextResponse.json({
      companyNames: uniqueSorted,
      total: uniqueSorted.length,
    })
  } catch (error) {
    console.error('❌ 검색 API 오류:', error)

    return NextResponse.json(
      {
        error: '검색 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
