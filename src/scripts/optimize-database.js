const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

/**
 * 기존 방대한 DB에서 분석에 필요한 필수 데이터만 추출하는 최적화 스크립트
 *
 * 기존 DB 크기: 15MB+
 * 최적화 후 예상 크기: 1-2MB
 *
 * 추출할 데이터: 18개 필수 항목만
 */

// 항목명 매핑 테이블 (financial-analyzer.ts와 동일)
const ITEM_MAPPING = {
  매출액: ['매출액', '매출', '수익(매출액)', '영업수익'],
  영업이익: ['영업이익', '영업이익(손실)'],
  당기순이익: ['당기순이익', '당기순이익(손실)', '분기순이익'],
  자산총계: ['자산총계'],
  유동자산: ['유동자산'],
  비유동자산: ['비유동자산'],
  부채총계: ['부채총계'],
  유동부채: ['유동부채'],
  비유동부채: ['비유동부채'],
  자본총계: ['자본총계', '자기자본'],
  현금및현금성자산: ['현금및현금성자산', '현금 및 현금성자산'],
  매출채권: ['매출채권', '매출채권 및 기타채권'],
  재고자산: ['재고자산', '재고'],
  단기차입금: ['단기차입금'],
  장기차입금: ['장기차입금'],
}

/**
 * 회사 데이터에서 필요한 재무 항목만 추출
 */
function extractEssentialFinancialData(companyData) {
  const allData = [
    ...companyData.financialStatements.재무상태표,
    ...companyData.financialStatements.손익계산서,
    ...companyData.financialStatements.현금흐름표,
    ...companyData.financialStatements.자본변동표,
  ]

  const result = {
    // 손익계산서 항목 (3개)
    매출액: null,
    영업이익: null,
    당기순이익: null,
    // 재무상태표 항목 (9개)
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
    // 전년 동기 데이터 (성장률 계산용, 3개)
    전년매출액: null,
    전년영업이익: null,
    전년당기순이익: null,
  }

  // 데이터 매핑
  allData.forEach((item) => {
    const currentValue = item['당기 1분기말']
    const previousValue = item['전기말']

    Object.entries(ITEM_MAPPING).forEach(([key, searchTerms]) => {
      searchTerms.forEach((term) => {
        if (item.항목명.includes(term) && currentValue !== null) {
          if (result[key] === null) {
            result[key] = currentValue

            // 전년 동기 데이터도 저장
            if (key === '매출액' && previousValue !== null) {
              result.전년매출액 = previousValue
            } else if (key === '영업이익' && previousValue !== null) {
              result.전년영업이익 = previousValue
            } else if (key === '당기순이익' && previousValue !== null) {
              result.전년당기순이익 = previousValue
            }
          }
        }
      })
    })
  })

  return result
}

/**
 * 메인 최적화 함수
 */
function optimizeDatabase() {
  console.log('🔄 데이터베이스 최적화 시작...')

  const inputFile = join(process.cwd(), 'src/data/financial-database.json')
  const outputFile = join(
    process.cwd(),
    'src/data/optimized-financial-database.json'
  )

  try {
    // 기존 DB 로드
    console.log('📖 기존 데이터베이스 로드 중...')
    const originalDB = JSON.parse(readFileSync(inputFile, 'utf8'))

    console.log(`📊 원본 DB 정보:`)
    console.log(`  - 총 회사 수: ${originalDB.metadata.totalCompanies}`)
    console.log(
      `  - 원본 파일 크기: ${(
        readFileSync(inputFile).length /
        1024 /
        1024
      ).toFixed(2)} MB`
    )

    // 최적화된 DB 구조 생성
    const optimizedDB = {
      metadata: {
        buildDate: new Date().toISOString(),
        totalCompanies: originalDB.metadata.totalCompanies,
        version: '1.0.0-optimized',
        originalSize: readFileSync(inputFile).length,
        optimizedFor: 'financial-analysis-18-items',
      },
      companies: {},
      searchIndex: originalDB.searchIndex,
    }

    let processedCount = 0
    let successCount = 0

    // 각 회사 데이터 최적화
    console.log('🔄 회사 데이터 최적화 중...')
    Object.entries(originalDB.companies).forEach(
      ([companyName, companyData]) => {
        processedCount++

        try {
          // 필수 재무 데이터만 추출
          const essentialData = extractEssentialFinancialData(companyData)

          // 최적화된 구조로 저장
          optimizedDB.companies[companyName] = {
            basicInfo: companyData.basicInfo,
            financialData: essentialData,
          }

          successCount++

          // 진행률 표시
          if (processedCount % 100 === 0) {
            console.log(
              `  진행률: ${processedCount}/${
                originalDB.metadata.totalCompanies
              } (${(
                (processedCount / originalDB.metadata.totalCompanies) *
                100
              ).toFixed(1)}%)`
            )
          }
        } catch (error) {
          console.error(`  ❌ ${companyName} 처리 실패:`, error.message)
        }
      }
    )

    // 최적화된 DB 저장
    console.log('💾 최적화된 데이터베이스 저장 중...')
    writeFileSync(outputFile, JSON.stringify(optimizedDB, null, 2), 'utf8')

    const optimizedSize = readFileSync(outputFile).length

    console.log('\n✅ 최적화 완료!')
    console.log('📊 최적화 결과:')
    console.log(`  - 처리된 회사: ${successCount}/${processedCount}`)
    console.log(
      `  - 최적화 파일 크기: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`
    )
    console.log(
      `  - 크기 감소율: ${(
        (((originalDB.metadata.originalSize || readFileSync(inputFile).length) -
          optimizedSize) /
          (originalDB.metadata.originalSize ||
            readFileSync(inputFile).length)) *
        100
      ).toFixed(1)}%`
    )
    console.log(`  - 파일 위치: ${outputFile}`)

    // 샘플 데이터 표시
    console.log('\n🔍 샘플 데이터 (첫 번째 회사):')
    const firstCompany = Object.entries(optimizedDB.companies)[0]
    if (firstCompany) {
      const [name, data] = firstCompany
      console.log(`  회사명: ${name}`)
      console.log(`  업종: ${data.basicInfo.업종명}`)
      console.log(`  추출된 재무 항목:`)
      Object.entries(data.financialData).forEach(([key, value]) => {
        if (value !== null) {
          console.log(`    ${key}: ${value.toLocaleString()}`)
        }
      })
    }

    // 사용 가이드
    console.log('\n📝 사용 가이드:')
    console.log('1. 기존 financial-database.json을 백업하세요')
    console.log(
      '2. optimized-financial-database.json을 financial-database.json으로 대체하세요'
    )
    console.log(
      '3. 또는 company-search.ts에서 최적화된 파일을 로드하도록 수정하세요'
    )
  } catch (error) {
    console.error('❌ 최적화 실패:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  optimizeDatabase()
}

module.exports = { optimizeDatabase }
