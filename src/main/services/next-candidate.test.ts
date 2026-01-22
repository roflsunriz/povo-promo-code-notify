/**
 * 次に開始すべきコード候補ロジックのテスト
 * 要件定義書 第八章に基づく
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getNextCandidate, getUnusedCodesSorted, getNextCandidateSummary } from './next-candidate'
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
    startedAt: null,
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getNextCandidate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('候補なし', () => {
    it('コードがない場合は候補なし', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const result = getNextCandidate([])

      expect(result).toEqual({
        hasCandidate: false,
        candidate: null,
      })
    })

    it('すべてのコードが使用中の場合は候補なし', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-10T12:00:00.000Z',
          expiresAt: '2026-01-17T12:00:00.000Z',
        }),
      ]

      const result = getNextCandidate(codes)

      expect(result.hasCandidate).toBe(false)
    })

    it('すべてのコードが期限切れの場合は候補なし', () => {
      vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          inputDeadline: '2026-06-20T23:59:59.000Z',
          startedAt: null,
          expiresAt: null,
        }),
      ]

      const result = getNextCandidate(codes)

      expect(result.hasCandidate).toBe(false)
    })

    it('すべてのコードが消費済みの場合は候補なし', () => {
      vi.setSystemTime(new Date('2026-01-30T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          startedAt: '2026-01-01T12:00:00.000Z',
          expiresAt: '2026-01-08T12:00:00.000Z',
        }),
      ]

      const result = getNextCandidate(codes)

      expect(result.hasCandidate).toBe(false)
    })
  })

  describe('候補あり', () => {
    it('未使用コードがあれば候補として返す', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '1',
          order: 1,
          code: 'CODE001',
          startedAt: null,
          expiresAt: null,
        }),
      ]

      const result = getNextCandidate(codes)

      expect(result.hasCandidate).toBe(true)
      expect(result.candidate?.code).toBe('CODE001')
    })

    it('複数の未使用コードがある場合は登録順序が最も早いものを返す', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: '3',
          order: 3,
          code: 'CODE003',
          startedAt: null,
          expiresAt: null,
        }),
        createTestCode({
          id: '1',
          order: 1,
          code: 'CODE001',
          startedAt: null,
          expiresAt: null,
        }),
        createTestCode({
          id: '2',
          order: 2,
          code: 'CODE002',
          startedAt: null,
          expiresAt: null,
        }),
      ]

      const result = getNextCandidate(codes)

      expect(result.hasCandidate).toBe(true)
      expect(result.candidate?.code).toBe('CODE001')
      expect(result.candidate?.order).toBe(1)
    })

    it('同順位の場合は内部IDの昇順で選ぶ', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const codes = [
        createTestCode({
          id: 'zzz-uuid',
          order: 1,
          code: 'CODE_Z',
          startedAt: null,
          expiresAt: null,
        }),
        createTestCode({
          id: 'aaa-uuid',
          order: 1, // 同じ順序
          code: 'CODE_A',
          startedAt: null,
          expiresAt: null,
        }),
      ]

      const result = getNextCandidate(codes)

      expect(result.hasCandidate).toBe(true)
      expect(result.candidate?.id).toBe('aaa-uuid')
      expect(result.candidate?.code).toBe('CODE_A')
    })

    it('使用中・消費済み・期限切れのコードは候補から除外される', () => {
      vi.setSystemTime(new Date('2026-01-20T12:00:00.000Z'))

      const codes = [
        // order: 1 → 使用中
        createTestCode({
          id: '1',
          order: 1,
          code: 'ACTIVE',
          startedAt: '2026-01-15T12:00:00.000Z',
          expiresAt: '2026-01-22T12:00:00.000Z',
        }),
        // order: 2 → 消費済み
        createTestCode({
          id: '2',
          order: 2,
          code: 'CONSUMED',
          startedAt: '2026-01-01T12:00:00.000Z',
          expiresAt: '2026-01-08T12:00:00.000Z',
        }),
        // order: 3 → 未使用（これが候補）
        createTestCode({
          id: '3',
          order: 3,
          code: 'UNUSED',
          startedAt: null,
          expiresAt: null,
        }),
      ]

      const result = getNextCandidate(codes)

      expect(result.hasCandidate).toBe(true)
      expect(result.candidate?.code).toBe('UNUSED')
      expect(result.candidate?.order).toBe(3)
    })
  })
})

describe('getUnusedCodesSorted', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('未使用コードを登録順序でソートして返す', () => {
    const codes = [
      createTestCode({
        id: '3',
        order: 3,
        code: 'CODE003',
        startedAt: null,
        expiresAt: null,
      }),
      createTestCode({
        id: '1',
        order: 1,
        code: 'CODE001',
        startedAt: null,
        expiresAt: null,
      }),
      createTestCode({
        id: '2',
        order: 2,
        code: 'CODE002',
        startedAt: null,
        expiresAt: null,
      }),
    ]

    const result = getUnusedCodesSorted(codes)

    expect(result).toHaveLength(3)
    expect(result[0]?.code).toBe('CODE001')
    expect(result[1]?.code).toBe('CODE002')
    expect(result[2]?.code).toBe('CODE003')
  })

  it('使用中・消費済みのコードは含まれない', () => {
    const codes = [
      createTestCode({
        id: '1',
        order: 1,
        startedAt: '2026-01-10T12:00:00.000Z',
        expiresAt: '2026-01-17T12:00:00.000Z',
      }), // 使用中
      createTestCode({ id: '2', order: 2, startedAt: null, expiresAt: null }), // 未使用
    ]

    const result = getUnusedCodesSorted(codes)

    expect(result).toHaveLength(1)
    expect(result[0]?.order).toBe(2)
  })
})

describe('getNextCandidateSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('候補がない場合のサマリー', () => {
    const result = getNextCandidateSummary([])

    expect(result).toEqual({
      hasCandidate: false,
      candidateCode: null,
      candidateOrder: null,
      remainingUnusedCount: 0,
    })
  })

  it('候補がある場合のサマリー', () => {
    const codes = [
      createTestCode({
        id: '1',
        order: 1,
        code: 'CODE001',
        startedAt: null,
        expiresAt: null,
      }),
      createTestCode({
        id: '2',
        order: 2,
        code: 'CODE002',
        startedAt: null,
        expiresAt: null,
      }),
      createTestCode({
        id: '3',
        order: 3,
        code: 'CODE003',
        startedAt: null,
        expiresAt: null,
      }),
    ]

    const result = getNextCandidateSummary(codes)

    expect(result).toEqual({
      hasCandidate: true,
      candidateCode: 'CODE001',
      candidateOrder: 1,
      remainingUnusedCount: 3,
    })
  })
})
