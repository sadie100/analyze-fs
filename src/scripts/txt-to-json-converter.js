const fs = require('fs')
const Decimal = require('decimal.js')

/**
 * 한국어 재무제표 데이터 변환기 (유연한 버전)
 * EUC-KR/CP949 인코딩 지원 + 컬럼 누락 처리
 */

function cleanNumericValue(value) {
  if (!value || value.trim() === '' || value.trim() === '-') {
    return null
  }

  try {
    // 쉼표 제거 및 공백 제거
    const cleaned = value.replace(/,/g, '').trim()

    // 숫자로 변환 (Decimal 사용)
    const decimal = new Decimal(cleaned)
    return decimal.toNumber()
  } catch (error) {
    console.error('❌ 숫자 변환 오류:', error)
    return null
  }
}

function cleanValue(value) {
  if (!value) return ''

  // [null] 값을 빈 문자열로 처리
  if (value.trim() === '[null]') return ''

  // 앞뒤 공백 제거 및 연속된 공백을 하나로 치환
  return value.trim().replace(/\s+/g, ' ')
}

function getStandardizedHeaders(headers, filePath) {
  // 재무제표 종류 확인
  const isBalanceSheet = filePath.includes('재무상태표')
  const isIncomeStatement = filePath.includes('손익계산서')
  const isCashFlow = filePath.includes('현금흐름표')
  const isEquityChange = filePath.includes('자본변동표')

  // 기본 헤더는 그대로 유지
  const standardHeaders = headers.slice()

  // 재무제표 종류별로 다른 헤더 매핑
  if (isBalanceSheet) {
    // 재무상태표는 기존 헤더 유지
    return standardHeaders
  } else if (isIncomeStatement) {
    // 손익계산서는 3개월/누적 데이터 모두 포함
    return standardHeaders
  } else if (isCashFlow) {
    // 현금흐름표는 당기/전기 데이터만 사용
    const cashFlowMapping = {
      당기1분기: '당기 1분기말',
      전기1분기: '전기말',
      전기: '전전기말',
    }
    return standardHeaders.map((header) => cashFlowMapping[header] || header)
  } else if (isEquityChange) {
    // 자본변동표는 최소 헤더만 사용
    return standardHeaders
  }

  return standardHeaders
}

function readFileWithKoreanEncoding(filePath) {
  console.log(`📁 파일 읽는 중: ${filePath}`)
  try {
    // 이제 모든 파일이 UTF-8이므로 직접 UTF-8로 읽습니다
    const content = fs.readFileSync(filePath, 'utf8')
    console.log('✅ UTF-8 인코딩으로 성공')
    return content
  } catch (error) {
    console.error('❌ 파일 읽기 실패:', error.message)
    throw error
  }
}

function parseFinancialData(content, filePath) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)

  if (lines.length === 0) {
    throw new Error('파일이 비어있습니다.')
  }

  // 헤더 파싱 및 정리
  const originalHeaders = lines[0].split('\t').map((h) => cleanValue(h))
  const headers = getStandardizedHeaders(originalHeaders, filePath)

  console.log('📋 헤더 개수:', headers.length)
  console.log('📋 헤더:', headers)

  const results = []
  let validRows = 0
  let fixedRows = 0
  let skippedRows = 0
  let errorRows = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    try {
      const values = line.split('\t')

      // 컬럼 개수 처리
      if (values.length < headers.length) {
        while (values.length < headers.length) {
          values.push('')
        }
        fixedRows++
      } else if (values.length > headers.length) {
        values.splice(headers.length)
        fixedRows++
      }

      // 데이터 객체 생성
      const row = {}
      headers.forEach((header, index) => {
        row[header] = cleanValue(values[index] || '')
      })

      // 데이터 유효성 검사 완화
      if (!row.회사명 && !row.항목명 && !row.종목코드) {
        skippedRows++
        continue
      }

      // 재무 데이터 생성
      const financialData = {
        재무제표종류: row.재무제표종류 || '',
        종목코드: row.종목코드 || '',
        회사명: row.회사명 || '',
        시장구분: row.시장구분 || '',
        업종: row.업종 || '',
        업종명: row.업종명 || '',
        결산월: row.결산월 || '',
        결산기준일: row.결산기준일 || '',
        보고서종류: row.보고서종류 || '',
        통화: row.통화 || '',
        항목코드: row.항목코드 || '',
        항목명: row.항목명 || '',
      }

      // 재무제표 종류별로 다른 필드 추가
      if (filePath.includes('손익계산서')) {
        financialData['당기 1분기 3개월'] = cleanNumericValue(
          row['당기 1분기 3개월']
        )
        financialData['당기 1분기 누적'] = cleanNumericValue(
          row['당기 1분기 누적']
        )
        financialData['전기 1분기 3개월'] = cleanNumericValue(
          row['전기 1분기 3개월']
        )
        financialData['전기 1분기 누적'] = cleanNumericValue(
          row['전기 1분기 누적']
        )
        financialData['전기'] = cleanNumericValue(row['전기'])
        financialData['전전기'] = cleanNumericValue(row['전전기'])
      } else if (filePath.includes('현금흐름표')) {
        financialData['당기 1분기말'] = cleanNumericValue(row['당기1분기'])
        financialData['전기말'] = cleanNumericValue(row['전기1분기'])
        financialData['전전기말'] = cleanNumericValue(row['전기'])
      } else {
        // 재무상태표와 자본변동표
        financialData['당기 1분기말'] = cleanNumericValue(row['당기 1분기말'])
        financialData['전기말'] = cleanNumericValue(row['전기말'])
        financialData['전전기말'] = cleanNumericValue(row['전전기말'])
      }

      results.push(financialData)
      validRows++
    } catch (error) {
      console.error(`❌ 행 ${i + 1} 처리 중 오류:`, error.message)
      errorRows++
      continue
    }
  }

  console.log(`✅ 총 ${validRows}개의 유효한 데이터 파싱`)
  if (fixedRows > 0) {
    console.log(`🔧 ${fixedRows}개의 행에서 컬럼 개수 수정`)
  }
  if (skippedRows > 0) {
    console.log(`⚠️ ${skippedRows}개의 행을 건너뜀`)
  }
  if (errorRows > 0) {
    console.log(`❌ ${errorRows}개의 행에서 오류 발생`)
  }

  return results
}

