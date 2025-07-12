import { NextRequest, NextResponse } from 'next/server'
import {
  getCompanyNameSuggestions,
  searchCompaniesByName,
  getDatabaseInfo,
  getIndustryList,
  getMarketList,
} from '@/lib/company-search'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'suggestions'
    const limit = parseInt(searchParams.get('limit') || '5')

    switch (type) {
      case 'suggestions':
        // 자동완성용 추천
        if (!query) {
          return NextResponse.json({ suggestions: [] })
        }

        const suggestions = getCompanyNameSuggestions(query, limit)
        return NextResponse.json({
          suggestions,
          query,
        })

      case 'search':
        // 전체 검색
        if (!query) {
          return NextResponse.json({
            results: [],
            total: 0,
            query: '',
          })
        }

        const results = searchCompaniesByName(query, limit)
        return NextResponse.json({
          results,
          total: results.length,
          query,
        })

      case 'info':
        // 데이터베이스 정보
        const info = getDatabaseInfo()
        return NextResponse.json({
          database: info,
          industries: getIndustryList(),
          markets: getMarketList(),
        })

      default:
        return NextResponse.json(
          { error: '지원하지 않는 검색 타입입니다' },
          { status: 400 }
        )
    }
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
