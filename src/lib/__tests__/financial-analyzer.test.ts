import { describe, expect, test } from 'vitest'
import { analyzeCompany } from '../financial-analyzer'
import type { CompanyData, ExtractedFinancialData } from '../financial-analyzer'
import Decimal from 'decimal.js'

describe('재무제표 분석 테스트', () => {
  const mockFinancialData: ExtractedFinancialData = {
    매출액: 1000000,
    영업이익: 100000,
    당기순이익: 80000,
    자산총계: 2000000,
    유동자산: 800000,
    비유동자산: 1200000,
    부채총계: 1000000,
    유동부채: 400000,
    비유동부채: 600000,
    자본총계: 1000000,
    현금및현금성자산: 300000,
    매출채권: 200000,
    재고자산: 100000,
    단기차입금: 200000,
    장기차입금: 300000,
    전년매출액: 900000,
    전년영업이익: 90000,
    전년당기순이익: 70000,
  }

  const mockCompanyData: CompanyData = {
    basicInfo: {
      종목코드: '000000',
      시장구분: 'KOSPI',
      업종: '제조업',
      업종명: '제조',
      결산월: '12',
      결산기준일: '2023-12-31',
      보고서종류: '분기보고서',
      통화: 'KRW',
    },
    financialData: mockFinancialData,
  }

  test('수익성 비율 계산 정확도 테스트', () => {
    const result = analyzeCompany('테스트기업', mockCompanyData)
    const { ratios } = result

    // 영업이익률 = (영업이익 / 매출액) * 100
    const expectedOperatingMargin = new Decimal(100000)
      .dividedBy(new Decimal(1000000))
      .times(100)
      .toNumber()
    expect(ratios.수익성.영업이익률).toBe(expectedOperatingMargin)

    // 순이익률 = (당기순이익 / 매출액) * 100
    const expectedNetMargin = new Decimal(80000)
      .dividedBy(new Decimal(1000000))
      .times(100)
      .toNumber()
    expect(ratios.수익성.순이익률).toBe(expectedNetMargin)

    // ROA = (당기순이익 / 자산총계) * 100
    const expectedROA = new Decimal(80000)
      .dividedBy(new Decimal(2000000))
      .times(100)
      .toNumber()
    expect(ratios.수익성.ROA).toBe(expectedROA)

    // ROE = (당기순이익 / 자본총계) * 100
    const expectedROE = new Decimal(80000)
      .dividedBy(new Decimal(1000000))
      .times(100)
      .toNumber()
    expect(ratios.수익성.ROE).toBe(expectedROE)
  })

  test('안정성 비율 계산 정확도 테스트', () => {
    const result = analyzeCompany('테스트기업', mockCompanyData)
    const { ratios } = result

    // 부채비율 = (부채총계 / 자본총계) * 100
    const expectedDebtRatio = new Decimal(1000000)
      .dividedBy(new Decimal(1000000))
      .times(100)
      .toNumber()
    expect(ratios.안정성.부채비율).toBe(expectedDebtRatio)

    // 유동비율 = (유동자산 / 유동부채) * 100
    const expectedCurrentRatio = new Decimal(800000)
      .dividedBy(new Decimal(400000))
      .times(100)
      .toNumber()
    expect(ratios.안정성.유동비율).toBe(expectedCurrentRatio)

    // 자기자본비율 = (자본총계 / 자산총계) * 100
    const expectedEquityRatio = new Decimal(1000000)
      .dividedBy(new Decimal(2000000))
      .times(100)
      .toNumber()
    expect(ratios.안정성.자기자본비율).toBe(expectedEquityRatio)
  })

  test('성장성 비율 계산 정확도 테스트', () => {
    const result = analyzeCompany('테스트기업', mockCompanyData)
    const { ratios } = result

    // 매출액증가율 = ((당기매출액 - 전기매출액) / 전기매출액) * 100
    const expectedRevenueGrowth = new Decimal(1000000)
      .minus(new Decimal(900000))
      .dividedBy(new Decimal(900000))
      .times(100)
      .toNumber()
    expect(ratios.성장성.매출액증가율).toBe(expectedRevenueGrowth)

    // 영업이익증가율 = ((당기영업이익 - 전기영업이익) / 전기영업이익) * 100
    const expectedOperatingProfitGrowth = new Decimal(100000)
      .minus(new Decimal(90000))
      .dividedBy(new Decimal(90000))
      .times(100)
      .toNumber()
    expect(ratios.성장성.영업이익증가율).toBe(expectedOperatingProfitGrowth)
  })

  test('활동성 비율 계산 정확도 테스트', () => {
    const result = analyzeCompany('테스트기업', mockCompanyData)
    const { ratios } = result

    // 총자산회전율 = 매출액 / 자산총계
    const expectedAssetTurnover = new Decimal(1000000)
      .dividedBy(new Decimal(2000000))
      .toNumber()
    expect(ratios.활동성.총자산회전율).toBe(expectedAssetTurnover)

    // 재고자산회전율 = 매출액 / 재고자산
    const expectedInventoryTurnover = new Decimal(1000000)
      .dividedBy(new Decimal(100000))
      .toNumber()
    expect(ratios.활동성.재고자산회전율).toBe(expectedInventoryTurnover)
  })

  test('엣지 케이스 테스트', () => {
    const edgeCaseData: ExtractedFinancialData = {
      ...mockFinancialData,
      매출액: 0.1, // 매우 작은 수
      영업이익: 0.02,
      당기순이익: 0.015,
      자산총계: 999999999999.99, // 매우 큰 수
      재고자산: 0.001, // 매우 작은 수
    }

    const edgeCaseCompanyData: CompanyData = {
      ...mockCompanyData,
      financialData: edgeCaseData,
    }

    const result = analyzeCompany('엣지케이스기업', edgeCaseCompanyData)
    const { ratios } = result

    // 매우 작은 수로 나누는 경우도 정확하게 계산되어야 함
    expect(ratios.활동성.재고자산회전율).toBe(
      new Decimal(0.1).dividedBy(new Decimal(0.001)).toNumber()
    )

    // 매우 큰 수로 나누는 경우도 정확하게 계산되어야 함
    expect(ratios.수익성.ROA).toBe(
      new Decimal(0.015)
        .dividedBy(new Decimal(999999999999.99))
        .times(100)
        .toNumber()
    )
  })

  test('null 값 처리 테스트', () => {
    const nullData: ExtractedFinancialData = {
      매출액: null,
      영업이익: null,
      당기순이익: null,
      자산총계: null,
      유동자산: null,
      비유동자산: null,
      부채총계: null,
      유동부채: null,
      비유동부채: null,
      자본총계: null,
      현금및현금성자산: null,
      매출채권: null,
      재고자산: null,
      단기차입금: null,
      장기차입금: null,
      전년매출액: null,
      전년영업이익: null,
      전년당기순이익: null,
    }

    const nullCompanyData: CompanyData = {
      ...mockCompanyData,
      financialData: nullData,
    }

    const result = analyzeCompany('테스트기업', nullCompanyData)
    const { ratios } = result

    // 모든 비율이 null이어야 함
    expect(ratios.수익성.영업이익률).toBeNull()
    expect(ratios.수익성.순이익률).toBeNull()
    expect(ratios.수익성.ROA).toBeNull()
    expect(ratios.수익성.ROE).toBeNull()
    expect(ratios.안정성.부채비율).toBeNull()
    expect(ratios.안정성.유동비율).toBeNull()
    expect(ratios.안정성.자기자본비율).toBeNull()
    expect(ratios.성장성.매출액증가율).toBeNull()
    expect(ratios.성장성.영업이익증가율).toBeNull()
    expect(ratios.활동성.총자산회전율).toBeNull()
    expect(ratios.활동성.재고자산회전율).toBeNull()
  })
})
