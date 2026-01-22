/**
 * 永続化層（electron-store）
 * 要件定義書 第十六章・第十七章に基づく
 *
 * 特徴:
 * - ローカル平文で保存（暗号化不要）
 * - JSONバージョン番号付きで将来の拡張に備える
 * - インポート前の自動バックアップ
 */

import { INITIAL_STORE_DATA } from '@types/code'
import { StoreDataSchema } from '@types/schemas'
import Store from 'electron-store'
import type {
  CreatePromoCodeInput,
  NotificationSettings,
  PromoCode,
  StoreData,
  UpdatePromoCodeInput
} from '@types/code'

/**
 * ストアのスキーマ定義
 */
const schema = {
  version: {
    type: 'number' as const,
    default: 1
  },
  codes: {
    type: 'array' as const,
    default: []
  },
  notificationSettings: {
    type: 'object' as const,
    default: INITIAL_STORE_DATA.notificationSettings
  }
}

/**
 * electron-storeインスタンス
 */
const store = new Store<StoreData>({
  name: 'povo-promo-codes',
  schema,
  defaults: INITIAL_STORE_DATA
})

/**
 * UUID生成（crypto APIを使用）
 */
function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * 現在の日時をISO 8601形式で取得
 */
function nowISO(): string {
  return new Date().toISOString()
}

// ==================== CRUD操作 ====================

/**
 * すべてのコードを取得
 * @returns コード配列
 */
export function getAllCodes(): PromoCode[] {
  return store.get('codes', [])
}

/**
 * IDでコードを取得
 * @param id コードID
 * @returns コードまたはundefined
 */
export function getCodeById(id: string): PromoCode | undefined {
  const codes = getAllCodes()
  return codes.find((code) => code.id === id)
}

/**
 * コードを作成
 * @param input 作成入力データ
 * @returns 作成されたコード
 */
export function createCode(input: CreatePromoCodeInput): PromoCode {
  const now = nowISO()
  const newCode: PromoCode = {
    id: generateUUID(),
    order: input.order,
    code: input.code,
    inputDeadline: input.inputDeadline,
    validityDurationMinutes: input.validityDurationMinutes,
    startedAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now
  }

  const codes = getAllCodes()
  codes.push(newCode)
  store.set('codes', codes)

  return newCode
}

/**
 * 複数のコードを一括作成
 * @param inputs 作成入力データ配列
 * @returns 作成されたコード配列
 */
export function createCodes(inputs: CreatePromoCodeInput[]): PromoCode[] {
  const now = nowISO()
  const newCodes: PromoCode[] = inputs.map((input) => ({
    id: generateUUID(),
    order: input.order,
    code: input.code,
    inputDeadline: input.inputDeadline,
    validityDurationMinutes: input.validityDurationMinutes,
    startedAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now
  }))

  const codes = getAllCodes()
  codes.push(...newCodes)
  store.set('codes', codes)

  return newCodes
}

/**
 * コードを更新
 * @param id コードID
 * @param input 更新入力データ
 * @returns 更新されたコードまたはundefined（見つからない場合）
 */
export function updateCode(id: string, input: UpdatePromoCodeInput): PromoCode | undefined {
  const codes = getAllCodes()
  const index = codes.findIndex((code) => code.id === id)

  if (index === -1) {
    return undefined
  }

  const existingCode = codes[index]
  if (existingCode === undefined) {
    return undefined
  }

  const updatedCode: PromoCode = {
    ...existingCode,
    ...input,
    updatedAt: nowISO()
  }

  codes[index] = updatedCode
  store.set('codes', codes)

  return updatedCode
}

/**
 * コードを削除
 * @param id コードID
 * @returns 削除成功かどうか
 */
export function deleteCode(id: string): boolean {
  const codes = getAllCodes()
  const index = codes.findIndex((code) => code.id === id)

  if (index === -1) {
    return false
  }

  codes.splice(index, 1)
  store.set('codes', codes)

  return true
}

/**
 * すべてのコードを削除
 */
export function deleteAllCodes(): void {
  store.set('codes', [])
}

// ==================== 使用開始・取り消し操作 ====================

/**
 * コードの使用を開始
 * @param id コードID
 * @param startedAt 使用開始日時（省略時は現在時刻）
 * @returns 更新されたコードまたはundefined
 */
