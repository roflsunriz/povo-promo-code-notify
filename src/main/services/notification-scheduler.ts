/**
 * 通知スケジューラーサービス
 * 要件定義書 第十四章・第十五章に基づく
 *
 * 特徴:
 * - 利用終了通知：使用中コードの有効期限に対して通知
 * - 公式入力期限通知：未使用コードの入力期限に対して通知
 * - 起動時およびデータ変更時に再スケジュール
 */

import { Notification } from 'electron'
import { determineCodeStatus } from './code-status'
import type { NotificationSettings, PromoCode } from '@types/code'

/**
 * スケジュールされた通知の情報
 */
interface ScheduledNotification {
  /** 通知ID（コードID + 閾値で一意） */
  id: string
  /** タイマーID */
  timerId: ReturnType<typeof setTimeout>
  /** 通知予定時刻 */
  scheduledAt: Date
  /** 通知タイプ */
  type: 'expiry' | 'inputDeadline'
  /** 対象コードID */
  codeId: string
  /** 閾値（分） */
  thresholdMinutes: number
}

/**
 * 通知スケジューラークラス
 * シングルトンパターンで実装
 */
class NotificationScheduler {
  private static instance: NotificationScheduler | null = null

  /** スケジュールされた通知のMap */
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map()

  /** 発火済み通知の記録（セッション中の重複防止） */
  private firedNotifications: Set<string> = new Set()

  /** 現在の通知設定 */
  private settings: NotificationSettings | null = null

  /** 現在のコード一覧 */
  private codes: PromoCode[] = []

  /** 定期チェック用インターバルID */
  private checkIntervalId: ReturnType<typeof setInterval> | null = null

  /** 定期チェック間隔（ミリ秒）- 1分 */
  private static readonly CHECK_INTERVAL_MS = 60 * 1000

