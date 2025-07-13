const fs = require('fs')
const iconv = require('iconv-lite')
const Decimal = require('decimal.js')

/**
 * 한국어 재무제표 데이터 변환기 (유연한 버전)
 * EUC-KR/CP949 인코딩 지원 + 컬럼 누락 처리
 */

function cleanNumericValue(value) {
  if (!value || value.trim() === '' || value.trim() === '-') {
    return null
  }

  // 숫자만 추출 (쉼표 제거 및 공백 제거)
  const cleaned = value.replace(/[^0-9.-]/g, '').trim()

  try {
    // Decimal을 사용하여 정밀한 숫자 변환
    const decimal = new Decimal(cleaned)
    return decimal.toNumber()
  } catch (error) {
    return null
  }
}

function readFileWithKoreanEncoding(filePath) {
  console.log(`📁 파일 읽는 중: ${filePath}`)

  const buffer = fs.readFileSync(filePath)
  let content

  // CP949로 시도 (EUC-KR의 확장이므로 먼저 시도)
  try {
    content = iconv.decode(buffer, 'cp949')
    if (content.includes('')) {
      throw new Error('CP949 디코딩 실패')
    }
    console.log('✅ CP949 인코딩으로 성공')
    return content
  } catch {
    console.log('⚠️ CP949 디코딩 실패, EUC-KR 시도')
  }

  // EUC-KR로 시도
  try {
    content = iconv.decode(buffer, 'euc-kr')
    if (content.includes('')) {
      throw new Error('EUC-KR 디코딩 실패')
    }
    console.log('✅ EUC-KR 인코딩으로 성공')
    return content
  } catch {
    console.log('⚠️ EUC-KR 디코딩 실패, UTF-8 시도')
  }

  // UTF-8로 시도
  try {
    content = buffer.toString('utf8')
    if (content.includes('')) {
      throw new Error('UTF-8 디코딩 실패')
    }
    console.log('✅ UTF-8 인코딩으로 성공')
    return content
  } catch {
    console.log('⚠️ UTF-8 디코딩 실패')
  }

  // 모든 인코딩 시도 실패 시 CP949로 강제 시도
  console.log('⚠️ 모든 인코딩 시도 실패, CP949 강제 적용')
  return iconv.decode(buffer, 'cp949')
}

function parseFinancialData(content) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)

  if (lines.length === 0) {
    throw new Error('파일이 비어있습니다.')
  }

  // 헤더 파싱 및 정리
  const headers = lines[0]
    .split('\t')
    .map((h) => h.trim())
    .map((h) => {
      // 깨진 한글 헤더 수정
      if (h.includes('')) {
        if (h.includes('당')) return '당기 1분기말'
        if (h.includes('전기')) return '전기말'
        if (h.includes('전전')) return '전전기말'
      }
      return h
    })

  console.log('📋 헤더 개수:', headers.length)
  console.log('📋 헤더:', headers)

  const results = []
  let validRows = 0
  let fixedRows = 0
  let skippedRows = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

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
      row[header] = values[index]?.trim() || ''
    })

    // 필수 필드 검증
    if (!row.회사명 && !row.항목명) {
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
      '당기 1분기말': cleanNumericValue(row['당기 1분기말']),
      전기말: cleanNumericValue(row['전기말']),
      전전기말: cleanNumericValue(row['전전기말']),
    }

    results.push(financialData)
    validRows++
  }

  console.log(`✅ 총 ${validRows}개의 유효한 데이터 파싱`)
  if (fixedRows > 0) {
    console.log(`🔧 ${fixedRows}개의 행에서 컬럼 개수 수정`)
  }
  if (skippedRows > 0) {
    console.log(`⚠️ ${skippedRows}개의 행을 건너뜀`)
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
      '당기 1분기말': item['당기 1분기말'],
      전기말: item.전기말,
      전전기말: item.전전기말,
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
    const data = parseFinancialData(content)

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
