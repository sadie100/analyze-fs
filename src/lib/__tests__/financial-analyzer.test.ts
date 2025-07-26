import { describe, expect, it } from 'vitest'
import {
  calculateFinancialRatios,
  evaluateCompany,
  generateRecommendations,
} from '../financial-analyzer'
import type {
  ExtractedFinancialData,
  FinancialRatios,
} from '../financial-analyzer'
import Decimal from 'decimal.js'

describe('financial-analyzer helpers', () => {
  const mockFinancialData: ExtractedFinancialData = {
    매출액: 1_000_000,
    영업이익: 100_000,
    당기순이익: 80_000,
    자산총계: 2_000_000,
    유동자산: 800_000,
    비유동자산: 1_200_000,
    부채총계: 1_000_000,
    유동부채: 400_000,
    비유동부채: 600_000,
    자본총계: 1_000_000,
    현금및현금성자산: 300_000,
    매출채권: 200_000,
    재고자산: 100_000,
    단기차입금: 200_000,
    장기차입금: 300_000,
    전년매출액: 900_000,
    전년영업이익: 90_000,
    전년당기순이익: 70_000,
  }

  describe('calculateFinancialRatios()', () => {
    const ratios: FinancialRatios = calculateFinancialRatios(mockFinancialData)

    it('should correctly compute profitability ratios', () => {
      // 영업이익률 = (영업이익 / 매출액) * 100 → 10
      const expectedOperatingMargin = new Decimal(100_000)
        .dividedBy(new Decimal(1_000_000))
        .times(100)
        .toNumber()
      expect(ratios.수익성.영업이익률).toBeCloseTo(expectedOperatingMargin)

      // 순이익률 = (당기순이익 / 매출액) * 100 → 8
      const expectedNetMargin = new Decimal(80_000)
        .dividedBy(new Decimal(1_000_000))
        .times(100)
        .toNumber()
      expect(ratios.수익성.순이익률).toBeCloseTo(expectedNetMargin)

      // ROE = (당기순이익 / 자본총계) * 100 → 8
      const expectedROE = new Decimal(80_000)
        .dividedBy(new Decimal(1_000_000))
        .times(100)
        .toNumber()
      expect(ratios.수익성.ROE).toBeCloseTo(expectedROE)
    })

    it('should correctly compute stability ratios', () => {
      // 부채비율 = (부채총계 / 자본총계) * 100 → 100
      const expectedDebtRatio = new Decimal(1_000_000)
        .dividedBy(new Decimal(1_000_000))
        .times(100)
        .toNumber()
      expect(ratios.안정성.부채비율).toBeCloseTo(expectedDebtRatio)

      // 유동비율 = (유동자산 / 유동부채) * 100 → 200
      const expectedCurrentRatio = new Decimal(800_000)
        .dividedBy(new Decimal(400_000))
        .times(100)
        .toNumber()
      expect(ratios.안정성.유동비율).toBeCloseTo(expectedCurrentRatio)
    })

    it('should correctly compute growth ratios', () => {
      // 매출액증가율 ≈ 11.11
      const expectedRevenueGrowth = new Decimal(1_000_000)
        .minus(new Decimal(900_000))
        .dividedBy(new Decimal(900_000))
        .times(100)
        .toNumber()
      expect(ratios.성장성.매출액증가율).toBeCloseTo(expectedRevenueGrowth)
    })
  })

  describe('evaluateCompany()', () => {
    const ratios = calculateFinancialRatios(mockFinancialData)
    const evaluation = evaluateCompany(ratios)

    it('should calculate category scores and total score correctly', () => {
      expect(evaluation.수익성점수).toBe(70)
      expect(evaluation.안정성점수).toBe(80)
      expect(evaluation.성장성점수).toBe(70)
      expect(evaluation.활동성점수).toBe(60)
      expect(evaluation.총점).toBe(72)
    })

    it('should assign the correct grade and status', () => {
      expect(evaluation.등급).toBe('B')
      expect(evaluation.상태).toBe('양호')
    })
  })

  describe('generateRecommendations()', () => {
    const ratios = calculateFinancialRatios(mockFinancialData)
    const evaluation = evaluateCompany(ratios)
    const recommendations = generateRecommendations(ratios, evaluation)

    it('should recommend based on strong stability', () => {
      expect(recommendations).toContain(
        '🛡️ 안정적인 재무구조를 갖고 있습니다. 적극적인 투자 기회를 모색해볼 수 있습니다.'
      )
    })

    it('should not include profitability or growth warnings when not applicable', () => {
      expect(recommendations).not.toContain(
        '💡 수익성 개선이 필요합니다. 매출 증대와 비용 절감을 통한 영업이익률 향상을 검토해보세요.'
      )
      expect(recommendations.some((r) => r.startsWith('📈'))).toBe(false)
    })
  })
})
