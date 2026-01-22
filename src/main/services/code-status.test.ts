/**
 * 状態判定ロジックのテスト
 * 要件定義書 第五章に基づく
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  determineCodeStatus,
  attachStatus,
  attachStatusToAll,
  filterByStatus,
  getActiveCodes,
  getUnusedCodes,
  getConsumedCodes,
  getExpiredCodes,
  isCodeUsable,
  isCodeFinished
} from './code-status'
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
    ...overrides
  }
}

describe('determineCodeStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('未使用（unused）', () => {
    it('使用開始日時が未設定かつ、現在時刻がコード入力期限以前の場合は未使用', () => {
      // 現在時刻: 2026年1月15日
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      const code = createTestCode({
        inputDeadline: '2026-06-20T23:59:59.000Z',
        startedAt: null,
        expiresAt: null
      })

      expect(determineCodeStatus(code)).toBe('unused')
    })

    it('コード入力期限と同一時刻の場合も未使用', () => {
      vi.setSystemTime(new Date('2026-06-20T23:59:59.000Z'))

      const code = createTestCode({
        inputDeadline: '2026-06-20T23:59:59.000Z',
        startedAt: null,
        expiresAt: null
      })

      expect(determineCodeStatus(code)).toBe('unused')
    })
  })

  describe('使用中（active）', () => {
    it('使用開始日時が設定されており、現在時刻が有効期限以前の場合は使用中', () => {
      // 現在時刻: 2026年1月16日
      vi.setSystemTime(new Date('2026-01-16T12:00:00.000Z'))

      const code = createTestCode({
        startedAt: '2026-01-15T12:00:00.000Z',
        expiresAt: '2026-01-22T12:00:00.000Z' // 7日後
      })

      expect(determineCodeStatus(code)).toBe('active')
    })

    it('有効期限と同一時刻の場合も使用中', () => {
      vi.setSystemTime(new Date('2026-01-22T12:00:00.000Z'))

      const code = createTestCode({
        startedAt: '2026-01-15T12:00:00.000Z',
        expiresAt: '2026-01-22T12:00:00.000Z'
      })

      expect(determineCodeStatus(code)).toBe('active')
    })

    it('コード入力期限を過ぎていても、使用開始済みなら使用中（期限切れではない）', () => {
      // コード入力期限を過ぎた後でも使用中として扱う
      vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))

      const code = createTestCode({
        inputDeadline: '2026-06-20T23:59:59.000Z', // 過去
        startedAt: '2026-06-15T12:00:00.000Z',
        expiresAt: '2026-07-15T12:00:00.000Z' // まだ有効
      })

      expect(determineCodeStatus(code)).toBe('active')
    })
  })

  describe('消費済み（consumed）', () => {
    it('使用開始日時が設定されており、現在時刻が有効期限を過ぎている場合は消費済み', () => {
      // 現在時刻: 2026年1月30日（有効期限の後）
      vi.setSystemTime(new Date('2026-01-30T12:00:00.000Z'))

      const code = createTestCode({
        startedAt: '2026-01-15T12:00:00.000Z',
        expiresAt: '2026-01-22T12:00:00.000Z' // 7日後
      })

      expect(determineCodeStatus(code)).toBe('consumed')
    })

    it('有効期限の1秒後は消費済み', () => {
      vi.setSystemTime(new Date('2026-01-22T12:00:00.001Z'))

      const code = createTestCode({
        startedAt: '2026-01-15T12:00:00.000Z',
        expiresAt: '2026-01-22T12:00:00.000Z'
      })

      expect(determineCodeStatus(code)).toBe('consumed')
    })
  })

  describe('期限切れ（expired）', () => {
    it('使用開始日時が未設定のまま、現在時刻がコード入力期限を過ぎている場合は期限切れ', () => {
      // 現在時刻: 2026年7月1日（コード入力期限の後）
      vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))

      const code = createTestCode({
        inputDeadline: '2026-06-20T23:59:59.000Z',
        startedAt: null,
        expiresAt: null
      })

      expect(determineCodeStatus(code)).toBe('expired')
    })

    it('コード入力期限の1秒後は期限切れ', () => {
      vi.setSystemTime(new Date('2026-06-20T23:59:59.001Z'))

      const code = createTestCode({
        inputDeadline: '2026-06-20T23:59:59.000Z',
        startedAt: null,
        expiresAt: null
      })

      expect(determineCodeStatus(code)).toBe('expired')
    })
  })

  describe('nowパラメータによる時刻指定', () => {
    it('nowパラメータで任意の時刻を指定できる', () => {
      const code = createTestCode({
        inputDeadline: '2026-06-20T23:59:59.000Z',
        startedAt: null,
        expiresAt: null
      })

      // 期限前
      expect(determineCodeStatus(code, new Date('2026-01-15T12:00:00.000Z'))).toBe('unused')

      // 期限後
      expect(determineCodeStatus(code, new Date('2026-07-01T12:00:00.000Z'))).toBe('expired')
    })
  })
})

describe('attachStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('コードに状態を付与する', () => {
    const code = createTestCode()
    const result = attachStatus(code)

    expect(result).toEqual({
      ...code,
      status: 'unused'
    })
  })
})

describe('attachStatusToAll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-20T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('複数のコードに状態を付与する', () => {
    const codes: PromoCode[] = [
      createTestCode({ id: '1', startedAt: null, expiresAt: null }), // unused
      createTestCode({
        id: '2',
        startedAt: '2026-01-15T12:00:00.000Z',
        expiresAt: '2026-01-22T12:00:00.000Z'
      }), // active
      createTestCode({
        id: '3',
        startedAt: '2026-01-01T12:00:00.000Z',
        expiresAt: '2026-01-08T12:00:00.000Z'
      }) // consumed
    ]

    const result = attachStatusToAll(codes)

    expect(result).toHaveLength(3)
    expect(result[0]?.status).toBe('unused')
    expect(result[1]?.status).toBe('active')
    expect(result[2]?.status).toBe('consumed')
  })
})

describe('filterByStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-20T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('特定の状態のコードのみをフィルタリングする', () => {
    const codes: PromoCode[] = [
      createTestCode({ id: '1', startedAt: null, expiresAt: null }), // unused
      createTestCode({ id: '2', startedAt: null, expiresAt: null }), // unused
      createTestCode({
        id: '3',
        startedAt: '2026-01-15T12:00:00.000Z',
        expiresAt: '2026-01-22T12:00:00.000Z'
      }) // active
    ]

    const unusedCodes = filterByStatus(codes, 'unused')
    const activeCodes = filterByStatus(codes, 'active')

    expect(unusedCodes).toHaveLength(2)
    expect(activeCodes).toHaveLength(1)
  })
})

describe('getActiveCodes / getUnusedCodes / getConsumedCodes / getExpiredCodes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('各状態のコードを取得する', () => {
    const codes: PromoCode[] = [
      // unused: 入力期限が未来
      createTestCode({
        id: '1',
        inputDeadline: '2026-12-31T23:59:59.000Z',
        startedAt: null,
        expiresAt: null
      }),
      // active: 使用中
      createTestCode({
        id: '2',
        startedAt: '2026-06-25T12:00:00.000Z',
        expiresAt: '2026-07-02T12:00:00.000Z'
      }),
      // consumed: 使用済み
      createTestCode({
        id: '3',
        startedAt: '2026-06-01T12:00:00.000Z',
        expiresAt: '2026-06-08T12:00:00.000Z'
      }),
      // expired: 入力期限切れ
      createTestCode({
        id: '4',
        inputDeadline: '2026-06-20T23:59:59.000Z',
        startedAt: null,
        expiresAt: null
      })
    ]

    expect(getUnusedCodes(codes)).toHaveLength(1)
    expect(getActiveCodes(codes)).toHaveLength(1)
    expect(getConsumedCodes(codes)).toHaveLength(1)
    expect(getExpiredCodes(codes)).toHaveLength(1)

    expect(getUnusedCodes(codes)[0]?.id).toBe('1')
    expect(getActiveCodes(codes)[0]?.id).toBe('2')
    expect(getConsumedCodes(codes)[0]?.id).toBe('3')
    expect(getExpiredCodes(codes)[0]?.id).toBe('4')
  })
})

describe('isCodeUsable / isCodeFinished', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-20T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('isCodeUsableは未使用または使用中の場合にtrueを返す', () => {
    const unusedCode = createTestCode({ startedAt: null, expiresAt: null })
    const activeCode = createTestCode({
      startedAt: '2026-01-15T12:00:00.000Z',
      expiresAt: '2026-01-22T12:00:00.000Z'
    })
    const consumedCode = createTestCode({
      startedAt: '2026-01-01T12:00:00.000Z',
      expiresAt: '2026-01-08T12:00:00.000Z'
    })

    expect(isCodeUsable(unusedCode)).toBe(true)
    expect(isCodeUsable(activeCode)).toBe(true)
    expect(isCodeUsable(consumedCode)).toBe(false)
  })

  it('isCodeFinishedは消費済みまたは期限切れの場合にtrueを返す', () => {
    const unusedCode = createTestCode({ startedAt: null, expiresAt: null })
    const consumedCode = createTestCode({
      startedAt: '2026-01-01T12:00:00.000Z',
      expiresAt: '2026-01-08T12:00:00.000Z'
    })

    expect(isCodeFinished(unusedCode)).toBe(false)
    expect(isCodeFinished(consumedCode)).toBe(true)
  })
})
