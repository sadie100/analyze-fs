import { NextRequest, NextResponse } from 'next/server'
import {
  findCompanyByExactName,
  searchCompaniesByName,
} from '@/lib/company-search'
import { analyzeCompany } from '@/lib/financial-analyzer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const companyName = decodeURIComponent(name)

    // 정확한 회사명으로 검색
    let companyData = await findCompanyByExactName(companyName)

    // 정확한 매치가 없으면 퍼지 검색
    if (!companyData) {
      const searchResults = await searchCompaniesByName(companyName, 5)

      if (searchResults.length === 0) {
        return NextResponse.json(
          {
            error: '검색 결과가 없습니다',
            message: `"${companyName}"와 일치하는 회사를 찾을 수 없습니다.`,
            suggestions: [],
          },
          { status: 404 }
        )
      }

      // 가장 유사한 결과 사용
      const bestMatch = searchResults[0]
      companyData = await findCompanyByExactName(bestMatch)

      if (!companyData) {
        return NextResponse.json(
          {
            error: '데이터를 찾을 수 없습니다',
            message: `검색 결과는 있지만 데이터를 로드할 수 없습니다.`,
            suggestions: searchResults,
          },
          { status: 404 }
        )
      }

      // 대체 결과 사용됨을 알림
      console.log(`🔍 퍼지 검색 결과: "${companyName}" → "${bestMatch}"`)
    }

    // 재무분석 수행
    const analysisResult = analyzeCompany(companyName, companyData)

    return NextResponse.json({
      success: true,
      data: analysisResult,
      usedExactMatch: (await findCompanyByExactName(companyName)) !== null,
    })
  } catch (error) {
    console.error('❌ API 오류:', error)

    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
