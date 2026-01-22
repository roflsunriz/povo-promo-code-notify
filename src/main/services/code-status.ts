/**
 * 状態判定ロジック
 * 要件定義書 第五章に基づく
 *
 * 状態の定義:
 * - unused（未使用）: 使用開始日時が未設定かつ、現在時刻がコード入力期限以前
 * - active（使用中）: 使用開始日時が設定されており、現在時刻が有効期限以前
 * - consumed（消費済み）: 使用開始日時が設定されており、現在時刻が有効期限を過ぎている
 * - expired（期限切れ）: 使用開始日時が未設定のまま、現在時刻がコード入力期限を過ぎている
 *
 * 注意: コード入力期限を過ぎた使用開始済みコードは期限切れではなく、
 * 消費済みまたは使用中として扱う
 */

import type { CodeStatus, PromoCode, PromoCodeWithStatus } from '@types/code'

/**
 * コードの状態を判定する
 * @param code プロモコード
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 計算された状態
 */
export function determineCodeStatus(code: PromoCode, now: Date = new Date()): CodeStatus {
  const currentTime = now.getTime()
  const inputDeadlineTime = new Date(code.inputDeadline).getTime()

  // 使用開始日時が設定されているかどうかで分岐
  if (code.startedAt !== null && code.expiresAt !== null) {
    // 使用開始済み
    const expiresAtTime = new Date(code.expiresAt).getTime()

    if (currentTime <= expiresAtTime) {
      // 現在時刻が有効期限以前 → 使用中
      return 'active'
    } else {
      // 現在時刻が有効期限を過ぎている → 消費済み
      return 'consumed'
    }
  } else {
    // 使用開始日時が未設定
    if (currentTime <= inputDeadlineTime) {
      // 現在時刻がコード入力期限以前 → 未使用
      return 'unused'
    } else {
      // 現在時刻がコード入力期限を過ぎている → 期限切れ
      return 'expired'
    }
  }
}

/**
 * コードに状態を付与する
 * @param code プロモコード
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 状態付きプロモコード
 */
export function attachStatus(code: PromoCode, now: Date = new Date()): PromoCodeWithStatus {
  return {
    ...code,
    status: determineCodeStatus(code, now)
  }
}

/**
 * 複数のコードに状態を付与する
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 状態付きプロモコード配列
 */
export function attachStatusToAll(
  codes: readonly PromoCode[],
  now: Date = new Date()
): PromoCodeWithStatus[] {
  return codes.map((code) => attachStatus(code, now))
}

/**
 * 特定の状態のコードをフィルタリングする
 * @param codes プロモコード配列
 * @param status フィルタする状態
 * @param now 現在時刻（テスト用にオプション化）
 * @returns フィルタされた状態付きプロモコード配列
 */
export function filterByStatus(
  codes: readonly PromoCode[],
  status: CodeStatus,
  now: Date = new Date()
): PromoCodeWithStatus[] {
  return attachStatusToAll(codes, now).filter((code) => code.status === status)
}

/**
 * 使用中のコードを取得する
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 使用中の状態付きプロモコード配列
 */
export function getActiveCodes(
  codes: readonly PromoCode[],
  now: Date = new Date()
): PromoCodeWithStatus[] {
  return filterByStatus(codes, 'active', now)
}

/**
 * 未使用のコードを取得する
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 未使用の状態付きプロモコード配列
 */
export function getUnusedCodes(
  codes: readonly PromoCode[],
  now: Date = new Date()
): PromoCodeWithStatus[] {
  return filterByStatus(codes, 'unused', now)
}

/**
 * 消費済みのコードを取得する
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 消費済みの状態付きプロモコード配列
 */
export function getConsumedCodes(
  codes: readonly PromoCode[],
  now: Date = new Date()
): PromoCodeWithStatus[] {
  return filterByStatus(codes, 'consumed', now)
}

/**
 * 期限切れのコードを取得する
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 期限切れの状態付きプロモコード配列
 */
export function getExpiredCodes(
  codes: readonly PromoCode[],
  now: Date = new Date()
): PromoCodeWithStatus[] {
  return filterByStatus(codes, 'expired', now)
}

/**
 * コードが使用可能かどうかを判定する
 * （未使用または使用中）
 * @param code プロモコード
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 使用可能かどうか
 */
export function isCodeUsable(code: PromoCode, now: Date = new Date()): boolean {
  const status = determineCodeStatus(code, now)
  return status === 'unused' || status === 'active'
}

/**
 * コードが終了済みかどうかを判定する
 * （消費済みまたは期限切れ）
 * @param code プロモコード
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 終了済みかどうか
 */
export function isCodeFinished(code: PromoCode, now: Date = new Date()): boolean {
  const status = determineCodeStatus(code, now)
  return status === 'consumed' || status === 'expired'
}
