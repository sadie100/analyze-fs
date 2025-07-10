import { createReadStream } from 'fs'
import { createInterface } from 'readline'

async function extractCompanyData(companyName) {
  const fileStream = createReadStream('재무상태표.json')
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  let currentObject = ''
  let braceCount = 0
  let inTargetCompany = false
  let foundData = null

  for await (const line of rl) {
    currentObject += line + '\n'

    // 중괄호 개수 세기
    for (const char of line) {
      if (char === '{') braceCount++
      if (char === '}') braceCount--
    }

    // 회사명 확인
    if (line.includes(`"회사명": "${companyName}"`)) {
      inTargetCompany = true
    }

    // 객체가 완성되었는지 확인
    if (braceCount === 0 && currentObject.trim()) {
      if (inTargetCompany) {
        try {
          foundData = JSON.parse(currentObject.trim())
          break
        } catch {
          // JSON 파싱 오류 시 계속 진행
        }
      }
      currentObject = ''
      inTargetCompany = false
    }
  }

  return foundData
}

// AJ네트웍스 데이터 추출
extractCompanyData('AJ네트웍스')
  .then((data) => {
    if (data) {
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.log('AJ네트웍스 데이터를 찾을 수 없습니다.')
    }
  })
  .catch((err) => {
    console.error('오류:', err)
  })
