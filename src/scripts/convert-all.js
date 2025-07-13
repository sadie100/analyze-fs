const fs = require('fs')
const path = require('path')

const RAW_DIR = path.join(__dirname, '../data/raw')
const PROCESSED_DIR = path.join(__dirname, '../data/processed')

/**
 * 디렉토리 내의 모든 txt 파일을 json으로 변환
 */
async function convertAllFiles() {
  console.log('🔄 전체 변환 시작...\n')

  // 재무제표 종류별 디렉토리 처리
  const categories = ['재무상태표', '손익계산서', '현금흐름표', '자본변동표']
  let totalFiles = 0
  let successFiles = 0
  let errorFiles = 0

  for (const category of categories) {
    const rawDir = path.join(RAW_DIR, category)
    const processedDir = path.join(PROCESSED_DIR, category)

    // processed 디렉토리가 없으면 생성
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true })
    }

    console.log(`📁 [${category}] 처리 중...`)

    // txt 파일 목록 가져오기
    const files = fs.readdirSync(rawDir).filter((file) => file.endsWith('.txt'))

    for (const file of files) {
      const inputFile = path.join(rawDir, file)
      const outputFile = path.join(processedDir, file.replace('.txt', '.json'))

      try {
        console.log(`\n📄 변환 중: ${file}`)

        // txt-to-json-converter.js 실행
        const { spawnSync } = require('child_process')
        const result = spawnSync(
          'node',
          [
            path.join(__dirname, 'txt-to-json-converter.js'),
            inputFile,
            outputFile,
          ],
          {
            stdio: 'inherit',
          }
        )

        if (result.status === 0) {
          successFiles++
        } else {
          console.error(`❌ 변환 실패: ${file}`)
          errorFiles++
        }
      } catch (error) {
        console.error(`❌ 오류 발생: ${file}`, error)
        errorFiles++
      }

      totalFiles++
    }
  }

  // 최종 결과 출력
  console.log('\n📊 변환 완료!')
  console.log(`총 파일 수: ${totalFiles}`)
  console.log(`성공: ${successFiles}`)
  console.log(`실패: ${errorFiles}`)
}

// 스크립트 실행
if (require.main === module) {
  convertAllFiles().catch(console.error)
}
