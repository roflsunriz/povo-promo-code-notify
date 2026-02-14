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
  validateUpdatePromoCodeInput,
  validateStoreData,
  validateExportData
} from './schemas'

describe('PromoCodeSchema', () => {
  const validPromoCode = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    order: 1,
    code: 'UL1H97X3CKAR6',
    inputDeadline: '2026-06-20T23:59:59.000Z',
    validityDurationMinutes: 10080,
    validityEndAt: null,
    startedAt: null,
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }

  it('有効なプロモコードを検証できる', () => {
    const result = PromoCodeSchema.safeParse(validPromoCode)
    expect(result.success).toBe(true)
  })

  it('使用中のプロモコードも検証できる', () => {
    const result = PromoCodeSchema.safeParse({
      ...validPromoCode,
      startedAt: '2026-01-15T12:00:00.000Z',
      expiresAt: '2026-01-22T12:00:00.000Z'
    })
    expect(result.success).toBe(true)
  })

  describe('バリデーションエラー', () => {
    it('無効なUUIDは拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        id: 'invalid-uuid'
      })
      expect(result.success).toBe(false)
    })

    it('空のコードは拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        code: ''
      })
      expect(result.success).toBe(false)
    })

    it('英数字以外を含むコードは拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        code: 'CODE-123!'
      })
      expect(result.success).toBe(false)
    })

    it('負の順序は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        order: -1
      })
      expect(result.success).toBe(false)
    })

    it('0の順序は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        order: 0
      })
      expect(result.success).toBe(false)
    })

    it('負の有効期間は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        validityDurationMinutes: -60
      })
      expect(result.success).toBe(false)
    })

    it('maxUseCount/useCountが省略された場合はデフォルト値が適用される', () => {
      const result = PromoCodeSchema.safeParse(validPromoCode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maxUseCount).toBe(1)
        expect(result.data.useCount).toBe(0)
      }
    })

    it('maxUseCount/useCountを明示的に指定できる', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        maxUseCount: 24,
        useCount: 3
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maxUseCount).toBe(24)
        expect(result.data.useCount).toBe(3)
      }
    })

    it('maxUseCountが0の場合は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        maxUseCount: 0
      })
      expect(result.success).toBe(false)
    })

    it('useCountが負の場合は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        useCount: -1
      })
      expect(result.success).toBe(false)
    })

    it('無効な日時文字列は拒否される', () => {
      const result = PromoCodeSchema.safeParse({
        ...validPromoCode,
        inputDeadline: 'invalid-date'
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
      validityDurationMinutes: 10080
    })
    expect(result.success).toBe(true)
  })

  it('必須フィールドが欠けている場合は拒否される', () => {
    const result = CreatePromoCodeInputSchema.safeParse({
      order: 1,
      code: 'TESTCODE123',
      // inputDeadlineが欠けている
      validityDurationMinutes: 10080
    })
    expect(result.success).toBe(false)
  })

  it('maxUseCount/useCountをオプションで指定できる', () => {
    const result = CreatePromoCodeInputSchema.safeParse({
      order: 1,
      code: 'TESTCODE123',
      inputDeadline: '2026-06-20T23:59:59.000Z',
      validityDurationMinutes: 10080,
      maxUseCount: 24,
      useCount: 1
    })
    expect(result.success).toBe(true)
  })
})

describe('UpdatePromoCodeInputSchema', () => {
  it('部分更新を検証できる', () => {
    const result = UpdatePromoCodeInputSchema.safeParse({
      order: 2
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
      expiresAt: null
    })
    expect(result.success).toBe(true)
  })

  it('startedAtとexpiresAtを日時に設定できる', () => {
    const result = UpdatePromoCodeInputSchema.safeParse({
      startedAt: '2026-01-15T12:00:00.000Z',
      expiresAt: '2026-01-22T12:00:00.000Z'
    })
    expect(result.success).toBe(true)
  })

  it('maxUseCount/useCountを更新できる', () => {
    const result = UpdatePromoCodeInputSchema.safeParse({
      maxUseCount: 24,
      useCount: 5
    })
    expect(result.success).toBe(true)
  })
})

