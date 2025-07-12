const {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  statSync,
} = require('fs')
const { join } = require('path')

/**
 * 모든 재무제표 JSON 파일들을 하나로 통합하는 스크립트
 */
async function buildFinancialDatabase() {
  console.log('🔄 재무데이터베이스 구축 시작...')

  const processedDir = '../data/processed/'
  const outputFile = '../data/financial-database.json'

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
      const files = readdirSync(statementDir).filter(
        (file) => file.endsWith('.json') && !file.includes('aj-networks-data') // 기존 파일 제외
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
                financialStatements: {
                  재무상태표: [],
                  손익계산서: [],
                  현금흐름표: [],
                  자본변동표: [],
                },
                rawData: [], // 원본 데이터 보존
              }
              fileCompanyCount++
            }

            // 재무제표 종류별로 데이터 분류
            if (company.재무데이터 && Array.isArray(company.재무데이터)) {
              const existingCodes = new Set(
                companyDatabase[companyName].financialStatements[
                  fileInfo.type
                ].map((item) => item.항목코드)
              )

              company.재무데이터.forEach((item) => {
                if (!existingCodes.has(item.항목코드)) {
                  companyDatabase[companyName].financialStatements[
                    fileInfo.type
                  ].push(item)
                  existingCodes.add(item.항목코드)
                }
              })
            }

            // 원본 데이터도 저장 (디버깅용)
            companyDatabase[companyName].rawData.push({
              source: fileInfo.name,
              type: fileInfo.type,
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
      console.error(`  ❌ 오류 발생 (${fileInfo.name}):`, error.message)
    }
  }

  console.log(`\n📊 통계:`)
  console.log(`  - 처리된 파일: ${processedFiles}/${allFiles.length}`)
  console.log(`  - 총 회사 수: ${Object.keys(companyDatabase).length}`)
  console.log(`  - 총 데이터 항목: ${totalCompanies}`)

  // 회사별 재무제표 항목 수 체크
  console.log(`\n🏢 회사별 데이터 현황 (상위 10개):`)
  const sortedCompanies = Object.entries(companyDatabase)
    .map(([name, data]) => {
      const totalItems =
        data.financialStatements.재무상태표.length +
        data.financialStatements.손익계산서.length +
        data.financialStatements.현금흐름표.length +
        data.financialStatements.자본변동표.length
      return [name, totalItems, data.financialStatements]
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  sortedCompanies.forEach(([name, totalItems, statements]) => {
    console.log(
      `  ${name}: ${totalItems}개 항목 (재무상태표:${statements.재무상태표.length}, 손익계산서:${statements.손익계산서.length}, 현금흐름표:${statements.현금흐름표.length}, 자본변동표:${statements.자본변동표.length})`
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
        statementTypes: statementTypes,
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
