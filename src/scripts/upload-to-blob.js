// .env 파일 로드 (Node.js 스크립트에서 환경 변수 사용을 위해 필수)
require('dotenv').config()

const { put, list } = require('@vercel/blob')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { join } = require('path')
const { execSync } = require('child_process')

/**
 * Vercel Blob Storage에 재무 데이터베이스 파일을 업로드하는 스크립트
 *
 * 필수 환경 변수:
 * - BLOB_READ_WRITE_TOKEN: Vercel Blob Storage 인증 토큰
 *
 * 필수 조건:
 * - Vercel CLI 설치 (pnpm add -g vercel)
 * - Vercel 로그인 (vercel login)
 * - 프로젝트 연결 (vercel link)
 *
 * 기능:
 * - Blob Storage에 파일 업로드 (addRandomSuffix로 캐싱 문제 해결)
 * - Vercel 환경 변수 자동 업데이트 (production)
 * - 로컬 .env 파일 자동 업데이트
 * - 이전 blob 파일 목록 표시 (수동 삭제 안내)
 *
 * 사용 후 작업:
 * - vercel --prod로 재배포 (환경 변수 적용)
 * - 이전 blob 파일 수동 삭제 (스토리지 절약)
 *
 * 사용법:
 *   node upload-to-blob.js
 */

/**
 * Vercel CLI 필수 조건 체크
 */
function checkVercelCLI() {
  console.log('🔍 Vercel CLI 환경 체크 중...\n')

  // 1. Vercel CLI 설치 확인
  try {
    const version = execSync('vercel --version', { encoding: 'utf-8' }).trim()
    console.log(`   ✅ Vercel CLI 설치됨: ${version}`)
  } catch {
    console.error('   ❌ Vercel CLI가 설치되지 않았습니다.')
    console.error('   💡 설치 방법: pnpm add -g vercel\n')
    process.exit(1)
  }

  // 2. Vercel 로그인 확인
  try {
    const user = execSync('vercel whoami', { encoding: 'utf-8' }).trim()
    console.log(`   ✅ Vercel 로그인됨: ${user}`)
  } catch {
    console.error('   ❌ Vercel에 로그인되지 않았습니다.')
    console.error('   💡 로그인 방법: vercel login\n')
    process.exit(1)
  }

  // 3. 프로젝트 연결 확인
  const projectJsonPath = join(process.cwd(), '.vercel', 'project.json')
  if (!existsSync(projectJsonPath)) {
    console.error('   ❌ Vercel 프로젝트가 연결되지 않았습니다.')
    console.error('   💡 연결 방법: vercel link\n')
    process.exit(1)
  }
  console.log('   ✅ Vercel 프로젝트 연결됨\n')
}

/**
 * Vercel 환경 변수 업데이트
 */
function updateVercelEnv(envName, envValue) {
  console.log(`   🔄 Vercel 환경 변수 업데이트: ${envName}`)

  try {
    // 기존 환경 변수 삭제 (있을 경우)
    try {
      execSync(`vercel env rm ${envName} production --yes`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      console.log(`      ✓ 기존 환경 변수 삭제됨`)
    } catch {
      // 환경 변수가 없으면 에러 발생 - 무시하고 계속
      console.log(`      ✓ 기존 환경 변수 없음 (신규 생성)`)
    }

    // 새 환경 변수 추가
    execSync(`echo "${envValue}" | vercel env add ${envName} production`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    console.log(`      ✓ 새 환경 변수 추가됨`)
  } catch (error) {
    console.error(`      ✗ 환경 변수 업데이트 실패: ${error.message}`)
    throw error
  }
}

/**
 * 로컬 .env 파일 업데이트
 */
function updateLocalEnv(envName, envValue) {
  const envPath = join(process.cwd(), '.env')
  console.log(`   🔄 로컬 .env 파일 업데이트: ${envName}`)

  try {
    let envContent = ''

    // .env 파일이 있으면 읽기
    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, 'utf-8')
    }

    // 환경 변수 라인 찾아서 교체 또는 추가
    const envRegex = new RegExp(`^${envName}=.*$`, 'm')
    const newLine = `${envName}=${envValue}`

    if (envRegex.test(envContent)) {
      // 기존 라인 교체
      envContent = envContent.replace(envRegex, newLine)
      console.log(`      ✓ 기존 값 업데이트됨`)
    } else {
      // 새 라인 추가
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n'
      }
      envContent += `${newLine}\n`
      console.log(`      ✓ 새 값 추가됨`)
    }

    // 파일 저장
    writeFileSync(envPath, envContent, 'utf-8')
  } catch (error) {
    console.error(`      ✗ .env 파일 업데이트 실패: ${error.message}`)
    // .env 업데이트 실패는 치명적이지 않으므로 계속 진행
  }
}

/**
 * 메인 업로드 함수
 */
