/**
 * 連続カバレッジ計算ロジックのテスト
 * 要件定義書 第七章に基づく
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateCoverage, formatRemainingTime, formatCoverageEndAt } from './coverage'
import type { PromoCode } from '@types/code'

/**
 * テスト用のプロモコードを作成するヘルパー
 */
function createTestCode(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: 'test-uuid-1234',
    order: 1,
    code: 'TESTCODE123',
    inputDeadline: '2026-06-20T23:59:59.000Z',
    validityDurationMinutes: 10080, // 7日間
    validityEndAt: null,
    startedAt: null,
    expiresAt: null,
    maxUseCount: 1,
    useCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('calculateCoverage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('カバレッジなし', () => {
    it('コードがない場合はカバレッジなし', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const result = calculateCoverage([])

      expect(result).toEqual({
        hasCoverage: false,
        coverageEndAt: null,
        remainingMinutes: null,
        hasGap: false,
        gapStartAt: null
      })
    })

    it('使用中のコードがない場合はカバレッジなし', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({ id: '1', startedAt: null, expiresAt: null }) // 未使用
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(false)
    })

    it('現在時刻を含む区間がない場合はカバレッジなし', () => {
      vi.setSystemTime(new Date('2026-01-30T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-01T12:00:00.000Z',
          expiresAt: '2026-01-08T12:00:00.000Z' // すでに終了
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(false)
    })
  })

  describe('単一コードのカバレッジ', () => {
    it('現在時刻を含む使用中コードがあればカバレッジあり', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z'
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(true)
      expect(result.coverageEndAt).toBe('2026-01-17T12:00:00.000Z')
      expect(result.remainingMinutes).toBe(2 * 24 * 60) // 2日 = 2880分
      expect(result.hasGap).toBe(false)
    })

    it('残り時間が正確に計算される', () => {
      // 有効期限の30分前
      vi.setSystemTime(new Date('2026-01-17T11:30:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z'
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.remainingMinutes).toBe(30)
    })
  })

  describe('複数コードのカバレッジ連結', () => {
    it('区間の終端と次区間の開始が同一時刻の場合は連続とみなす', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z'
        }),
        createTestCode({
          id: '2',
          startedAt: '2026-01-17T12:00:00.000Z', // 前の終端と同一
          expiresAt: '2026-01-24T12:00:00.000Z'
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(true)
      expect(result.coverageEndAt).toBe('2026-01-24T12:00:00.000Z') // 連結後の終端
      expect(result.hasGap).toBe(false)
    })

    it('区間同士が重なる場合も連続とみなす', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z'
        }),
        createTestCode({
          id: '2',
          startedAt: '2026-01-16T12:00:00.000Z', // 重なっている
          expiresAt: '2026-01-23T12:00:00.000Z'
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(true)
      expect(result.coverageEndAt).toBe('2026-01-23T12:00:00.000Z')
      expect(result.hasGap).toBe(false)
    })

    it('3つ以上のコードが連結される場合', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z'
        }),
        createTestCode({
          id: '2',
          startedAt: '2026-01-17T12:00:00.000Z',
          expiresAt: '2026-01-24T12:00:00.000Z'
        }),
        createTestCode({
          id: '3',
          startedAt: '2026-01-24T12:00:00.000Z',
          expiresAt: '2026-01-31T12:00:00.000Z'
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(true)
      expect(result.coverageEndAt).toBe('2026-01-31T12:00:00.000Z')
      expect(result.hasGap).toBe(false)
    })

    it('並列で使用中のコードがある場合も正しく計算される', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      // 同時に使用中（第六章: 複数コードが同時並行に使用中となる可能性を許容）
      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z'
        }),
        createTestCode({
          id: '2',
          startedAt: '2026-01-14T12:00:00.000Z',
          expiresAt: '2026-01-21T12:00:00.000Z'
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(true)
      expect(result.coverageEndAt).toBe('2026-01-21T12:00:00.000Z') // より長い方
      expect(result.hasGap).toBe(false)
    })
  })

  describe('ギャップの検出', () => {
    it('区間の終端と次区間の開始時刻が離れている場合はギャップあり', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z'
        }),
        createTestCode({
          id: '2',
          startedAt: '2026-01-20T12:00:00.000Z', // 3日のギャップ
          expiresAt: '2026-01-27T12:00:00.000Z'
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(true)
      expect(result.coverageEndAt).toBe('2026-01-17T12:00:00.000Z') // ギャップ前まで
      expect(result.hasGap).toBe(true)
      expect(result.gapStartAt).toBe('2026-01-17T12:00:00.000Z')
    })
  })

  describe('エッジケース', () => {
    it('現在時刻と有効期限が同一の場合はまだ使用中', () => {
      vi.setSystemTime(new Date('2026-01-17T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z'
        })
      ]

      const result = calculateCoverage(codes)

      expect(result.hasCoverage).toBe(true)
      expect(result.remainingMinutes).toBe(0)
    })
  })
})

describe('formatRemainingTime', () => {
  it('nullの場合は「カバレッジなし」を返す', () => {
    expect(formatRemainingTime(null)).toBe('カバレッジなし')
  })

  it('0以下の場合は「終了」を返す', () => {
    expect(formatRemainingTime(0)).toBe('終了')
    expect(formatRemainingTime(-10)).toBe('終了')
  })

  it('分単位で表示される', () => {
    expect(formatRemainingTime(30)).toBe('30分')
  })

  it('時間単位で表示される', () => {
    expect(formatRemainingTime(60)).toBe('1時間')
    expect(formatRemainingTime(90)).toBe('1時間30分')
  })

  it('日単位で表示される', () => {
    expect(formatRemainingTime(1440)).toBe('1日') // 24 * 60
    expect(formatRemainingTime(1500)).toBe('1日1時間') // 24 * 60 + 60
    expect(formatRemainingTime(10080)).toBe('7日') // 7 * 24 * 60
  })

  it('複合的な時間表示', () => {
    // 2日3時間45分
    expect(formatRemainingTime(2 * 24 * 60 + 3 * 60 + 45)).toBe('2日3時間45分')
  })
})

describe('formatCoverageEndAt', () => {
  it('nullの場合は「カバレッジなし」を返す', () => {
    expect(formatCoverageEndAt(null)).toBe('カバレッジなし')
  })

  it('ISO 8601形式の日時を日本語フォーマットに変換する', () => {
    const result = formatCoverageEndAt('2026-01-17T12:00:00.000Z')

    // タイムゾーンの影響を受けるため、含まれるべき要素を確認
    expect(result).toMatch(/2026/)
    expect(result).toMatch(/1月/)
    expect(result).toMatch(/17日/)
  })
})
