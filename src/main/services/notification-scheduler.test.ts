/**
 * 通知スケジューラーのテスト
 */

import { VALIDITY_DURATIONS } from '@types/code'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PromoCode, NotificationSettings } from '@types/code'

// Electronモジュールをモック
vi.mock('electron', () => ({
  Notification: class MockNotification {
    static isSupported = vi.fn(() => true)
    title: string
    body: string
    constructor(options: { title: string; body: string }) {
      this.title = options.title
      this.body = options.body
    }
    show = vi.fn()
  },
}))

// 動的インポートでモック後にモジュールを読み込む
const {
  notificationScheduler,
  startNotificationScheduler,
  stopNotificationScheduler,
  updateNotificationSchedulerCodes,
  updateNotificationSchedulerSettings,
  rescheduleNotifications,
} = await import('./notification-scheduler')

describe('NotificationScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // スケジューラーをリセット
    notificationScheduler.stop()
    notificationScheduler.resetFiredNotifications()
  })

  afterEach(() => {
    notificationScheduler.stop()
    vi.useRealTimers()
  })

  /**
   * テスト用のコードを作成
   */
  function createTestCode(overrides: Partial<PromoCode> = {}): PromoCode {
    const now = new Date()
    return {
      id: 'test-id-1',
      order: 1,
      code: 'TESTCODE123',
      inputDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
      validityDurationMinutes: VALIDITY_DURATIONS.SEVEN_DAYS,
      startedAt: null,
      expiresAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ...overrides,
    }
  }

  /**
   * テスト用の使用中コードを作成
   */
  function createActiveCode(expiresInMinutes: number): PromoCode {
    const now = new Date()
    const startedAt = new Date(now.getTime() - 60 * 60 * 1000) // 1時間前に開始
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000)

    return createTestCode({
      id: `active-${expiresInMinutes}`,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
  }

  const defaultSettings: NotificationSettings = {
    expiryThresholdsMinutes: [1440, 180, 60, 30], // 24h, 3h, 1h, 30m
    inputDeadlineThresholdsMinutes: [],
  }

  describe('start', () => {
    it('空のコードリストでも正常に開始できること', () => {
      notificationScheduler.start([], defaultSettings)
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })

    it('未使用コードに対して通知がスケジュールされないこと（入力期限通知が無効の場合）', () => {
      const codes = [createTestCode()]
      notificationScheduler.start(codes, defaultSettings)
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })

    it('未使用コードに対して入力期限通知がスケジュールされること', () => {
      const now = new Date()
      // 入力期限が25時間後のコード（24h, 1hの両方の閾値がスケジュール可能）
      const codes = [
        createTestCode({
          inputDeadline: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
        }),
      ]
      const settings: NotificationSettings = {
        expiryThresholdsMinutes: [],
        inputDeadlineThresholdsMinutes: [1440, 60], // 24h, 1h前
      }
      notificationScheduler.start(codes, settings)
      expect(notificationScheduler.getScheduledCount()).toBe(2)
    })

    it('使用中コードに対して利用終了通知がスケジュールされること', () => {
      // 25時間後に期限切れ
      const codes = [createActiveCode(25 * 60)]
      notificationScheduler.start(codes, defaultSettings)

      // 24h, 3h, 1h, 30mの4つの通知がスケジュールされる
      expect(notificationScheduler.getScheduledCount()).toBe(4)
    })

    it('既に閾値を過ぎている場合はスケジュールされないこと', () => {
      // 20分後に期限切れ（30分前の閾値は過ぎている）
      const codes = [createActiveCode(20)]
      notificationScheduler.start(codes, defaultSettings)

      // 20分 < 30分 なので、全ての閾値を過ぎている
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })

    it('一部の閾値のみスケジュールされること', () => {
      // 45分後に期限切れ（30分前はスケジュール可、1h/3h/24h前は過ぎている）
      const codes = [createActiveCode(45)]
      notificationScheduler.start(codes, defaultSettings)

      expect(notificationScheduler.getScheduledCount()).toBe(1)
    })
  })

  describe('updateCodes', () => {
    it('コードが更新されたときに再スケジュールされること', () => {
      const codes1 = [createActiveCode(25 * 60)]
      notificationScheduler.start(codes1, defaultSettings)
      const count1 = notificationScheduler.getScheduledCount()

      // コードを追加
      const codes2 = [createActiveCode(25 * 60), createActiveCode(26 * 60)]
      notificationScheduler.updateCodes(codes2)

      // 両方のコードに対して通知がスケジュールされる
      expect(notificationScheduler.getScheduledCount()).toBeGreaterThan(count1)
    })

    it('コードが削除されたときにスケジュールがクリアされること', () => {
      const codes = [createActiveCode(25 * 60)]
      notificationScheduler.start(codes, defaultSettings)
      expect(notificationScheduler.getScheduledCount()).toBeGreaterThan(0)

      notificationScheduler.updateCodes([])
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })
  })

  describe('updateSettings', () => {
    it('設定が更新されたときに再スケジュールされること', () => {
      const codes = [createActiveCode(25 * 60)]
      notificationScheduler.start(codes, defaultSettings)
      const count1 = notificationScheduler.getScheduledCount()

      // 閾値を減らす
      const newSettings: NotificationSettings = {
        expiryThresholdsMinutes: [60], // 1時間前のみ
        inputDeadlineThresholdsMinutes: [],
      }
      notificationScheduler.updateSettings(newSettings)

      expect(notificationScheduler.getScheduledCount()).toBeLessThan(count1)
    })
  })

  describe('stop', () => {
    it('停止後はすべてのスケジュールがクリアされること', () => {
      const codes = [createActiveCode(25 * 60)]
      notificationScheduler.start(codes, defaultSettings)
      expect(notificationScheduler.getScheduledCount()).toBeGreaterThan(0)

      notificationScheduler.stop()
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })
  })

  describe('getScheduledForCode', () => {
    it('特定のコードのスケジュールを取得できること', () => {
      const code = createActiveCode(25 * 60)
      notificationScheduler.start([code], defaultSettings)

      const scheduled = notificationScheduler.getScheduledForCode(code.id)
      expect(scheduled.length).toBe(4)
      expect(scheduled.every((s) => s.codeId === code.id)).toBe(true)
    })

    it('存在しないコードIDの場合は空配列が返ること', () => {
      const code = createActiveCode(25 * 60)
      notificationScheduler.start([code], defaultSettings)

      const scheduled = notificationScheduler.getScheduledForCode('non-existent')
      expect(scheduled.length).toBe(0)
    })
  })

  describe('重複防止', () => {
    it('同じ通知が二重にスケジュールされないこと', () => {
      const codes = [createActiveCode(25 * 60)]
      notificationScheduler.start(codes, defaultSettings)
      const count1 = notificationScheduler.getScheduledCount()

      // 再スケジュール
      notificationScheduler.reschedule()
      const count2 = notificationScheduler.getScheduledCount()

      expect(count1).toBe(count2)
    })
  })

  describe('消費済み/期限切れコード', () => {
    it('消費済みコードに対して通知がスケジュールされないこと', () => {
      const now = new Date()
      const code = createTestCode({
        startedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3日前に期限切れ
      })

      notificationScheduler.start([code], defaultSettings)
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })

    it('期限切れコードに対して入力期限通知がスケジュールされないこと', () => {
      const now = new Date()
      const code = createTestCode({
        inputDeadline: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1日前に期限切れ
      })

      const settings: NotificationSettings = {
        expiryThresholdsMinutes: [],
        inputDeadlineThresholdsMinutes: [1440, 60],
      }

      notificationScheduler.start([code], settings)
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })
  })

  describe('複数コード', () => {
    it('複数の使用中コードに対して通知がスケジュールされること', () => {
      const codes = [
        createActiveCode(25 * 60),
        createActiveCode(26 * 60),
        createActiveCode(27 * 60),
      ]

      notificationScheduler.start(codes, defaultSettings)

      // 各コードに4つの閾値がスケジュールされる
      expect(notificationScheduler.getScheduledCount()).toBe(12)
    })

    it('混在した状態のコードを正しく処理できること', () => {
      const now = new Date()

      const codes: PromoCode[] = [
        createActiveCode(25 * 60), // 使用中（25時間後に期限切れ）
        createTestCode({
          id: 'unused-1',
          // 入力期限が2時間後（1時間前の閾値がスケジュール可能）
          inputDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        }), // 未使用
        createTestCode({
          id: 'consumed-1',
          startedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        }), // 消費済み
      ]

      const settings: NotificationSettings = {
        expiryThresholdsMinutes: [60],
        inputDeadlineThresholdsMinutes: [60],
      }

      notificationScheduler.start(codes, settings)

      // 使用中コードの利用終了通知(1) + 未使用コードの入力期限通知(1)
      expect(notificationScheduler.getScheduledCount()).toBe(2)
    })
  })

  describe('状態変更時のスケジュール', () => {
    it('コードが取り消された場合はスケジュールがクリアされること', () => {
      const codes = [createActiveCode(35)]
      const settings: NotificationSettings = {
        expiryThresholdsMinutes: [30],
        inputDeadlineThresholdsMinutes: [],
      }
      notificationScheduler.start(codes, settings)

      // コードを空に更新（取り消し）
      notificationScheduler.updateCodes([])

      // updateCodesでスケジュールがクリアされる
      expect(notificationScheduler.getScheduledCount()).toBe(0)
      expect(notificationScheduler.getFiredCount()).toBe(0)
    })

    it('コードが消費済みになった場合はスケジュールがクリアされること', () => {
      const now = new Date()
      const startedAt = new Date(now.getTime() - 60 * 60 * 1000) // 1時間前に開始
      const expiresAt = new Date(now.getTime() + 35 * 60 * 1000) // 35分後に期限切れ

      const code = createTestCode({
        id: 'active-to-consumed',
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      })

      const settings: NotificationSettings = {
        expiryThresholdsMinutes: [30],
        inputDeadlineThresholdsMinutes: [],
      }
      notificationScheduler.start([code], settings)
      expect(notificationScheduler.getScheduledCount()).toBe(1)

      // コードを消費済みに更新
      const consumedCode = createTestCode({
        id: 'active-to-consumed',
        startedAt: startedAt.toISOString(),
        expiresAt: new Date(now.getTime() - 1000).toISOString(), // 過去に設定
      })
      notificationScheduler.updateCodes([consumedCode])

      // updateCodesでスケジュールがクリアされる
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })

    it('コードが使用開始された場合は入力期限通知がスケジュールされないこと', () => {
      const now = new Date()
      const codes = [
        createTestCode({
          id: 'unused-to-active',
          inputDeadline: new Date(now.getTime() + 35 * 60 * 1000).toISOString(),
        }),
      ]
      const settings: NotificationSettings = {
        expiryThresholdsMinutes: [],
        inputDeadlineThresholdsMinutes: [30],
      }
      notificationScheduler.start(codes, settings)
      expect(notificationScheduler.getScheduledCount()).toBe(1)

      // コードを使用開始状態に更新
      const activeCode = createTestCode({
        id: 'unused-to-active',
        inputDeadline: new Date(now.getTime() + 35 * 60 * 1000).toISOString(),
        startedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      notificationScheduler.updateCodes([activeCode])

      // 使用中になったため、入力期限通知はクリアされる
      expect(notificationScheduler.getScheduledCount()).toBe(0)
      expect(notificationScheduler.getFiredCount()).toBe(0)
    })
  })

  describe('エクスポート関数', () => {
    it('startNotificationSchedulerが正常に動作すること', () => {
      const codes = [createActiveCode(25 * 60)]
      startNotificationScheduler(codes, defaultSettings)
      expect(notificationScheduler.getScheduledCount()).toBe(4)
    })

    it('stopNotificationSchedulerが正常に動作すること', () => {
      const codes = [createActiveCode(25 * 60)]
      startNotificationScheduler(codes, defaultSettings)
      expect(notificationScheduler.getScheduledCount()).toBe(4)

      stopNotificationScheduler()
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })

    it('updateNotificationSchedulerCodesが正常に動作すること', () => {
      const codes1 = [createActiveCode(25 * 60)]
      startNotificationScheduler(codes1, defaultSettings)

      const codes2: PromoCode[] = []
      updateNotificationSchedulerCodes(codes2)
      expect(notificationScheduler.getScheduledCount()).toBe(0)
    })

    it('updateNotificationSchedulerSettingsが正常に動作すること', () => {
      const codes = [createActiveCode(25 * 60)]
      startNotificationScheduler(codes, defaultSettings)
      expect(notificationScheduler.getScheduledCount()).toBe(4)

      const newSettings: NotificationSettings = {
        expiryThresholdsMinutes: [60],
        inputDeadlineThresholdsMinutes: [],
      }
      updateNotificationSchedulerSettings(newSettings)
      expect(notificationScheduler.getScheduledCount()).toBe(1)
    })

    it('rescheduleNotificationsが正常に動作すること', () => {
      const codes = [createActiveCode(25 * 60)]
      startNotificationScheduler(codes, defaultSettings)
      const count1 = notificationScheduler.getScheduledCount()

      rescheduleNotifications()
      const count2 = notificationScheduler.getScheduledCount()

      expect(count1).toBe(count2)
    })
  })

  describe('getFiredCount', () => {
    it('初期状態では発火済み通知の数が0であること', () => {
      const codes = [createActiveCode(25 * 60)]
      notificationScheduler.start(codes, defaultSettings)
      expect(notificationScheduler.getFiredCount()).toBe(0)
    })

    it('resetFiredNotificationsで発火済み通知がクリアされること', () => {
      notificationScheduler.resetFiredNotifications()
      expect(notificationScheduler.getFiredCount()).toBe(0)
    })
  })

  describe('タイムアウト上限', () => {
    it('24.8日を超える通知は定期チェックで再スケジュールされること', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      vi.setSystemTime(now)
      // 30日後に期限切れ（MAX_TIMEOUTを超える）
      const codes = [
        createTestCode({
          id: 'far-future',
          startedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ]
      const settings: NotificationSettings = {
        expiryThresholdsMinutes: [1440], // 24時間前
        inputDeadlineThresholdsMinutes: [],
      }
      notificationScheduler.start(codes, settings)

      // 29日後の通知はMAX_TIMEOUTを超えるため、最初はスケジュールされない
      // 定期チェックで範囲内に入ったらスケジュールされる
      // この動作を確認するため、時間を進めてrescheduleを呼ぶ
      const initialCount = notificationScheduler.getScheduledCount()
      expect(initialCount).toBe(0) // MAX_TIMEOUTを超えているためスケジュールされない

      // 時間を進めて再スケジュール
      const movedTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      vi.setSystemTime(movedTime)
      notificationScheduler.reschedule()

      expect(notificationScheduler.getScheduledCount()).toBe(1)
    })
  })
})
