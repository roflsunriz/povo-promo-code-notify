/**
 * IPC API型定義
 * main-renderer間の通信インターフェース
 */

import type {
  CodeStatus,
  CoverageResult,
  CreatePromoCodeInput,
  NextCandidateResult,
  NotificationSettings,
  PromoCode,
  PromoCodeWithStatus,
} from './code'

// ==================== コード操作 ====================

/**
 * すべてのコードを取得（状態付き）
 */
export interface GetAllCodesResponse {
  codes: PromoCodeWithStatus[]
}

/**
 * コードを作成
 */
export interface CreateCodeRequest {
  input: CreatePromoCodeInput
}

export interface CreateCodeResponse {
  code: PromoCode
}

/**
 * 複数のコードを一括作成
 */
export interface CreateCodesRequest {
  inputs: CreatePromoCodeInput[]
}

export interface CreateCodesResponse {
  codes: PromoCode[]
}

/**
 * コードを削除
 */
export interface DeleteCodeRequest {
  id: string
}

export interface DeleteCodeResponse {
  success: boolean
}

/**
 * 順序を更新
 */
export interface UpdateOrdersRequest {
  orders: Array<{ id: string; order: number }>
}

export interface UpdateOrdersResponse {
  success: boolean
}

// ==================== 使用開始・取り消し ====================

/**
 * コードの使用を開始
 */
export interface StartCodeRequest {
  id: string
  startedAt?: string // ISO 8601形式、省略時は現在時刻
}

export interface StartCodeResponse {
  code: PromoCode | null
}

/**
 * コードの使用を取り消し
 */
export interface CancelCodeRequest {
  id: string
}

export interface CancelCodeResponse {
  code: PromoCode | null
}

/**
 * 使用開始日時を編集
 */
export interface EditStartedAtRequest {
  id: string
  newStartedAt: string // ISO 8601形式
}

export interface EditStartedAtResponse {
  code: PromoCode | null
}

// ==================== カバレッジ・候補 ====================

/**
 * 連続カバレッジを計算
 */
export interface GetCoverageResponse {
  coverage: CoverageResult
}

/**
 * 次に開始すべきコード候補を取得
 */
export interface GetNextCandidateResponse {
  result: NextCandidateResult
}

// ==================== 通知設定 ====================

/**
 * 通知設定を取得
 */
export interface GetNotificationSettingsResponse {
  settings: NotificationSettings
}

/**
 * 通知設定を更新
 */
export interface UpdateNotificationSettingsRequest {
  settings: NotificationSettings
}

export interface UpdateNotificationSettingsResponse {
  success: boolean
}

// ==================== エクスポート/インポート ====================

/**
 * データをエクスポート
 */
export interface ExportDataResponse {
  json: string
}

/**
 * データをインポート
 */
export interface ImportDataRequest {
  json: string
}

export interface ImportDataResponse {
  success: boolean
  error?: string
}

/**
 * バックアップを作成
 */
export interface CreateBackupResponse {
  json: string
}

// ==================== メール解析 ====================

/**
 * メール本文からコードを抽出
 */
export interface ParseEmailRequest {
  text: string
}

/**
 * 抽出されたコード情報
 */
export interface ParsedCodeInfo {
  code: string
  inputDeadline: string | null
  validityDurationMinutes: number | null
}

export interface ParseEmailResponse {
  success: boolean
  codes: ParsedCodeInfo[]
  error?: string
}

// ==================== ダッシュボード ====================

/**
 * ダッシュボードデータ（概略タブ用）
 */
export interface DashboardData {
  coverage: CoverageResult
  nextCandidate: NextCandidateResult
  activeCodes: PromoCodeWithStatus[]
  unusedCount: number
  totalCount: number
}

export interface GetDashboardResponse {
  data: DashboardData
}

// ==================== フィルター ====================

/**
 * コードフィルター条件
 */
export interface CodeFilter {
  statuses?: CodeStatus[]
  inputDeadlineWithinDays?: number | null
}

/**
 * コードソート条件
 */
export type CodeSortKey = 'order' | 'inputDeadline' | 'status' | 'createdAt'
export type CodeSortDirection = 'asc' | 'desc'

export interface CodeSort {
  key: CodeSortKey
  direction: CodeSortDirection
}

/**
 * フィルター・ソート付きコード取得
 */
export interface GetFilteredCodesRequest {
  filter?: CodeFilter
  sort?: CodeSort
}

export interface GetFilteredCodesResponse {
  codes: PromoCodeWithStatus[]
}

// ==================== ファイルダイアログ ====================

/**
 * ファイル保存ダイアログの結果
 */
export interface SaveFileDialogResponse {
  /** キャンセルされたかどうか */
  canceled: boolean
  /** 保存先ファイルパス（キャンセル時はundefined） */
  filePath?: string
}

/**
 * ファイルにエクスポート
 */
export interface ExportToFileResponse {
  /** 成功かどうか */
  success: boolean
  /** 保存先ファイルパス */
  filePath?: string
  /** エラーメッセージ */
  error?: string
}

/**
 * ファイル読み込みダイアログの結果
 */
export interface OpenFileDialogResponse {
  /** キャンセルされたかどうか */
  canceled: boolean
  /** 選択されたファイルパス（キャンセル時はundefined） */
  filePath?: string
}

/**
 * ファイルからインポート（バックアップ付き）
 */
export interface ImportFromFileResponse {
  /** 成功かどうか */
  success: boolean
  /** バックアップファイルパス */
  backupPath?: string
  /** エラーメッセージ */
  error?: string
}

// ==================== IPC チャンネル名 ====================

export const IPC_CHANNELS = {
  // コード操作
  GET_ALL_CODES: 'codes:getAll',
  CREATE_CODE: 'codes:create',
  CREATE_CODES: 'codes:createMany',
  DELETE_CODE: 'codes:delete',
  UPDATE_ORDERS: 'codes:updateOrders',

  // 使用開始・取り消し
  START_CODE: 'codes:start',
  CANCEL_CODE: 'codes:cancel',
  EDIT_STARTED_AT: 'codes:editStartedAt',

  // カバレッジ・候補
  GET_COVERAGE: 'coverage:get',
  GET_NEXT_CANDIDATE: 'candidate:get',

  // ダッシュボード
  GET_DASHBOARD: 'dashboard:get',

  // フィルター付き取得
  GET_FILTERED_CODES: 'codes:getFiltered',

  // 通知設定
  GET_NOTIFICATION_SETTINGS: 'notification:getSettings',
  UPDATE_NOTIFICATION_SETTINGS: 'notification:updateSettings',

  // エクスポート/インポート
  EXPORT_DATA: 'data:export',
  IMPORT_DATA: 'data:import',
  CREATE_BACKUP: 'data:backup',
  EXPORT_TO_FILE: 'data:exportToFile',
  IMPORT_FROM_FILE: 'data:importFromFile',

  // メール解析
  PARSE_EMAIL: 'email:parse',

  // テスト通知
  SEND_TEST_NOTIFICATION: 'notification:sendTest',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
