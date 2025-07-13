const fs = require('fs')
const path = require('path')
const iconv = require('iconv-lite')

// 재귀적으로 디렉토리를 순회하면서 txt 파일을 찾는 함수
function findTxtFiles(dir) {
  const files = fs.readdirSync(dir)
  let txtFiles = []

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      txtFiles = txtFiles.concat(findTxtFiles(filePath))
    } else if (file.endsWith('.txt')) {
      txtFiles.push(filePath)
    }
  }

  return txtFiles
}

// EUC-KR에서 UTF-8로 변환하는 함수
async function convertEncoding(filePath) {
  try {
    // EUC-KR로 파일 읽기
    const content = fs.readFileSync(filePath)
    const decodedContent = iconv.decode(content, 'euc-kr')

    // UTF-8로 파일 쓰기
    fs.writeFileSync(filePath, decodedContent, 'utf8')
    console.log(`✅ 변환 완료: ${filePath}`)
  } catch (error) {
    console.error(`❌ 변환 실패: ${filePath}`, error)
  }
}

// 메인 실행 함수
async function main() {
  const dataDir = path.join(__dirname, '..', 'data', 'raw')
  console.log('📁 데이터 디렉토리 스캔 중...', dataDir)

  const txtFiles = findTxtFiles(dataDir)
  console.log(`🔍 총 ${txtFiles.length}개의 txt 파일을 찾았습니다.`)

  for (const file of txtFiles) {
    await convertEncoding(file)
  }

  console.log('🎉 모든 파일 변환이 완료되었습니다!')
}

main().catch(console.error)
