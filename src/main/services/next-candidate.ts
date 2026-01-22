/**
 * 次に開始すべきコード候補ロジック
 * 要件定義書 第八章に基づく
 *
 * 候補の定義:
 * - 未使用かつ期限切れではないコードのうち、登録順序が最も早いものを第一候補として提示
 * - 登録順序はメール本文貼り付けから抽出された出現順を基本とし、
 *   ユーザーが並べ替えた結果を最終順序として尊重
 * - 複数の候補が同順位となる状況は原則発生しないが、
 *   発生した場合は内部IDの昇順で安定して選ぶ
 */

import { getUnusedCodes } from './code-status'
import type { NextCandidateResult, PromoCode, PromoCodeWithStatus } from '@types/code'

/**
 * 次に開始すべきコード候補を取得する
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 候補コード結果
 */
export function getNextCandidate(
  codes: readonly PromoCode[],
  now: Date = new Date()
): NextCandidateResult {
  // 未使用のコードを取得（期限切れは含まれない）
  const unusedCodes = getUnusedCodes(codes, now)

  if (unusedCodes.length === 0) {
    return {
      hasCandidate: false,
      candidate: null,
    }
  }

  // 登録順序（order）でソートし、同順位の場合は内部ID（id）でソート
  const sortedCodes = [...unusedCodes].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order
    }
    // 内部IDの昇順（文字列比較）
    return a.id.localeCompare(b.id)
  })

  const candidate = sortedCodes[0]

  // sortedCodes.length > 0 なので candidate は undefined にならないが、
  // TypeScript の noUncheckedIndexedAccess のため明示的にチェック
  if (candidate === undefined) {
    return {
      hasCandidate: false,
      candidate: null,
    }
  }

  return {
    hasCandidate: true,
    candidate,
  }
}

/**
 * すべての未使用コードを登録順序でソートして取得する
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns ソートされた未使用コード配列
 */
export function getUnusedCodesSorted(
  codes: readonly PromoCode[],
  now: Date = new Date()
): PromoCodeWithStatus[] {
  const unusedCodes = getUnusedCodes(codes, now)

  return [...unusedCodes].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order
    }
    return a.id.localeCompare(b.id)
  })
}

/**
 * 次に開始すべきコードの概要情報を取得する
 * UI表示用のサマリー
 * @param codes プロモコード配列
 * @param now 現在時刻（テスト用にオプション化）
 * @returns 概要情報
 */
export function getNextCandidateSummary(
  codes: readonly PromoCode[],
  now: Date = new Date()
): {
  hasCandidate: boolean
  candidateCode: string | null
  candidateOrder: number | null
  remainingUnusedCount: number
} {
  const result = getNextCandidate(codes, now)
  const unusedCodes = getUnusedCodes(codes, now)

  if (!result.hasCandidate || result.candidate === null) {
    return {
      hasCandidate: false,
      candidateCode: null,
      candidateOrder: null,
      remainingUnusedCount: 0,
    }
  }

  return {
    hasCandidate: true,
    candidateCode: result.candidate.code,
    candidateOrder: result.candidate.order,
    remainingUnusedCount: unusedCodes.length,
  }
}
