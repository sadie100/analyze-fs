import { readFileSync } from 'fs'

function checkAvailableItems() {
  try {
    const data = JSON.parse(readFileSync('aj-networks-data.json', 'utf8'))

    console.log('=== AJ네트웍스 회사 정보 ===')
    console.log(`회사명: ${data.회사명}`)
    console.log(`종목코드: ${data.종목코드}`)
    console.log(`업종: ${data.업종명}`)
    console.log(`결산기준일: ${data.결산기준일}`)
    console.log(`보고서종류: ${data.보고서종류}`)

    console.log('\n=== 사용 가능한 재무 항목들 ===')

    const items = {}

    if (data.재무데이터) {
      data.재무데이터.forEach((item, index) => {
        const itemName = item.항목명
        const currentValue = item['당기 1분기말']

        if (currentValue && currentValue !== 0) {
          items[itemName] = currentValue
        }

        // 처음 20개 항목만 자세히 출력
        if (index < 20) {
          console.log(
            `${index + 1}. ${itemName}: ${
              currentValue ? currentValue.toLocaleString() : 'N/A'
            }`
          )
        }
      })

      console.log(`\n총 ${data.재무데이터.length}개의 항목이 있습니다.`)
      console.log(`그 중 값이 있는 항목: ${Object.keys(items).length}개`)

      // 주요 재무 항목 검색
      console.log('\n=== 주요 재무 항목 검색 ===')

      const searchTerms = [
        '자산총계',
        '부채총계',
        '자본총계',
        '유동자산',
        '유동부채',
        '매출',
        '영업이익',
        '순이익',
      ]

      searchTerms.forEach((term) => {
        const found = data.재무데이터.filter(
          (item) => item.항목명.includes(term) && item['당기 1분기말']
        )

        if (found.length > 0) {
          console.log(`\n"${term}" 관련 항목들:`)
          found.forEach((item) => {
            console.log(
              `  - ${item.항목명}: ${item['당기 1분기말'].toLocaleString()}`
            )
          })
        }
      })
    }
  } catch (error) {
    console.error('오류 발생:', error)
  }
}

checkAvailableItems()