function groupByCompany(data) {
  const groupedMap = new Map()

  data.forEach((item) => {
    const key = item.종목코드 || item.회사명

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        종목코드: item.종목코드,
        회사명: item.회사명,
        시장구분: item.시장구분,
        업종: item.업종,
        업종명: item.업종명,
        결산월: item.결산월,
        결산기준일: item.결산기준일,
        보고서종류: item.보고서종류,
        통화: item.통화,
        재무데이터: [],
      })
    }

    const financialItem = {
      재무제표종류: item.재무제표종류,
      항목코드: item.항목코드,
      항목명: item.항목명,
      '당기 1분기 3개월': item['당기 1분기 3개월'],
      '당기 1분기 누적': item['당기 1분기 누적'],
      '전기 1분기 3개월': item['전기 1분기 3개월'],
      '전기 1분기 누적': item['전기 1분기 누적'],
      전기: item['전기'],
      전전기: item['전전기'],
    }

    groupedMap.get(key).재무데이터.push(financialItem)
  })

  return Array.from(groupedMap.values())
}

function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('🚀 한국어 재무제표 변환기 (유연한 버전)')
    console.log(
      '사용법: node financial-converter-flexible.js <입력파일> <출력파일> [--no-group]'
    )
    console.log('')
    console.log('특징:')
    console.log('  ✅ 한국어 인코딩 자동 감지 (EUC-KR, CP949, UTF-8)')
    console.log('  ✅ 컬럼 개수 불일치 자동 수정')
    console.log('  ✅ 회사별 그룹화 지원')
    console.log('')
    console.log('예시:')
    console.log('  node financial-converter-flexible.js data.txt output.json')
    console.log(
      '  node financial-converter-flexible.js data.txt output.json --no-group'
    )
    process.exit(1)
  }

  const inputFile = args[0]
  const outputFile = args[1]
  const noGroup = args.includes('--no-group')

  try {
    // 입력 파일 확인
    if (!fs.existsSync(inputFile)) {
      throw new Error(`입력 파일을 찾을 수 없습니다: ${inputFile}`)
    }

    console.log('🔄 변환 시작...')

    // 파일 읽기
    const content = readFileWithKoreanEncoding(inputFile)

    // 데이터 파싱
    console.log('📊 데이터 파싱 중...')
    const data = parseFinancialData(content, inputFile)

    if (data.length === 0) {
      console.log('⚠️ 파싱된 데이터가 없습니다.')
      return
    }

    // JSON 변환
    console.log('📄 JSON 변환 중...')
    let result
    if (noGroup) {
      result = { data: data }
    } else {
      const companies = groupByCompany(data)
      result = { companies: companies }
      console.log(`🏢 총 ${companies.length}개의 회사로 그룹화`)
    }

    // 파일 저장
    console.log(`💾 JSON 파일 저장 중: ${outputFile}`)
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8')

    console.log('✅ 변환 완료!')
    console.log(`📁 결과 파일: ${outputFile}`)

    // 결과 요약
    console.log('\n📊 변환 결과:')
    if (result.companies) {
      console.log(`  - 회사 수: ${result.companies.length}`)
      console.log(
        `  - 총 재무항목 수: ${result.companies.reduce(
          (sum, company) => sum + company.재무데이터.length,
          0
        )}`
      )
    } else {
      console.log(`  - 총 재무항목 수: ${result.data.length}`)
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  cleanNumericValue,
  readFileWithKoreanEncoding,
  parseFinancialData,
  groupByCompany,
}
