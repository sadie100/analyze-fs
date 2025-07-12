const {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  statSync,
} = require('fs')
const { join } = require('path')

/**
 * 모든 재무상태표 JSON 파일들을 하나로 통합하는 스크립트
 */
async function buildFinancialDatabase() {
  console.log('🔄 재무데이터베이스 구축 시작...')

  const processedDir = '../data/processed/'
  const outputFile = '../data/financial-database.json'

  // JSON 파일들 찾기
  const files = readdirSync(processedDir).filter(
    (file) =>
      file.endsWith('.json') &&
      file.includes('재무상태표') &&
      !file.includes('aj-networks-data') // 기존 파일 제외
  )

  console.log(`📁 발견된 JSON 파일: ${files.length}개`)
  files.forEach((file) => console.log(`  - ${file}`))

  const companyDatabase = {}
  let totalCompanies = 0
  let processedFiles = 0

  // 각 JSON 파일 처리
  for (const file of files) {
    try {
      console.log(`\n📖 처리 중: ${file}`)
      const filePath = join(processedDir, file)
      const content = readFileSync(filePath, 'utf8')
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
                financialData: [],
                rawData: [], // 원본 데이터 보존
              }
              fileCompanyCount++
            }

            // 재무데이터 추가 (중복 제거)
            if (company.재무데이터 && Array.isArray(company.재무데이터)) {
              const existingCodes = new Set(
                companyDatabase[companyName].financialData.map(
                  (item) => item.항목코드
                )
              )

              company.재무데이터.forEach((item) => {
                if (!existingCodes.has(item.항목코드)) {
                  companyDatabase[companyName].financialData.push(item)
                  existingCodes.add(item.항목코드)
                }
              })
            }

            // 원본 데이터도 저장 (디버깅용)
            companyDatabase[companyName].rawData.push({
              source: file,
              data: company,
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
      console.error(`  ❌ 오류 발생 (${file}):`, error.message)
    }
  }

  console.log(`\n📊 통계:`)
  console.log(`  - 처리된 파일: ${processedFiles}/${files.length}`)
  console.log(`  - 총 회사 수: ${Object.keys(companyDatabase).length}`)
  console.log(`  - 총 데이터 항목: ${totalCompanies}`)

  // 회사별 재무데이터 항목 수 체크
  console.log(`\n🏢 회사별 데이터 현황 (상위 10개):`)
  const sortedCompanies = Object.entries(companyDatabase)
    .sort((a, b) => b[1].financialData.length - a[1].financialData.length)
    .slice(0, 10)

  sortedCompanies.forEach(([name, data]) => {
    console.log(`  ${name}: ${data.financialData.length}개 항목`)
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
    try {
      mkdirSync('../data', { recursive: true })
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
      },
      companies: companyDatabase,
      searchIndex,
    }

    writeFileSync(outputFile, JSON.stringify(finalData, null, 2), 'utf8')
    console.log(`\n✅ 데이터베이스 저장 완료: ${outputFile}`)

    // 검색 인덱스 별도 저장
    writeFileSync(
      '../data/company-index.json',
      JSON.stringify(searchIndex, null, 2),
      'utf8'
    )
    console.log(`✅ 검색 인덱스 저장 완료: ../data/company-index.json`)

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
