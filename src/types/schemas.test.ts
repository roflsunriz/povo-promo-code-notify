/**
 * Zodスキーマのテスト
 */

import { describe, it, expect } from 'vitest'
import {
  PromoCodeSchema,
  CreatePromoCodeInputSchema,
  UpdatePromoCodeInputSchema,
  NotificationSettingsSchema,
  StoreDataSchema,
  validatePromoCode,
  validateCreatePromoCodeInput,
  validateStoreData,
} from './schemas'

describe('PromoCodeSchema', () => {
  const validPromoCode = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    order: 1,
    code: 'UL1H97X3CKAR6',
    inputDeadline: '2026-06-20T23:59:59.000Z',
    validityDurationMinutes: 10080,
    startedAt: null,
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  it('有効なプロモコードを検証できる', () => {
    const result = PromoCodeSchema.safeParse(validPromoCode)
    expect(result.success).toBe(true)
  })

  it('使用中のプロモコードも検証できる', () => {
    const result = PromoCodeSchema.safeParse({
      ...validPromoCode,
      startedAt: '2026-01-15T12:00:00.000Z',
      expiresAt: '2026-01-22T12:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  describe('バリデーションエラー', () => {
    it('無効なUUIDは拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        id: 'invalid-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('空のコードは拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        code: '',
      })
      expect(result.success).toBe(false)
    })

    it('英数字以外を含むコードは拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        code: 'CODE-123!',
      })
      expect(result.success).toBe(false)
    })

    it('負の順序は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        order: -1,
      })
      expect(result.success).toBe(false)
    })

    it('0の順序は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        order: 0,
      })
      expect(result.success).toBe(false)
    })

    it('負の有効期間は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        validityDurationMinutes: -60,
      })
      expect(result.success).toBe(false)
    })

    it('無効な日時文字列は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        inputDeadline: 'invalid-date',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('CreatePromoCodeInputSchema', () => {
  it('有効な作成入力を検証できる', () => {
    const result = CreatePromoCodeInputSchema.safeParse({
      order: 1,
      code: 'TESTCODE123',
      inputDeadline: '2026-06-20T23:59:59.000Z',
      validityDurationMinutes: 10080,
    })
    expect(result.success).toBe(true)
  })

  it('必須フィールドが欠けている場合は拒否される', () => {
    const result = CreatePromoCodeInputSchema.safeParse({
      order: 1,
      code: 'TESTCODE123',
      // inputDeadlineが欠けている
      validityDurationMinutes: 10080,
    })
    expect(result.success).toBe(false)
  })
})

describe('UpdatePromoCodeInputSchema', () => {
  it('部分更新を検証できる', () => {
    const result = UpdatePromoCodeInputSchema.safeParse({
      order: 2,
    })
    expect(result.success).toBe(true)
  })

  it('空のオブジェクトも有効', () => {
    const result = UpdatePromoCodeInputSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('startedAtとexpiresAtをnullに設定できる', () => {
    const result = UpdatePromoCodeInputSchema.safeParse({
      startedAt: null,
      expiresAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('startedAtとexpiresAtを日時に設定できる', () => {
    const result = UpdatePromoCodeInputSchema.safeParse({
      startedAt: '2026-01-15T12:00:00.000Z',
      expiresAt: '2026-01-22T12:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })
})

describe('NotificationSettingsSchema', () => {
  it('有効な通知設定を検証できる', () => {
    const result = NotificationSettingsSchema.safeParse({
      expiryThresholdsMinutes: [1440, 180, 60, 30],
      inputDeadlineThresholdsMinutes: [],
    })
    expect(result.success).toBe(true)
  })

  it('空の閾値配列も有効', () => {
    const result = NotificationSettingsSchema.safeParse({
      expiryThresholdsMinutes: [],
      inputDeadlineThresholdsMinutes: [],
    })
    expect(result.success).toBe(true)
  })

  it('負の閾値は拒否される', () => {
    const result = NotificationSettingsSchema.safeParse({
      expiryThresholdsMinutes: [-1],
      inputDeadlineThresholdsMinutes: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('StoreDataSchema', () => {
  it('有効なストアデータを検証できる', () => {
    const result = StoreDataSchema.safeParse({
      version: 1,
      codes: [],
      notificationSettings: {
        expiryThresholdsMinutes: [1440, 180, 60, 30],
        inputDeadlineThresholdsMinutes: [],
      },
    })
    expect(result.success).toBe(true)
  })

  it('コードを含むストアデータを検証できる', () => {
    const result = StoreDataSchema.safeParse({
      version: 1,
      codes: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          order: 1,
          code: 'TESTCODE123',
          inputDeadline: '2026-06-20T23:59:59.000Z',
          validityDurationMinutes: 10080,
          startedAt: null,
          expiresAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      notificationSettings: {
        expiryThresholdsMinutes: [1440],
        inputDeadlineThresholdsMinutes: [],
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('ヘルパー関数', () => {
  describe('validatePromoCode', () => {
    it('有効なデータでsuccess: trueを返す', () => {
      const result = validatePromoCode({
        id: '550e8400-e29b-41d4-a716-446655440000',
        order: 1,
        code: 'TESTCODE123',
        inputDeadline: '2026-06-20T23:59:59.000Z',
        validityDurationMinutes: 10080,
        startedAt: null,
        expiresAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    it('無効なデータでsuccess: falseとerrorsを返す', () => {
      const result = validatePromoCode({
        id: 'invalid',
      })

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
    })
  })

  describe('validateCreatePromoCodeInput', () => {
    it('有効な入力を検証できる', () => {
      const result = validateCreatePromoCodeInput({
        order: 1,
        code: 'TESTCODE123',
        inputDeadline: '2026-06-20T23:59:59.000Z',
        validityDurationMinutes: 10080,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('validateStoreData', () => {
    it('有効なストアデータを検証できる', () => {
      const result = validateStoreData({
        version: 1,
        codes: [],
        notificationSettings: {
          expiryThresholdsMinutes: [],
          inputDeadlineThresholdsMinutes: [],
        },
      })

      expect(result.success).toBe(true)
    })
  })
})
