# 재무제표 분석 도구 (Financial Statement Analyzer)

한국 금융감독원의 재무제표 데이터를 분석하고 시각화하는 Next.js 웹 애플리케이션입니다.

## 주요 기능

- 📊 **재무제표 데이터 변환**: 금융감독원 TXT 형식을 JSON으로 변환
- 🔤 **한국어 인코딩 지원**: EUC-KR, CP949, UTF-8 자동 감지
- 📈 **재무 분석**: 주요 재무 지표 분석 및 시각화
- 🏦 **업종별 분석**: 은행, 증권, 보험, 금융기타 업종별 분석
- 📱 **반응형 웹**: 모바일 및 데스크톱 지원

## 기술 스택

- **Frontend**: Next.js 15, React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **데이터 처리**: Node.js, iconv-lite

## 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 재무제표 데이터 변환

### 변환기 사용법

`src/scripts/financial-converter-flexible.js`를 사용하여 금융감독원 재무제표 데이터를 JSON으로 변환할 수 있습니다.

```bash
cd src/scripts
node financial-converter-flexible.js
```

### 지원 파일 형식

- **입력**: 금융감독원 분기보고서 재무상태표 TXT 파일
- **출력**: 구조화된 JSON 형식
- **인코딩**: EUC-KR, CP949, UTF-8 자동 감지

### 변환 예시

```javascript
// 입력 데이터 (TXT)
재무제표종류	종목코드	회사명	시장구분	업종	업종명	결산월	결산기준일	보고서종류	통화	항목코드	항목명	당기1분기말	전기말	전전기말
BS	005930	삼성전자	유가증권시장	A	전기전자	12	20250331	1분기보고서	원	bs_01	현금및현금성자산	12000000000	11000000000	10000000000

// 출력 데이터 (JSON)
{
  "삼성전자": {
    "companyInfo": {
      "companyName": "삼성전자",
      "stockCode": "005930",
      "market": "유가증권시장",
      "sector": "A",
      "sectorName": "전기전자"
    },
    "financialData": {
      "현금및현금성자산": {
        "당기1분기말": 12000000000,
        "전기말": 11000000000,
        "전전기말": 10000000000
      }
    }
  }
}
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js 앱 라우터
│   ├── page.tsx           # 메인 페이지
│   ├── layout.tsx         # 레이아웃
│   ├── FinancialAnalysis.tsx    # 재무 분석 컴포넌트
│   ├── GuideModal.tsx     # 가이드 모달
│   ├── ResponsiveFinancialGuide.tsx  # 반응형 가이드
│   └── result/page.tsx    # 결과 페이지
├── components/ui/         # UI 컴포넌트
├── lib/                   # 유틸리티 함수
├── scripts/              # 데이터 변환 스크립트
│   ├── financial-converter-flexible.js  # 재무제표 변환기
│   ├── 재무상태표.json    # 변환된 재무 데이터
│   ├── 은행_재무데이터_최종.json  # 은행업 데이터
│   ├── CORPCODE.xml       # 회사 코드 데이터
│   └── *.txt             # 원본 재무제표 파일들
└── types.ts              # 타입 정의
```

## 데이터 소스

- **금융감독원 전자공시시스템 (DART)**: 분기보고서 재무상태표
- **업종별 분류**: 은행, 증권, 보험, 금융기타
- **데이터 형식**: 탭으로 구분된 텍스트 파일 (TSV)

## 주요 특징

### 1. 한국어 인코딩 자동 처리

- EUC-KR, CP949, UTF-8 인코딩 자동 감지
- 한글 회사명 및 항목명 완벽 지원

### 2. 데이터 무결성 보장

- 컬럼 개수 불일치 자동 수정
- 누락된 데이터 빈 값으로 처리
- 숫자 데이터 자동 파싱 (쉼표 제거)

### 3. 유연한 데이터 구조

- 회사별 데이터 그룹화
- 재무 항목별 시계열 데이터
- 메타데이터 포함 (회사 정보, 보고서 정보)

## 개발

### 빌드

```bash
pnpm run build
```

### 타입 체크

```bash
pnpm run type-check
```
