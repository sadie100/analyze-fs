const {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  statSync,
} = require('fs')
const { join } = require('path')

// 항목명 매핑 테이블 (필요한 18개 항목만 추출)
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
 * 회사 재무데이터에서 필요한 항목만 추출
 */
function extractEssentialFinancialData(company) {
  const result = {
    // 손익계산서 항목 (3개)
    매출액: null,
    영업이익: null,
    당기순이익: null,
    // 재무상태표 항목 (12개)
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

  if (company.재무데이터 && Array.isArray(company.재무데이터)) {
    company.재무데이터.forEach((item) => {
      // 손익계산서의 경우 누적 데이터 우선 사용
      const isIncomeStatement =
        item.재무제표종류.includes('손익계산서') ||
        item.재무제표종류.includes('포괄손익계산서')
      let currentValue = null
      let previousValue = null

      if (isIncomeStatement) {
        // 손익계산서는 누적 데이터 우선 사용
        currentValue =
          item['당기 1분기 누적'] !== null
            ? item['당기 1분기 누적']
            : item['당기 1분기 3개월']
        previousValue =
          item['전기 1분기 누적'] !== null
            ? item['전기 1분기 누적']
            : item['전기 1분기 3개월']
      } else {
        // 다른 재무제표는 기존 필드 사용
        currentValue = item['당기 1분기말']
        previousValue = item['전기말']
      }

      Object.entries(ITEM_MAPPING).forEach(([key, searchTerms]) => {
        searchTerms.forEach((term) => {
          if (item.항목명.includes(term)) {
            if (result[key] === null && currentValue !== null) {
              result[key] = currentValue

              // 전년 동기 데이터도 저장 (손익계산서 항목만)
              if (isIncomeStatement) {
                if (key === '매출액' && previousValue !== null) {
                  result.전년매출액 = previousValue
                } else if (key === '영업이익' && previousValue !== null) {
                  result.전년영업이익 = previousValue
                } else if (key === '당기순이익' && previousValue !== null) {
                  result.전년당기순이익 = previousValue
                }
              }
            }
          }
        })
      })
    })
  }

  return result
}

/**
 * 모든 재무제표 JSON 파일들을 하나로 통합하는 스크립트 (최적화된 버전)
 * 처음부터 필요한 18개 항목만 추출하여 저장
 */
async function buildFinancialDatabase() {
  console.log('🔄 최적화된 재무데이터베이스 구축 시작...')

  const processedDir = join(__dirname, '../data/processed/')
  const outputFile = join(__dirname, '../data/financial-database.json')

  // 모든 재무제표 폴더 처리
  const statementTypes = [
    '재무상태표',
    '손익계산서',
    '현금흐름표',
    '자본변동표',
  ]
  const allFiles = []

  // 각 재무제표 폴더에서 JSON 파일들 수집
  for (const statementType of statementTypes) {
    const statementDir = join(processedDir, statementType)
    try {
      const files = readdirSync(statementDir).filter((file) =>
        file.endsWith('.json')
      )

      files.forEach((file) => {
        allFiles.push({
          path: join(statementDir, file),
          name: file,
          type: statementType,
        })
      })

      console.log(`📁 ${statementType}: ${files.length}개 파일`)
    } catch (err) {
      console.log(`⚠️  ${statementType} 폴더를 찾을 수 없음: ${err.message}`)
    }
  }

  console.log(`📁 총 발견된 JSON 파일: ${allFiles.length}개`)

  const companyDatabase = {}
  let totalCompanies = 0
  let processedFiles = 0

  // 각 JSON 파일 처리
  for (const fileInfo of allFiles) {
    try {
      console.log(`\n📖 처리 중: ${fileInfo.type}/${fileInfo.name}`)
      const content = readFileSync(fileInfo.path, 'utf8')
      const data = JSON.parse(content)

      if (data.companies && Array.isArray(data.companies)) {
        let fileCompanyCount = 0

        data.companies.forEach((company) => {
          if (company.회사명) {
            const companyName = company.회사명.trim()

            // 회사가 이미 존재하는 경우 데이터 병합
            if (!companyDatabase[companyName]) {
              companyDatabase[companyName] = {
                basicInfo: {
                  종목코드: company.종목코드,
                  시장구분: company.시장구분,
                  업종: company.업종,
                  업종명: company.업종명,
                  결산월: company.결산월,
                  결산기준일: company.결산기준일,
                  보고서종류: company.보고서종류,
                  통화: company.통화,
                },
                financialData: {
                  // 필수 18개 항목 초기화
                  매출액: null,
                  영업이익: null,
                  당기순이익: null,
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
                  전년매출액: null,
                  전년영업이익: null,
                  전년당기순이익: null,
                },
              }
              fileCompanyCount++
            }

            // 필수 재무 항목만 추출하여 병합
            const extractedData = extractEssentialFinancialData(company)
            Object.entries(extractedData).forEach(([key, value]) => {
              if (
                value !== null &&
                (companyDatabase[companyName].financialData[key] === null ||
                  companyDatabase[companyName].financialData[key] === 0 ||
                  Math.abs(value) >
                    Math.abs(companyDatabase[companyName].financialData[key]))
              ) {
                companyDatabase[companyName].financialData[key] = value
              }
            })
          }
        })

        console.log(`  ✅ ${fileCompanyCount}개 회사 추가됨`)
        totalCompanies += fileCompanyCount
        processedFiles++
      } else {
        console.log(`  ⚠️  잘못된 형식: companies 배열이 없음`)
      }
    } catch (error) {
      console.error(`  ❌ 오류 발생 (${fileInfo.name}):`, error.message)
    }
  }

  console.log(`\n📊 통계:`)
  console.log(`  - 처리된 파일: ${processedFiles}/${allFiles.length}`)
  console.log(`  - 총 회사 수: ${Object.keys(companyDatabase).length}`)
  console.log(`  - 총 데이터 항목: ${totalCompanies}`)

  // 회사별 재무데이터 추출 현황 체크
  console.log(`\n🏢 회사별 데이터 현황 (상위 10개):`)
  const sortedCompanies = Object.entries(companyDatabase)
    .map(([name, data]) => {
      const extractedCount = Object.values(data.financialData).filter(
        (value) => value !== null
      ).length
      return [name, extractedCount, data.financialData]
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  sortedCompanies.forEach(([name, extractedCount, financialData]) => {
    const nonNullItems = Object.entries(financialData)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => {
        try {
          return `${key}: ${value.toLocaleString()}`
        } catch {
          return `${key}: ${value}`
        }
      })
      .slice(0, 5) // 첫 5개만 표시

    console.log(
      `  ${name}: ${extractedCount}/18개 항목 추출 (${nonNullItems.join(', ')}${
        extractedCount > 5 ? '...' : ''
      })`
    )
  })

  // 검색 인덱스 생성
  const searchIndex = {
    companyNames: Object.keys(companyDatabase),
    industryMap: {},
    marketMap: {},
  }

  Object.entries(companyDatabase).forEach(([name, data]) => {
    // 업종별 분류
    const industry = data.basicInfo.업종명
    if (industry) {
      if (!searchIndex.industryMap[industry]) {
        searchIndex.industryMap[industry] = []
      }
      searchIndex.industryMap[industry].push(name)
    }

    // 시장별 분류
    const market = data.basicInfo.시장구분
    if (market) {
      if (!searchIndex.marketMap[market]) {
        searchIndex.marketMap[market] = []
      }
      searchIndex.marketMap[market].push(name)
    }
  })

  // 결과 저장
  try {
    // data 디렉토리 생성
    const dataDir = join(__dirname, '../data')
    try {
      mkdirSync(dataDir, { recursive: true })
    } catch {
      // 이미 존재하는 경우 무시
    }

    const finalData = {
      metadata: {
        buildDate: new Date().toISOString(),
        totalCompanies: Object.keys(companyDatabase).length,
        totalFiles: processedFiles,
        industries: Object.keys(searchIndex.industryMap).length,
        markets: Object.keys(searchIndex.marketMap).length,
        version: '1.0.0-optimized',
        optimizedFor: 'financial-analysis-18-items',
        extractedItems: Object.keys(ITEM_MAPPING).length + 3, // 15개 + 3개 전년 데이터
      },
      companies: companyDatabase,
      searchIndex,
    }

    writeFileSync(outputFile, JSON.stringify(finalData, null, 2), 'utf8')
    console.log(`\n✅ 데이터베이스 저장 완료: ${outputFile}`)

    // 검색 인덱스 별도 저장
    const indexFile = join(__dirname, '../data/company-index.json')
    writeFileSync(indexFile, JSON.stringify(searchIndex, null, 2), 'utf8')
    console.log(`✅ 검색 인덱스 저장 완료: ${indexFile}`)

    // 파일 크기 확인
    const stats = statSync(outputFile)
    console.log(
      `📦 데이터베이스 크기: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
    )
  } catch (error) {
    console.error('❌ 저장 실패:', error)
  }
}

// 스크립트 실행
if (require.main === module) {
  buildFinancialDatabase()
}

module.exports = { buildFinancialDatabase }
