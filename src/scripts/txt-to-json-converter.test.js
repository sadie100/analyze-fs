import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  cleanNumericValue,
  parseFinancialData,
  groupByCompany,
} from './txt-to-json-converter.js'

describe('재무제표 데이터 변환 테스트', () => {
  test('숫자 데이터 정제 테스트', () => {
    expect(cleanNumericValue('1,234,567')).toBe(1234567)
    expect(cleanNumericValue('-1,234,567')).toBe(-1234567)
    expect(cleanNumericValue('0')).toBe(0)
    expect(cleanNumericValue('')).toBeNull()
    expect(cleanNumericValue('-')).toBeNull()
    expect(cleanNumericValue(null)).toBeNull()
  })

  test('스트라드비젼 재무상태표 데이터 변환 테스트', () => {
    const content = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/data/raw/재무상태표/2025_1분기보고서_01_재무상태표_20250606.txt'
      ),
      'utf8'
    )
    const data = parseFinancialData(content, '재무상태표')

    // 스트라드비젼 데이터 찾기
    const stradData = data.find((item) => item.회사명 === '스트라드비젼')
    expect(stradData).toBeDefined()

    // 주요 재무 항목 검증
    expect(stradData.항목코드).toBe('ifrs-full_Assets')
    expect(stradData.항목명).toBe('자산총계')
    expect(stradData['당기 1분기말']).toBe(47742007319)
    expect(stradData['전기말']).toBe(47688449382)
  })

  test('스트라드비젼 포괄손익계산서 데이터 변환 테스트', () => {
    const content = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/data/raw/손익계산서/2025_1분기보고서_03_포괄손익계산서_20250606.txt'
      ),
      'utf8'
    )
    const data = parseFinancialData(content, '손익계산서')

    // 스트라드비젼 데이터 찾기
    const stradData = data.find((item) => item.회사명 === '스트라드비젼')
    expect(stradData).toBeDefined()

    // 주요 손익 항목 검증
    const revenueData = data.find(
      (item) =>
        item.회사명 === '스트라드비젼' && item.항목코드 === 'ifrs-full_Revenue'
    )
    expect(revenueData).toBeDefined()
    expect(revenueData.항목명).toBe('수익(매출액)')
    expect(revenueData['당기 1분기 누적']).toBeGreaterThan(0)

    // 당기순이익 검증
    const netIncomeData = data.find(
      (item) =>
        item.회사명 === '스트라드비젼' &&
        item.항목코드 === 'ifrs-full_ProfitLoss'
    )
    expect(netIncomeData).toBeDefined()
    expect(netIncomeData.항목명).toBe('당기순이익(손실)')
  })

  test('스트라드비젼 현금흐름표 데이터 변환 테스트', () => {
    const content = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/data/raw/현금흐름표/2025_1분기보고서_04_현금흐름표_20250606.txt'
      ),
      'utf8'
    )
    const data = parseFinancialData(content, '현금흐름표')

    // 스트라드비젼 데이터 찾기
    const stradData = data.find((item) => item.회사명 === '스트라드비젼')
    expect(stradData).toBeDefined()

    // 현금흐름 항목 검증
    const cashFlowData = data.find(
      (item) =>
        item.회사명 === '스트라드비젼' &&
        item.항목코드 === 'ifrs-full_CashFlowsFromUsedInOperatingActivities'
    )
    expect(cashFlowData).toBeDefined()
    expect(cashFlowData.항목명).toBe('영업활동현금흐름')
  })

  test('회사별 그룹화 테스트', () => {
    const content = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/data/raw/재무상태표/2025_1분기보고서_01_재무상태표_20250606.txt'
      ),
      'utf8'
    )
    const data = parseFinancialData(content, '재무상태표')
    const companies = groupByCompany(data)

    // 스트라드비젼 회사 데이터 찾기
    const stradCompany = companies.find(
      (company) => company.회사명 === '스트라드비젼'
    )
    expect(stradCompany).toBeDefined()
    expect(stradCompany.업종명).toBe('소프트웨어 개발 및 공급업')
    expect(stradCompany.재무데이터).toBeInstanceOf(Array)
    expect(stradCompany.재무데이터.length).toBeGreaterThan(0)
  })
})