describe('NotificationSettingsSchema', () => {
  it('有効な通知設定を検証できる', () => {
    const result = NotificationSettingsSchema.safeParse({
      expiryThresholdsMinutes: [1440, 180, 60, 30],
      inputDeadlineThresholdsMinutes: []
    })
    expect(result.success).toBe(true)
  })

  it('空の閾値配列も有効', () => {
    const result = NotificationSettingsSchema.safeParse({
      expiryThresholdsMinutes: [],
      inputDeadlineThresholdsMinutes: []
    })
    expect(result.success).toBe(true)
  })

  it('負の閾値は拒否される', () => {
    const result = NotificationSettingsSchema.safeParse({
      expiryThresholdsMinutes: [-1],
      inputDeadlineThresholdsMinutes: []
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
        inputDeadlineThresholdsMinutes: []
      }
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
          validityEndAt: null,
          startedAt: null,
          expiresAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ],
      notificationSettings: {
        expiryThresholdsMinutes: [1440],
        inputDeadlineThresholdsMinutes: []
      }
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
        validityEndAt: null,
        startedAt: null,
        expiresAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    it('無効なデータでsuccess: falseとerrorsを返す', () => {
      const result = validatePromoCode({
        id: 'invalid'
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
        validityDurationMinutes: 10080
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
          inputDeadlineThresholdsMinutes: []
        }
      })

      expect(result.success).toBe(true)
    })
  })

  describe('validateUpdatePromoCodeInput', () => {
    it('有効な更新入力を検証できる', () => {
      const result = validateUpdatePromoCodeInput({
        startedAt: '2026-01-15T12:00:00.000Z'
      })

      expect(result.success).toBe(true)
    })

    it('空のオブジェクトも有効（全フィールドオプション）', () => {
      const result = validateUpdatePromoCodeInput({})

      expect(result.success).toBe(true)
    })

    it('無効な日時形式は拒否される', () => {
      const result = validateUpdatePromoCodeInput({
        startedAt: 'invalid-date'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('validateExportData', () => {
    it('有効なエクスポートデータを検証できる', () => {
      const result = validateExportData({
        version: 1,
        codes: [],
        notificationSettings: {
          expiryThresholdsMinutes: [],
          inputDeadlineThresholdsMinutes: []
        },
        exportedAt: '2026-01-23T12:00:00.000Z'
      })

      expect(result.success).toBe(true)
    })

    it('exportedAtがない場合は拒否される', () => {
      const result = validateExportData({
        version: 1,
        codes: [],
        notificationSettings: {
          expiryThresholdsMinutes: [],
          inputDeadlineThresholdsMinutes: []
        }
      })

      expect(result.success).toBe(false)
    })
  })
})

describe('エクスポート/インポート検証', () => {
  describe('エクスポートデータ形式', () => {
    it('エクスポートデータ（exportedAt付き）をインポート用に検証できる', () => {
      // エクスポートされたJSONにはexportedAtが含まれるが、
      // StoreDataSchemaはそれを無視してストアデータとして検証できる
      const exportedData = {
        version: 1,
        codes: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            order: 1,
            code: 'TESTCODE123',
            inputDeadline: '2026-06-20T23:59:59.000Z',
            validityDurationMinutes: 10080,
            validityEndAt: null,
            startedAt: null,
            expiresAt: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          }
        ],
        notificationSettings: {
          expiryThresholdsMinutes: [1440, 180, 60, 30],
          inputDeadlineThresholdsMinutes: []
        },
        exportedAt: '2026-01-22T12:00:00.000Z' // エクスポート時に追加されるフィールド
      }

      const result = validateStoreData(exportedData)
      expect(result.success).toBe(true)
    })

    it('バージョン番号が含まれていることを確認できる', () => {
      const data = {
        version: 1,
        codes: [],
        notificationSettings: {
          expiryThresholdsMinutes: [],
          inputDeadlineThresholdsMinutes: []
        }
      }

      const result = validateStoreData(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.version).toBe(1)
      }
    })
  })

  describe('インポートデータ検証エラー', () => {
    it('バージョンがない場合は拒否される', () => {
      const data = {
        codes: [],
        notificationSettings: {
          expiryThresholdsMinutes: [],
          inputDeadlineThresholdsMinutes: []
        }
      }

      const result = validateStoreData(data)
      expect(result.success).toBe(false)
    })

    it('不正なコードデータがある場合は拒否される', () => {
      const data = {
        version: 1,
        codes: [
          {
            id: 'invalid-uuid', // 無効なUUID
            order: 1,
            code: 'TESTCODE123',
            inputDeadline: '2026-06-20T23:59:59.000Z',
            validityDurationMinutes: 10080,
            startedAt: null,
            expiresAt: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          }
        ],
        notificationSettings: {
          expiryThresholdsMinutes: [],
          inputDeadlineThresholdsMinutes: []
        }
      }

      const result = validateStoreData(data)
      expect(result.success).toBe(false)
    })

    it('不正な通知設定がある場合は拒否される', () => {
      const data = {
        version: 1,
        codes: [],
        notificationSettings: {
          expiryThresholdsMinutes: [-100], // 負の値
          inputDeadlineThresholdsMinutes: []
        }
      }

      const result = validateStoreData(data)
      expect(result.success).toBe(false)
    })

    it('JSONとしてパースできない文字列は拒否される', () => {
      const invalidJson = 'not a json'

      expect(() => JSON.parse(invalidJson)).toThrow()
    })

    it('空のオブジェクトは拒否される', () => {
      const result = validateStoreData({})
      expect(result.success).toBe(false)
    })
  })

  describe('複数コードのインポート', () => {
    it('複数のコードを含むデータを検証できる', () => {
      const data = {
        version: 1,
        codes: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            order: 1,
            code: 'CODE001ABC',
            inputDeadline: '2026-06-20T23:59:59.000Z',
            validityDurationMinutes: 10080,
            validityEndAt: null,
            startedAt: null,
            expiresAt: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            order: 2,
            code: 'CODE002DEF',
            inputDeadline: '2026-06-20T23:59:59.000Z',
            validityDurationMinutes: 10080,
            validityEndAt: null,
            startedAt: '2026-01-15T10:00:00.000Z',
            expiresAt: '2026-01-22T10:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-15T10:00:00.000Z'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            order: 3,
            code: 'CODE003GHI',
            inputDeadline: '2026-06-20T23:59:59.000Z',
            validityDurationMinutes: 60, // 1時間
            validityEndAt: null,
            startedAt: null,
            expiresAt: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          }
        ],
        notificationSettings: {
          expiryThresholdsMinutes: [1440, 180, 60, 30],
          inputDeadlineThresholdsMinutes: [1440]
        }
      }

      const result = validateStoreData(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.codes.length).toBe(3)
      }
    })
  })
})
