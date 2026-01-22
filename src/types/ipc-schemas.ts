/**
 * IPCリクエスト用のZodスキーマ定義
 * main-renderer間の入力を検証・サニタイズする
 */

import { z } from 'zod'
import {
  CodeStatusSchema,
  CreatePromoCodeInputSchema,
  IsoDateTimeStringSchema,
  NotificationSettingsSchema,
  PromoCodeIdSchema
} from './schemas'

const trimmedNonEmptyString = z.string().trim().min(1, '入力は必須です')

const codeSortKeySchema = z.enum(['order', 'inputDeadline', 'status', 'createdAt'])
const codeSortDirectionSchema = z.enum(['asc', 'desc'])

export const CodeFilterSchema = z.object({
  statuses: z.array(CodeStatusSchema).optional(),
  inputDeadlineWithinDays: z.number().int().nonnegative().nullable().optional()
})

export const CodeSortSchema = z.object({
  key: codeSortKeySchema,
  direction: codeSortDirectionSchema
})

export const GetFilteredCodesRequestSchema = z.object({
  filter: CodeFilterSchema.optional(),
  sort: CodeSortSchema.optional()
})

export const CreateCodeRequestSchema = z.object({
  input: CreatePromoCodeInputSchema
})

export const CreateCodesRequestSchema = z.object({
  inputs: z.array(CreatePromoCodeInputSchema).min(1, 'コードがありません')
})

export const DeleteCodeRequestSchema = z.object({
  id: PromoCodeIdSchema
})

export const UpdateOrdersRequestSchema = z.object({
  orders: z
    .array(
      z.object({
        id: PromoCodeIdSchema,
        order: z.number().int().positive()
      })
    )
    .min(1, '更新対象がありません')
})

export const StartCodeRequestSchema = z.object({
  id: PromoCodeIdSchema,
  startedAt: IsoDateTimeStringSchema.optional()
})

export const CancelCodeRequestSchema = z.object({
  id: PromoCodeIdSchema
})

export const EditStartedAtRequestSchema = z.object({
  id: PromoCodeIdSchema,
  newStartedAt: IsoDateTimeStringSchema
})

export const UpdateNotificationSettingsRequestSchema = z.object({
  settings: NotificationSettingsSchema
})

export const ImportDataRequestSchema = z.object({
  json: trimmedNonEmptyString.max(5_000_000, 'データが大きすぎます')
})

export const ParseEmailRequestSchema = z.object({
  text: trimmedNonEmptyString.max(200_000, 'メール本文が大きすぎます')
})