  private constructor() {
    // プライベートコンストラクタ（シングルトン）
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler()
    }
    return NotificationScheduler.instance
  }

  /**
   * スケジューラーを初期化・開始
   * @param codes 現在のコード一覧
   * @param settings 通知設定
   */
  start(codes: PromoCode[], settings: NotificationSettings): void {
    this.codes = codes
    this.settings = settings

    // 既存のスケジュールをクリア
    this.clearAllScheduled()

    // 通知をスケジュール
    this.scheduleAllNotifications()

    // 定期チェックを開始（状態遷移の検出用）
    this.startPeriodicCheck()
  }

  /**
   * スケジューラーを停止
   */
  stop(): void {
    this.clearAllScheduled()
    this.stopPeriodicCheck()
  }

  /**
   * コード一覧を更新して再スケジュール
   * @param codes 新しいコード一覧
   */
  updateCodes(codes: PromoCode[]): void {
    this.codes = codes
    this.reschedule()
  }

  /**
   * 通知設定を更新して再スケジュール
   * @param settings 新しい通知設定
   */
  updateSettings(settings: NotificationSettings): void {
    this.settings = settings
    this.reschedule()
  }

  /**
   * 全ての通知を再スケジュール
   */
  reschedule(): void {
    this.clearAllScheduled()
    this.scheduleAllNotifications()
  }

  /**
   * 発火済み通知をリセット（テスト用）
   */
  resetFiredNotifications(): void {
    this.firedNotifications.clear()
  }

  /**
   * すべての通知をスケジュール
   */
  private scheduleAllNotifications(): void {
    if (!this.settings) return

    const now = new Date()

    for (const code of this.codes) {
      const status = determineCodeStatus(code, now)

      // 利用終了通知（使用中コードのみ）
      if (status === 'active' && code.expiresAt) {
        this.scheduleExpiryNotifications(code, now)
      }

      // 公式入力期限通知（未使用コードのみ）
      if (status === 'unused') {
        this.scheduleInputDeadlineNotifications(code, now)
      }
    }
  }

  /**
   * 利用終了通知をスケジュール
   */
  private scheduleExpiryNotifications(code: PromoCode, now: Date): void {
    if (!this.settings || !code.expiresAt) return

    const expiresAt = new Date(code.expiresAt)

    for (const thresholdMinutes of this.settings.expiryThresholdsMinutes) {
      const notifyAt = new Date(expiresAt.getTime() - thresholdMinutes * 60 * 1000)

      // 既に過ぎている場合はスキップ
      if (notifyAt.getTime() <= now.getTime()) continue

      // 既に発火済みの場合はスキップ
      const firedKey = this.createFiredKey(code.id, 'expiry', thresholdMinutes)
      if (this.firedNotifications.has(firedKey)) continue

      this.scheduleNotification({
        codeId: code.id,
        code: code.code,
        type: 'expiry',
        thresholdMinutes,
        notifyAt,
        targetTime: expiresAt,
      })
    }
  }

  /**
   * 公式入力期限通知をスケジュール
   */
  private scheduleInputDeadlineNotifications(code: PromoCode, now: Date): void {
    if (!this.settings) return

    const inputDeadline = new Date(code.inputDeadline)

    for (const thresholdMinutes of this.settings.inputDeadlineThresholdsMinutes) {
      const notifyAt = new Date(inputDeadline.getTime() - thresholdMinutes * 60 * 1000)

      // 既に過ぎている場合はスキップ
      if (notifyAt.getTime() <= now.getTime()) continue

      // 既に発火済みの場合はスキップ
      const firedKey = this.createFiredKey(code.id, 'inputDeadline', thresholdMinutes)
      if (this.firedNotifications.has(firedKey)) continue

      this.scheduleNotification({
        codeId: code.id,
        code: code.code,
        type: 'inputDeadline',
        thresholdMinutes,
        notifyAt,
        targetTime: inputDeadline,
      })
    }
  }

  /**
   * 単一の通知をスケジュール
   */
  private scheduleNotification(params: {
    codeId: string
    code: string
    type: 'expiry' | 'inputDeadline'
    thresholdMinutes: number
    notifyAt: Date
    targetTime: Date
  }): void {
    const { codeId, code, type, thresholdMinutes, notifyAt, targetTime } = params
    const notificationId = `${codeId}-${type}-${thresholdMinutes}`

    // 既にスケジュール済みの場合は何もしない
    if (this.scheduledNotifications.has(notificationId)) return

    const delay = notifyAt.getTime() - Date.now()

    // 最大タイマー値を超える場合は後で再スケジュール
    // Node.jsのsetTimeoutは約24.8日が最大
    const MAX_TIMEOUT = 2147483647 // 約24.8日（ミリ秒）
    if (delay > MAX_TIMEOUT) {
      // 定期チェックで再スケジュールされる
      return
    }

    const timerId = setTimeout(() => {
      this.fireNotification(codeId, code, type, thresholdMinutes, targetTime)
    }, delay)

    this.scheduledNotifications.set(notificationId, {
      id: notificationId,
      timerId,
      scheduledAt: notifyAt,
      type,
      codeId,
      thresholdMinutes,
    })
  }

  /**
   * 通知を発火
   */
  private fireNotification(
    codeId: string,
    code: string,
    type: 'expiry' | 'inputDeadline',
    thresholdMinutes: number,
    targetTime: Date
  ): void {
    // 発火済みとして記録
    const firedKey = this.createFiredKey(codeId, type, thresholdMinutes)
    this.firedNotifications.add(firedKey)

    // スケジュールから削除
    const notificationId = `${codeId}-${type}-${thresholdMinutes}`
    this.scheduledNotifications.delete(notificationId)

    // 現在のコードの状態を確認（取り消しや変更がある場合はスキップ）
    const currentCode = this.codes.find((c) => c.id === codeId)
    if (!currentCode) return

    const now = new Date()
    const status = determineCodeStatus(currentCode, now)

    // 利用終了通知は使用中コードのみ
    if (type === 'expiry' && status !== 'active') return

    // 公式入力期限通知は未使用コードのみ
    if (type === 'inputDeadline' && status !== 'unused') return

    // 通知がサポートされているか確認
    if (!Notification.isSupported()) return

    // 通知を作成・表示
    const notification = this.createNotification(code, type, thresholdMinutes, targetTime)
    notification.show()
  }

  /**
   * 通知オブジェクトを作成
   */
  private createNotification(
    code: string,
    type: 'expiry' | 'inputDeadline',
    thresholdMinutes: number,
    targetTime: Date
  ): Notification {
    const maskedCode = this.maskCode(code)
    const timeStr = this.formatRemainingTime(thresholdMinutes)
    const targetTimeStr = this.formatDateTime(targetTime)

    let title: string
    let body: string

    if (type === 'expiry') {
      title = `povo コード有効期限通知`
      body = `コード ${maskedCode} の有効期限が${timeStr}です。\n期限: ${targetTimeStr}`
    } else {
      title = `povo コード入力期限通知`
      body = `コード ${maskedCode} の入力期限が${timeStr}です。\n期限: ${targetTimeStr}`
    }

    return new Notification({
      title,
      body,
      silent: false,
    })
  }

  /**
   * コードをマスク表示
   */
  private maskCode(code: string): string {
    if (code.length <= 4) return code
    return code.slice(0, 2) + '***' + code.slice(-2)
  }

  /**
   * 残り時間を人間が読みやすい形式に変換
   */
  private formatRemainingTime(minutes: number): string {
    if (minutes >= 1440) {
      const days = minutes / 1440
      return `あと${days}日`
    }
    if (minutes >= 60) {
      const hours = minutes / 60
      return `あと${hours}時間`
    }
    return `あと${minutes}分`
  }

  /**
   * 日時をフォーマット
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * 発火済み通知のキーを作成
   */
  private createFiredKey(
    codeId: string,
    type: 'expiry' | 'inputDeadline',
    thresholdMinutes: number
  ): string {
    return `${codeId}-${type}-${thresholdMinutes}`
  }

  /**
   * すべてのスケジュール済み通知をクリア
   */
  private clearAllScheduled(): void {
    for (const scheduled of this.scheduledNotifications.values()) {
      clearTimeout(scheduled.timerId)
    }
    this.scheduledNotifications.clear()
  }

  /**
   * 定期チェックを開始
   */
  private startPeriodicCheck(): void {
    if (this.checkIntervalId !== null) {
      clearInterval(this.checkIntervalId)
    }

    this.checkIntervalId = setInterval(() => {
      this.reschedule()
    }, NotificationScheduler.CHECK_INTERVAL_MS)
  }

  /**
   * 定期チェックを停止
   */
  private stopPeriodicCheck(): void {
    if (this.checkIntervalId !== null) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }
  }

  /**
   * スケジュール済み通知の数を取得（テスト用）
   */
  getScheduledCount(): number {
    return this.scheduledNotifications.size
  }

  /**
   * 発火済み通知の数を取得（テスト用）
   */
  getFiredCount(): number {
    return this.firedNotifications.size
  }

  /**
   * 特定のコードのスケジュール済み通知を取得（テスト用）
   */
  getScheduledForCode(codeId: string): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values()).filter(
      (n) => n.codeId === codeId
    )
  }
}

/**
 * シングルトンインスタンスをエクスポート
 */
export const notificationScheduler = NotificationScheduler.getInstance()

/**
 * スケジューラーを初期化・開始
 */
export function startNotificationScheduler(
  codes: PromoCode[],
  settings: NotificationSettings
): void {
  notificationScheduler.start(codes, settings)
}

/**
 * スケジューラーを停止
 */
export function stopNotificationScheduler(): void {
  notificationScheduler.stop()
}

/**
 * コード更新時に呼び出し
 */
export function updateNotificationSchedulerCodes(codes: PromoCode[]): void {
  notificationScheduler.updateCodes(codes)
}

/**
 * 設定更新時に呼び出し
 */
export function updateNotificationSchedulerSettings(settings: NotificationSettings): void {
  notificationScheduler.updateSettings(settings)
}

/**
 * 通知を再スケジュール
 */
export function rescheduleNotifications(): void {
  notificationScheduler.reschedule()
}
