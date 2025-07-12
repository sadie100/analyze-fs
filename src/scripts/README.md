# 재무제표 데이터 처리 시스템

금융감독원 재무상태표 TXT 파일을 JSON으로 변환하고 통합 데이터베이스를 구축하는 시스템입니다.

## 📋 데이터 처리 플로우

```
1. 재무상태표 .txt 파일들
   ↓ (financial-converter-flexible.js)
2. 재무상태표 .json 파일들
   ↓ (build-database.js)
3. 통합 데이터베이스 (financial-database.json)
   └── 검색 인덱스 (company-index.json)
```

## 🗂️ 프로젝트 구조

```
src/
├── data/
│   ├── raw/                           # 원본 TXT 파일들
│   ├── processed/                     # 변환된 JSON 파일들
│   ├── resources/                     # CORPCODE.xml 등 참조 파일들
│   ├── financial-database.json        # 최종 통합 데이터베이스
│   └── company-index.json             # 검색 인덱스
└── scripts/
    ├── financial-converter-flexible.js    # TXT → JSON 변환기 (필수)
    ├── build-database.js                  # JSON 통합 → DB 구축기 (필수)
    ├── extract-company.js                 # 특정 회사 추출 (선택)
    ├── check-items.js                     # 데이터 검증 (선택)
    └── README.md                          # 이 파일
```

## 🚀 사용법

### 1단계: TXT → JSON 변환

```bash
# scripts 폴더로 이동
cd src/scripts

# 각 TXT 파일을 JSON으로 변환 (raw → processed)
node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_금융기타_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_금융기타_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_금융기타_연결_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_금융기타_연결_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_보험_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_보험_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_보험_연결_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_보험_연결_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_연결_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_연결_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_은행_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_은행_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_은행_연결_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_은행_연결_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_증권_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_증권_20250606.json"

node financial-converter-flexible.js "../data/raw/2025_1분기보고서_01_재무상태표_증권_연결_20250606.txt" "../data/processed/2025_1분기보고서_01_재무상태표_증권_연결_20250606.json"
```

### 2단계: 통합 데이터베이스 구축

```bash
# JSON 파일들을 통합하여 최종 데이터베이스 생성
node build-database.js
```

이 명령으로 생성되는 파일들:

- `../data/financial-database.json` - 통합 재무 데이터베이스
- `../data/company-index.json` - 회사 검색 인덱스

## 📊 입력 파일 형식

### TXT 파일 (금융감독원 형식)

```
재무제표종류	종목코드	회사명	시장구분	업종	업종명	결산월	결산기준일	보고서종류	통화	항목코드	항목명	당기 1분기말	전기말	전전기말
재무상태표, 유동/비유동법 - 별도	[095570]	AJ네트웍스	유가증권시장상장법인	763	산업용 기계 및 장비 임대업	12	2025-03-31	1분기보고서	KRW	ifrs-full_Assets	자산총계	1,669,024,533,027	1,619,112,721,909	1,500,000,000,000
```

## 📄 출력 파일 형식

### 1단계 출력: 개별 JSON 파일

```json
{
  "companies": [
    {
      "종목코드": "095570",
      "회사명": "AJ네트웍스",
      "시장구분": "유가증권시장상장법인",
      "업종": "763",
      "업종명": "산업용 기계 및 장비 임대업",
      "결산월": "12",
      "결산기준일": "2025-03-31",
      "보고서종류": "1분기보고서",
      "통화": "KRW",
      "재무데이터": [
        {
          "재무제표종류": "재무상태표, 유동/비유동법 - 별도",
          "항목코드": "ifrs-full_Assets",
          "항목명": "자산총계",
          "당기 1분기말": 1669024533027,
          "전기말": 1619112721909,
          "전전기말": 1500000000000
        }
      ]
    }
  ]
}
```

### 2단계 출력: 통합 데이터베이스

```json
{
  "metadata": {
    "buildDate": "2025-01-06T...",
    "totalCompanies": 2847,
    "totalFiles": 11,
    "industries": 45,
    "markets": 3
  },
  "companies": {
    "AJ네트웍스": {
      "basicInfo": {
        "종목코드": "095570",
        "시장구분": "유가증권시장상장법인",
        "업종": "763",
        "업종명": "산업용 기계 및 장비 임대업"
      },
      "financialData": [...],
      "rawData": [...]
    }
  },
  "searchIndex": {
    "companyNames": ["AJ네트웍스", "삼성전자", ...],
    "industryMap": {
      "반도체": ["삼성전자", "SK하이닉스", ...],
      "자동차": ["현대차", "기아", ...]
    },
    "marketMap": {
      "유가증권시장상장법인": ["삼성전자", "현대차", ...],
      "코스닥시장상장법인": ["네이버", "카카오", ...]
    }
  }
}
```

## 🔧 주요 기능

### financial-converter-flexible.js

- 한글 인코딩 자동 감지 및 처리 (CP949, EUC-KR, UTF-8)
- 탭으로 구분된 데이터 파싱
- 숫자 데이터 자동 변환 (쉼표 제거, number 타입 변환)
- 회사별 데이터 그룹화
- 에러 처리 및 로깅

### build-database.js

- 여러 JSON 파일 통합
- 중복 데이터 제거
- 회사별 인덱싱
- 업종별/시장별 분류
- 검색 인덱스 생성

## 📈 통계 예시

```
🔄 재무데이터베이스 구축 시작...
📁 발견된 JSON 파일: 11개
  - 2025_1분기보고서_01_재무상태표_20250606.json
  - 2025_1분기보고서_01_재무상태표_금융기타_20250606.json
  ...

📊 통계:
  - 처리된 파일: 11/11
  - 총 회사 수: 2,847
  - 총 데이터 항목: 3,128

✅ 데이터베이스 저장 완료: ../data/financial-database.json
✅ 검색 인덱스 저장 완료: ../data/company-index.json
📦 데이터베이스 크기: 15.23 MB
```

## 🗑️ 정리 가능한 파일들

처리 완료 후 삭제 가능한 파일들:

- `src/data/raw/*.txt` - 원본 TXT 파일들 (백업 목적으로 보관 권장)
- `src/data/processed/*.json` - 개별 JSON 파일들 (통합 DB 생성 후 선택적 삭제 가능)

## ⚙️ 요구사항

- Node.js 14 이상
- iconv-lite 패키지 (한글 인코딩 처리)

## 🔍 디버깅 도구

### 특정 회사 데이터 추출

```bash
node extract-company.js
```

### 데이터 검증

```bash
node check-items.js
```

## ❗ 주의사항

1. **인코딩**: TXT 파일이 CP949나 EUC-KR로 인코딩되어 있을 수 있음
2. **메모리**: 대용량 파일 처리 시 충분한 메모리 필요
3. **중복 제거**: build-database.js가 자동으로 중복 데이터 제거
4. **백업**: 원본 TXT 파일은 백업 보관 권장
