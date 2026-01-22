/**
 * コードエンティティ型定義
 * 要件定義書 第十六章に基づく
 */

/**
 * コードの状態（計算結果）
 * 要件定義書 第五章に基づく
 */
export type CodeStatus = 'unused' | 'active' | 'consumed' | 'expired'

/**
 * コードエンティティ
 * 永続化対象のデータ構造
 */
export interface PromoCode {
  /**
   * 内部ID（UUID形式）
   */
  readonly id: string

  /**
   * 登録順序（1始まり、昇順でソート用）
   * メール本文からの抽出順、またはユーザーによる並べ替え後の順序
   */
  order: number

  /**
   * プロモコード文字列
   * 例: "UL1H97X3CKAR6"
   */
  code: string

  /**
   * コード入力期限（ISO 8601形式）
   * メールに記載されるコード入力期限の日時
   * この日時を過ぎるとコードの入力ができなくなる
   */
  inputDeadline: string

  /**
   * 有効期間（分単位の整数）
   * 使用開始から所定の期間だけ通信が使い放題になる期間
   * 例: 1時間=60, 7日間=10080
   */
  validityDurationMinutes: number

  /**
   * 使用開始日時（ISO 8601形式 | null）
   * ユーザーがAndroid側で当該コードを実際に適用した日時
   * 未使用・期限切れの場合はnull
   */
  startedAt: string | null

  /**
   * 有効期限（ISO 8601形式 | null）
   * 使用開始日時 + 有効期間 で計算
   * 未使用・期限切れの場合はnull
   */
  expiresAt: string | null

  /**
   * 作成日時（ISO 8601形式）
   */
  readonly createdAt: string

  /**
   * 更新日時（ISO 8601形式）
   */
  updatedAt: string
}

/**
 * コード作成時の入力データ
 * idとcreatedAtは自動生成されるため除外
 */
export interface CreatePromoCodeInput {
  order: number
  code: string
  inputDeadline: string
  validityDurationMinutes: number
}

/**
 * コード更新時の入力データ
 * 部分更新をサポート
 */
export interface UpdatePromoCodeInput {
  order?: number
  code?: string
  inputDeadline?: string
  validityDurationMinutes?: number
  startedAt?: string | null
  expiresAt?: string | null
}

/**
 * コード状態付きのビューモデル
 * UI表示用に状態を計算結果として付与
 */
export interface PromoCodeWithStatus extends PromoCode {
  /**
   * 計算された状態
   */
  status: CodeStatus
}

/**
 * 連続カバレッジ計算結果
 * 要件定義書 第七章に基づく
 */
export interface CoverageResult {
  /**
   * 現在カバレッジがあるかどうか
   */
  hasCoverage: boolean

  /**
   * 連続カバレッジ終端時刻（ISO 8601形式 | null）
   * カバレッジがない場合はnull
   */
  coverageEndAt: string | null

  /**
   * 残り時間（分 | null）
   * カバレッジがない場合はnull
   */
  remainingMinutes: number | null

  /**
   * ギャップが存在するかどうか
   */
  hasGap: boolean

  /**
   * ギャップ開始時刻（ISO 8601形式 | null）
   * ギャップがない場合はnull
   */
  gapStartAt: string | null
}

/**
 * 次に開始すべきコード候補結果
 * 要件定義書 第八章に基づく
 */
export interface NextCandidateResult {
  /**
   * 候補が存在するかどうか
   */
  hasCandidate: boolean

  /**
   * 候補コード（存在しない場合はnull）
   */
  candidate: PromoCodeWithStatus | null
}

/**
 * ストアのデータ構造
 */
export interface StoreData {
  /**
   * データバージョン（将来のマイグレーション用）
   */
  version: number

  /**
   * コード一覧
   */
  codes: PromoCode[]

  /**
   * 通知設定
   */
  notificationSettings: NotificationSettings
}

/**
 * 通知設定
 * 要件定義書 第十四章に基づく
 */
export interface NotificationSettings {
  /**
   * 利用終了通知の閾値（分単位の配列）
   * 既定: [1440, 180, 60, 30] (24h, 3h, 1h, 30m)
   */
  expiryThresholdsMinutes: number[]

  /**
   * 公式入力期限通知の閾値（分単位の配列）
   * 既定: [] (オフ)
   */
  inputDeadlineThresholdsMinutes: number[]
}

/**
 * 通知閾値の既定値
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  // 24時間=1440分, 3時間=180分, 1時間=60分, 30分=30分
  expiryThresholdsMinutes: [1440, 180, 60, 30],
  // 公式入力期限通知は既定でオフ
  inputDeadlineThresholdsMinutes: [],
}

/**
 * 有効期間の定数（分単位）
 */
export const VALIDITY_DURATIONS = {
  ONE_HOUR: 60,
  SEVEN_DAYS: 10080, // 7 * 24 * 60
  TWENTY_FOUR_HOURS: 1440, // 24 * 60
} as const

/**
 * ストアの初期データ
 */
export const INITIAL_STORE_DATA: StoreData = {
  version: 1,
  codes: [],
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
}
