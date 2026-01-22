/**
 * Zodスキーマ定義
 * ランタイム検証用
 */

import { z } from 'zod'

/**
 * ISO 8601形式の日時文字列バリデーション
 */
const isoDateTimeString = z.string().refine(
  (val) => {
    const date = new Date(val)
    return !isNaN(date.getTime())
  },
  { message: '有効なISO 8601形式の日時文字列を入力してください' }
)

/**
 * プロモコード文字列のバリデーション
 * 英数字のみ、空でない
 */
const promoCodeString = z
  .string()
  .min(1, 'プロモコードは必須です')
  .regex(/^[A-Za-z0-9]+$/, 'プロモコードは英数字のみ使用できます')

/**
 * 有効期間（分単位）のバリデーション
 * 正の整数
 */
const validityDurationMinutes = z
  .number()
  .int('有効期間は整数で入力してください')
  .positive('有効期間は正の数で入力してください')

/**
 * 順序のバリデーション
 * 正の整数
 */
const orderNumber = z
  .number()
  .int('順序は整数で入力してください')
  .positive('順序は正の数で入力してください')

/**
 * コード状態スキーマ
 */
export const CodeStatusSchema = z.enum(['unused', 'active', 'consumed', 'expired'])

/**
 * プロモコードエンティティスキーマ
 */
export const PromoCodeSchema = z.object({
  id: z.string().uuid('内部IDはUUID形式である必要があります'),
  order: orderNumber,
  code: promoCodeString,
  inputDeadline: isoDateTimeString,
  validityDurationMinutes: validityDurationMinutes,
  startedAt: isoDateTimeString.nullable(),
  expiresAt: isoDateTimeString.nullable(),
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
})

/**
 * コード作成入力スキーマ
 */
export const CreatePromoCodeInputSchema = z.object({
  order: orderNumber,
  code: promoCodeString,
  inputDeadline: isoDateTimeString,
  validityDurationMinutes: validityDurationMinutes,
})

/**
 * コード更新入力スキーマ
 */
export const UpdatePromoCodeInputSchema = z.object({
  order: orderNumber.optional(),
  code: promoCodeString.optional(),
  inputDeadline: isoDateTimeString.optional(),
  validityDurationMinutes: validityDurationMinutes.optional(),
  startedAt: isoDateTimeString.nullable().optional(),
  expiresAt: isoDateTimeString.nullable().optional(),
})

/**
 * 通知設定スキーマ
 */
export const NotificationSettingsSchema = z.object({
  expiryThresholdsMinutes: z.array(
    z.number().int().nonnegative('閾値は0以上の整数で入力してください')
  ),
  inputDeadlineThresholdsMinutes: z.array(
    z.number().int().nonnegative('閾値は0以上の整数で入力してください')
  ),
})

/**
 * ストアデータスキーマ
 */
export const StoreDataSchema = z.object({
  version: z.number().int().positive(),
  codes: z.array(PromoCodeSchema),
  notificationSettings: NotificationSettingsSchema,
})

/**
 * エクスポート/インポート用JSONスキーマ
 * バージョン番号付き
 */
export const ExportDataSchema = z.object({
  version: z.number().int().positive(),
  exportedAt: isoDateTimeString,
  codes: z.array(PromoCodeSchema),
  notificationSettings: NotificationSettingsSchema,
})

/**
 * スキーマから型を導出
 */
export type CodeStatusFromSchema = z.infer<typeof CodeStatusSchema>
export type PromoCodeFromSchema = z.infer<typeof PromoCodeSchema>
export type CreatePromoCodeInputFromSchema = z.infer<typeof CreatePromoCodeInputSchema>
export type UpdatePromoCodeInputFromSchema = z.infer<typeof UpdatePromoCodeInputSchema>
export type NotificationSettingsFromSchema = z.infer<typeof NotificationSettingsSchema>
export type StoreDataFromSchema = z.infer<typeof StoreDataSchema>
export type ExportDataFromSchema = z.infer<typeof ExportDataSchema>

/**
 * バリデーション結果の型
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
}

/**
 * 汎用バリデーション関数
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * プロモコードのバリデーション
 */
export function validatePromoCode(data: unknown): ValidationResult<PromoCodeFromSchema> {
  return validate(PromoCodeSchema, data)
}

/**
 * コード作成入力のバリデーション
 */
export function validateCreatePromoCodeInput(
  data: unknown
): ValidationResult<CreatePromoCodeInputFromSchema> {
  return validate(CreatePromoCodeInputSchema, data)
}

/**
 * コード更新入力のバリデーション
 */
export function validateUpdatePromoCodeInput(
  data: unknown
): ValidationResult<UpdatePromoCodeInputFromSchema> {
  return validate(UpdatePromoCodeInputSchema, data)
}

/**
 * ストアデータのバリデーション
 */
export function validateStoreData(data: unknown): ValidationResult<StoreDataFromSchema> {
  return validate(StoreDataSchema, data)
}

/**
 * エクスポートデータのバリデーション
 */
export function validateExportData(data: unknown): ValidationResult<ExportDataFromSchema> {
  return validate(ExportDataSchema, data)
}
