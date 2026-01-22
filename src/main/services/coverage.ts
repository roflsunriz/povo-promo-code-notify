/**
 * 連続カバレッジ計算ロジック
 * 要件定義書 第七章に基づく
 *
 * 連続カバレッジの定義:
 * - 使用中の各コードの時間区間を使用開始日時から有効期限までの閉区間として扱う
 * - 現在時刻を含む区間群から右方向に連結できる範囲を連続カバレッジとする
 * - 区間の終端と別区間の開始が同一時刻である場合は連続とみなす
 * - 区間同士が重なる場合も連続とみなす
 * - 区間の終端と次区間の開始時刻が離れている場合のみ非連続と判定する
 */

import { getActiveCodes } from './code-status'
import type { CoverageResult, PromoCode } from '@types/code'

/**
 * 時間区間を表す型
 */
interface TimeInterval {
  start: number // ミリ秒
  end: number // ミリ秒
}

/**
 * 使用中コードから時間区間を抽出する
 * @param codes プロモコード配列
 * @param now 現在時刻
 * @returns 時間区間の配列
 */
function extractIntervals(codes: readonly PromoCode[], now: Date): TimeInterval[] {
  const activeCodes = getActiveCodes(codes, now)

  return activeCodes
    .filter((code) => code.startedAt !== null && code.expiresAt !== null)
    .map((code) => ({
      // 非nullは上でフィルタ済み
      start: new Date(code.startedAt!).getTime(),
      end: new Date(code.expiresAt!).getTime()
    }))
}

/**
 * 区間を開始時刻でソートする
 * @param intervals 時間区間の配列
 * @returns ソートされた配列
 */
function sortIntervalsByStart(intervals: TimeInterval[]): TimeInterval[] {
  return [...intervals].sort((a, b) => a.start - b.start)
}

/**
 * 現在時刻を含む区間を取得する
 * @param intervals 時間区間の配列
 * @param nowTime 現在時刻（ミリ秒）
 * @returns 現在時刻を含む区間の配列
 */
function getIntervalsContainingNow(intervals: TimeInterval[], nowTime: number): TimeInterval[] {
  return intervals.filter((interval) => interval.start <= nowTime && nowTime <= interval.end)
}

/**
 * 区間を連結してカバレッジ終端を計算する
 *
 * アルゴリズム:
 * 1. 現在時刻を含む区間群から、最大の終端時刻を初期カバレッジ終端とする
 * 2. 残りの区間のうち、現在のカバレッジ終端以前に開始する区間を探す
 * 3. 見つかった区間の終端がカバレッジ終端より後なら、カバレッジ終端を更新
 * 4. 更新がなくなるまで繰り返す
 *
 * @param intervals 時間区間の配列（開始時刻でソート済み）
 * @param nowTime 現在時刻（ミリ秒）
 * @returns カバレッジ終端とギャップ情報
 */
function calculateCoverageEnd(
  intervals: TimeInterval[],
  nowTime: number
): { coverageEnd: number | null; gapStart: number | null } {
  // 現在時刻を含む区間を取得
  const containingIntervals = getIntervalsContainingNow(intervals, nowTime)

  if (containingIntervals.length === 0) {
    // 現在時刻を含む区間がない → カバレッジなし
    return { coverageEnd: null, gapStart: null }
  }

  // 現在時刻を含む区間群の最大終端を初期カバレッジ終端とする
  let coverageEnd = Math.max(...containingIntervals.map((i) => i.end))

  // 使用済み区間を追跡
  const usedIntervals = new Set<TimeInterval>(containingIntervals)

  // 拡張を試みる
  let extended = true
  while (extended) {
    extended = false

    for (const interval of intervals) {
      if (usedIntervals.has(interval)) {
        continue
      }

      // 区間の開始がカバレッジ終端以前なら連結可能
      // （同一時刻や重なりも連続とみなす）
      if (interval.start <= coverageEnd) {
        if (interval.end > coverageEnd) {
          coverageEnd = interval.end
          extended = true
        }
        usedIntervals.add(interval)
      }
    }
  }

  // ギャップの検出
  // カバレッジ終端以降に開始する区間があるかどうか
  const futureIntervals = intervals.filter(
    (interval) => !usedIntervals.has(interval) && interval.start > coverageEnd
  )

  // ギャップがある場合、最も早い未使用区間の開始がギャップ終端
  // ギャップ開始はカバレッジ終端
  const gapStart = futureIntervals.length > 0 ? coverageEnd : null

  return { coverageEnd, gapStart }
}

/**
 * 連続カバレッジを計算する
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns カバレッジ計算結果
 */
export function calculateCoverage(
  codes: readonly PromoCode[],
  now: Date = new Date()
): CoverageResult {
  const nowTime = now.getTime()
  const intervals = extractIntervals(codes, now)

  if (intervals.length === 0) {
    return {
      hasCoverage: false,
      coverageEndAt: null,
      remainingMinutes: null,
      hasGap: false,
      gapStartAt: null
    }
  }

  const sortedIntervals = sortIntervalsByStart(intervals)
  const { coverageEnd, gapStart } = calculateCoverageEnd(sortedIntervals, nowTime)

  if (coverageEnd === null) {
    return {
      hasCoverage: false,
      coverageEndAt: null,
      remainingMinutes: null,
      hasGap: false,
      gapStartAt: null
    }
  }

  const remainingMs = coverageEnd - nowTime
  const remainingMinutes = Math.max(0, Math.floor(remainingMs / (1000 * 60)))

  return {
    hasCoverage: true,
    coverageEndAt: new Date(coverageEnd).toISOString(),
    remainingMinutes,
    hasGap: gapStart !== null,
    gapStartAt: gapStart !== null ? new Date(gapStart).toISOString() : null
  }
}

/**
 * 残り時間を人間が読みやすい形式でフォーマットする
 * @param minutes 残り時間（分）
 * @returns フォーマットされた文字列
 */
export function formatRemainingTime(minutes: number | null): string {
  if (minutes === null) {
    return 'カバレッジなし'
  }

  if (minutes <= 0) {
    return '終了'
  }

  const days = Math.floor(minutes / (24 * 60))
  const hours = Math.floor((minutes % (24 * 60)) / 60)
  const mins = minutes % 60

  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days}日`)
  }

  if (hours > 0) {
    parts.push(`${hours}時間`)
  }

  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins}分`)
  }

  return parts.join('')
}

/**
 * カバレッジ終端時刻を人間が読みやすい形式でフォーマットする
 * @param isoString ISO 8601形式の日時文字列
 * @returns フォーマットされた文字列
 */
export function formatCoverageEndAt(isoString: string | null): string {
  if (isoString === null) {
    return 'カバレッジなし'
  }

  const date = new Date(isoString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  })
}
