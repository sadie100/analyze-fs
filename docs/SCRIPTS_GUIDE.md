# 재무제표 데이터 처리 시스템

금융감독원 형식의 TXT를 JSON으로 변환하고, 회사별 핵심 18개 재무항목 중심의 통합 데이터베이스를 생성합니다.

## 📋 데이터 처리 플로우

```
1. 원본 .txt (재무상태표/손익계산서/현금흐름표/자본변동표)
   ↓ (txt-to-json-converter.js 또는 convert-all.js)
2. 개별 .json (폴더별 저장: src/data/processed/…)
   ↓ (build-database.js)
3. 통합 DB (src/data/financial-database.json)
   └─ 검색 인덱스 (src/data/company-index.json)
```

## 🗂️ 프로젝트 구조

```
src/
├── data/
│   ├── raw/                     # 원본 TXT (카테고리별 하위 폴더)
│   │   ├── 재무상태표/
│   │   ├── 손익계산서/
│   │   ├── 현금흐름표/
│   │   └── 자본변동표/
│   ├── processed/               # 변환된 JSON (카테고리별 하위 폴더)
│   │   ├── 재무상태표/
│   │   ├── 손익계산서/
│   │   ├── 현금흐름표/
│   │   └── 자본변동표/
│   ├── financial-database.json  # 최종 통합 DB (자동 생성)
│   └── company-index.json       # 검색 인덱스 (자동 생성)
└── scripts/
    ├── txt-to-json-converter.js # TXT → JSON 변환기 (개별 파일 변환)
    ├── convert-all.js           # raw 전체 일괄 변환기
    ├── build-database.js        # processed → 통합 DB 생성기
    ├── convert-encoding.js      # EUC-KR → UTF-8 변환 도우미(선택)
    ├── extract-company.js       # 대용량 JSON에서 특정 회사 추출(선택)
    └── check-items.js           # 샘플 회사 데이터 점검(선택)
```

## 🚀 사용법

### 0단계(선택): 인코딩 정리

원본 TXT가 EUC-KR/CP949인 경우 UTF-8로 일괄 변환합니다. (현재 이미 전환되어 있습니다)

```bash
cd src/scripts
node convert-encoding.js
```

### 1단계: TXT → JSON 변환

모든 카테고리를 일괄 변환:

```bash
cd src/scripts
node convert-all.js
```

개별 파일만 변환:

```bash
cd src/scripts
node txt-to-json-converter.js "../data/raw/재무상태표/2025_1분기보고서_01_재무상태표_20250606.txt" "../data/processed/재무상태표/2025_1분기보고서_01_재무상태표_20250606.json"

# 회사별 그룹화 없이 행 단위 출력이 필요하면 --no-group 사용
node txt-to-json-converter.js "<입력파일>" "<출력파일>" --no-group
```

특징:

- 탭 구분 데이터 파싱, 공백 정리, 숫자 필드(쉼표 제거) `Decimal.js`로 안전 변환
- 자본변동표/현금흐름표의 가변 열 수용, 불완전/헤더성 행은 자동 스킵
- 기본값은 회사 단위 그룹화(`companies`), `--no-group` 시 `data` 배열 출력

### 2단계: 통합 데이터베이스 구축

```bash
cd src/scripts
node build-database.js
```

생성 파일:

- `src/data/financial-database.json` — 회사별 핵심 18개 항목 중심의 통합 DB
- `src/data/company-index.json` — 회사/업종/시장 인덱스

메타데이터에는 빌드 일시, 파일 수, 회사 수, 업종/시장 카운트, 버전, 추출 항목 수가 포함됩니다.

## 📊 입력/출력 형식

### 입력: TXT (금융감독원 형식)

```
재무제표종류	종목코드	회사명	시장구분	업종	업종명	결산월	결산기준일	보고서종류	통화	항목코드	항목명	당기 1분기말	전기말	전전기말
재무상태표, 유동/비유동법 - 별도	[095570]	AJ네트웍스	유가증권시장상장법인	763	산업용 기계 및 장비 임대업	12	2025-03-31	1분기보고서	KRW	ifrs-full_Assets	자산총계	1,669,024,533,027	1,619,112,721,909	1,500,000,000,000
```

### 출력 1: 개별 JSON (기본: 회사별 그룹화)

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

`--no-group` 옵션 사용 시:

```json
{ "data": [ { "회사명": "…", "항목명": "…", "당기 1분기말": 123, ... } ] }
```

### 출력 2: 통합 데이터베이스 (핵심 18개 항목 + 전년 3개 항목)

- 손익계산서: 매출액, 영업이익, 당기순이익 (+ 전년 동기값 3개)
- 재무상태표: 자산총계, 유동자산, 비유동자산, 부채총계, 유동부채, 비유동부채, 자본총계, 현금및현금성자산, 매출채권, 재고자산, 단기차입금, 장기차입금

연결 재무제표 우선, 동일 우선순위에서는 절대값이 큰 값을 채택하여 항목별 대표값을 구성합니다.

## 🔧 주요 스크립트

### txt-to-json-converter.js

- UTF-8 기준 읽기(필요 시 `convert-encoding.js`로 사전 변환)
- 탭 분리 파싱, 숫자 정규화, 행/열 불일치 보정, 회사별 그룹화 지원(`--no-group`)

### convert-all.js

- `src/data/raw/*`의 4개 카테고리(재무상태표/손익계산서/현금흐름표/자본변동표)를 순회하며 일괄 변환

### build-database.js

- `src/data/processed/*/*.json` 병합 → `src/data/financial-database.json` 및 `src/data/company-index.json` 생성
- 회사 기본정보/핵심 재무 18개 항목만 정제하여 저장, 메타데이터 포함

### convert-encoding.js (선택)

- `src/data/raw` 하위를 재귀 순회하며 EUC-KR → UTF-8로 인코딩 변환

### extract-company.js / check-items.js (선택)

- 예시/진단용 스크립트입니다. 대상 파일명은 필요에 따라 수정하여 사용하세요.

## 📈 로그 예시

```
🔄 최적화된 재무데이터베이스 구축 시작...
📁 재무상태표: 6개 파일
📁 손익계산서: 10개 파일
...
📁 총 발견된 JSON 파일: 20개

📊 통계:
  - 처리된 파일: 20/20
  - 총 회사 수: 2,847
  - 총 데이터 항목: 3,128

✅ 데이터베이스 저장 완료: src/data/financial-database.json
✅ 검색 인덱스 저장 완료: src/data/company-index.json
📦 데이터베이스 크기: 15.23 MB
```

## 🗑️ 정리 가이드

- `src/data/raw/*.txt` — 원본(백업 권장)
- `src/data/processed/*/*.json` — 통합 DB 생성 후 선택적으로 정리 가능

## ⚙️ 요구사항

- Node.js 16+ 권장
- 의존성: `decimal.js`, `iconv-lite`

## ❗ 주의사항

1. 인코딩: 원본이 EUC-KR/CP949라면 먼저 UTF-8로 변환하세요(`convert-encoding.js`).
2. 메모리: 대용량 파일 처리 시 충분한 메모리를 확보하세요.
3. 중복/대표값: `build-database.js`가 연결 재무제표 우선 규칙으로 대표값을 선택합니다.
4. 백업: 원본 TXT는 별도 보관을 권장합니다.