export function startCode(id: string, startedAt?: Date): PromoCode | undefined {
  const code = getCodeById(id)
  if (!code) {
    return undefined
  }

  const startTime = startedAt ?? new Date()
  const expiresAt = new Date(startTime.getTime() + code.validityDurationMinutes * 60 * 1000)

  return updateCode(id, {
    startedAt: startTime.toISOString(),
    expiresAt: expiresAt.toISOString()
  })
}

/**
 * コードの使用を取り消し
 * @param id コードID
 * @returns 更新されたコードまたはundefined
 */
export function cancelCode(id: string): PromoCode | undefined {
  return updateCode(id, {
    startedAt: null,
    expiresAt: null
  })
}

/**
 * 使用開始日時を編集
 * @param id コードID
 * @param newStartedAt 新しい使用開始日時
 * @returns 更新されたコードまたはundefined
 */
export function editStartedAt(id: string, newStartedAt: Date): PromoCode | undefined {
  const code = getCodeById(id)
  if (!code) {
    return undefined
  }

  const expiresAt = new Date(newStartedAt.getTime() + code.validityDurationMinutes * 60 * 1000)

  return updateCode(id, {
    startedAt: newStartedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  })
}

// ==================== 順序操作 ====================

/**
 * コードの順序を更新
 * @param orders IDと新しい順序のマッピング
 */
export function updateOrders(orders: Array<{ id: string; order: number }>): void {
  const codes = getAllCodes()

  for (const { id, order } of orders) {
    const code = codes.find((c) => c.id === id)
    if (code) {
      code.order = order
      code.updatedAt = nowISO()
    }
  }

  store.set('codes', codes)
}

/**
 * 次の順序番号を取得
 * @returns 次の順序番号（最大順序+1、コードがない場合は1）
 */
export function getNextOrder(): number {
  const codes = getAllCodes()
  if (codes.length === 0) {
    return 1
  }
  const maxOrder = Math.max(...codes.map((c) => c.order))
  return maxOrder + 1
}

// ==================== 通知設定 ====================

/**
 * 通知設定を取得
 * @returns 通知設定
 */
export function getNotificationSettings(): NotificationSettings {
  return store.get('notificationSettings', INITIAL_STORE_DATA.notificationSettings)
}

/**
 * 通知設定を更新
 * @param settings 新しい通知設定
 */
export function updateNotificationSettings(settings: NotificationSettings): void {
  store.set('notificationSettings', settings)
}

// ==================== エクスポート/インポート ====================

/**
 * ストアデータ全体を取得
 * @returns ストアデータ
 */
export function getStoreData(): StoreData {
  return {
    version: store.get('version', 1),
    codes: getAllCodes(),
    notificationSettings: getNotificationSettings()
  }
}

/**
 * エクスポート用データを生成
 * @returns エクスポートデータ（JSON文字列）
 */
export function exportData(): string {
  const data = getStoreData()
  const exportData = {
    ...data,
    exportedAt: nowISO()
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * バックアップを作成
 * @returns バックアップデータ（JSON文字列）
 */
export function createBackup(): string {
  return exportData()
}

/**
 * データをインポート
 * @param jsonString インポートするJSON文字列
 * @returns インポート結果
 */
export function importData(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed: unknown = JSON.parse(jsonString)

    // Zodでバリデーション
    const result = StoreDataSchema.safeParse(parsed)
    if (!result.success) {
      return {
        success: false,
        error: `バリデーションエラー: ${result.error.message}`
      }
    }

    const data = result.data

    // データを置換
    store.set('version', data.version)
    store.set('codes', data.codes)
    store.set('notificationSettings', data.notificationSettings)

    return { success: true }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : '不明なエラー'
    return {
      success: false,
      error: `JSONパースエラー: ${errorMessage}`
    }
  }
}

/**
 * ストアをリセット（初期状態に戻す）
 */
export function resetStore(): void {
  store.clear()
  store.set('version', INITIAL_STORE_DATA.version)
  store.set('codes', INITIAL_STORE_DATA.codes)
  store.set('notificationSettings', INITIAL_STORE_DATA.notificationSettings)
}

/**
 * ストアのファイルパスを取得（デバッグ用）
 * @returns ストアファイルのパス
 */
export function getStorePath(): string {
  return store.path
}