async function uploadToBlob() {
  console.log('🚀 Vercel Blob Storage 완전 자동 업로드 시작...\n')

  // 1. Vercel CLI 환경 체크
  checkVercelCLI()

  // 2. 환경 변수 확인
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('❌ BLOB_READ_WRITE_TOKEN 환경 변수가 설정되지 않았습니다.')
    console.error(
      '💡 Vercel 대시보드에서 Blob Read-Write Token을 생성하고 .env 파일에 추가하세요.\n'
    )
    process.exit(1)
  }

  // 3. 기존 blob 파일 목록 조회
  console.log('📋 기존 blob 파일 조회 중...\n')
  let oldBlobs = []
  try {
    const { blobs } = await list({ token })
    oldBlobs = blobs.filter(
      (blob) =>
        blob.pathname.startsWith('financial-database') ||
        blob.pathname.startsWith('company-index')
    )
    console.log(`   ✅ 기존 파일 ${oldBlobs.length}개 발견`)
    oldBlobs.forEach((blob) => {
      console.log(`      - ${blob.pathname}`)
    })
    console.log()
  } catch (error) {
    console.error('   ⚠️  기존 파일 조회 실패 (계속 진행):', error.message)
    console.log()
  }

  // 4. 업로드할 파일 정의
  const files = [
    {
      path: join(__dirname, '../data/financial-database.json'),
      blobName: 'financial-database.json',
      description: '재무 데이터베이스',
      envName: 'FINANCIAL_DATABASE_URL',
    },
    {
      path: join(__dirname, '../data/company-index.json'),
      blobName: 'company-index.json',
      description: '회사 검색 인덱스',
      envName: 'COMPANY_INDEX_URL',
    },
  ]

  const results = []

  // 5. 각 파일 업로드
  console.log('📤 파일 업로드 중...\n')
  for (const file of files) {
    try {
      console.log(`📄 ${file.description}`)
      console.log(`   파일: ${file.path}`)

      // 파일 읽기
      const fileContent = readFileSync(file.path, 'utf-8')
      const fileSize = Buffer.byteLength(fileContent, 'utf-8')
      console.log(`   크기: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)

      // Blob Storage에 업로드
      const blob = await put(file.blobName, fileContent, {
        access: 'public',
        addRandomSuffix: true, // 캐싱 문제 해결
        token: token,
        contentType: 'application/json',
      })

      console.log(`   ✅ 업로드 성공!`)
      console.log(`   URL: ${blob.url}\n`)

      results.push({
        name: file.description,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        size: fileSize,
        envName: file.envName,
      })
    } catch (error) {
      console.error(`   ❌ ${file.description} 업로드 실패:`, error.message)
      if (error.message.includes('Unauthorized')) {
        console.error('   💡 BLOB_READ_WRITE_TOKEN이 올바른지 확인하세요.\n')
      }
      process.exit(1)
    }
  }

  // 6. Vercel 환경 변수 업데이트
  console.log('🔧 Vercel 환경 변수 업데이트 중...\n')
  for (const result of results) {
    try {
      updateVercelEnv(result.envName, result.url)
    } catch {
      console.error(
        `\n❌ Vercel 환경 변수 업데이트 실패. 수동으로 설정해주세요:`
      )
      console.error(`   ${result.envName}=${result.url}\n`)
      process.exit(1)
    }
  }
  console.log()

  // 7. 로컬 .env 파일 업데이트
  console.log('📝 로컬 .env 파일 업데이트 중...\n')
  for (const result of results) {
    updateLocalEnv(result.envName, result.url)
  }
  console.log()

  // 8. 결과 요약
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✨ 모든 작업 완료!\n')
  console.log('📋 업로드된 파일:')
  results.forEach((result) => {
    console.log(`\n${result.name}:`)
    console.log(`  환경 변수: ${result.envName}`)
    console.log(`  URL: ${result.url}`)
    console.log(`  크기: ${(result.size / 1024 / 1024).toFixed(2)} MB`)
  })

  console.log('\n✅ 완료된 작업:')
  console.log('  1. ✓ Blob Storage 업로드 (addRandomSuffix로 캐싱 문제 해결)')
  console.log('  2. ✓ Vercel 환경 변수 업데이트 (production)')
  console.log('  3. ✓ 로컬 .env 파일 업데이트')

  console.log('\n📌 다음 단계:')
  console.log('  1. Vercel 재배포하여 환경 변수 변경사항 적용:')
  console.log('     vercel --prod')
  console.log()

  if (oldBlobs.length > 0) {
    console.log(
      `  2. 이전 blob 파일 ${oldBlobs.length}개 삭제 (스토리지 절약):`
    )
    oldBlobs.forEach((blob) => {
      console.log(`     - ${blob.pathname}`)
    })
    console.log()
    console.log('     삭제 명령어:')
    console.log(`     vercel blob rm ${oldBlobs.map((b) => b.url).join(' ')}`)
    console.log()
  }

  console.log('💡 참고:')
  console.log('  - 재배포 전까지는 이전 URL로 계속 서비스됩니다')
  console.log('  - 이전 blob 파일은 수동으로 삭제해주세요')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

// 스크립트 실행
if (require.main === module) {
  uploadToBlob().catch((error) => {
    console.error('❌ 예상치 못한 오류:', error)
    process.exit(1)
  })
}

module.exports = { uploadToBlob }
