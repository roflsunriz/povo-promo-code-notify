/**
 * メール本文解析サービス
 * 要件定義書 第十二章に基づく
 *
 * 抽出対象:
 * - プロモコード文字列（英数字）
 * - コード入力期限（YYYY年M月D日形式）
 * - 有効期間（○日間、○時間形式）
 *
 * 注意:
 * - メールがHTMLの表形式で届く場合があり、コピペ時に段組情報が失われる可能性がある
 * - テキストを上から下へ走査し、見出しと値の近接関係により推定する
 */

import type { ParsedCodeInfo } from '@types/ipc'

/**
 * 有効期間のパターン
 */
interface ValidityPattern {
  pattern: RegExp
  toMinutes: (match: RegExpMatchArray) => number
}

/**
 * 日付の妥当性を検証（YYYY/MM/DDの範囲と実在日）
 */
function isValidDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

/**
 * 有効期間のパターン定義
 */
const VALIDITY_PATTERNS: ValidityPattern[] = [
  // 「7日間」形式
  {
    pattern: /(\d+)\s*日間?/,
    toMinutes: (match) => {
      const days = parseInt(match[1]!, 10)
      return days * 24 * 60
    }
  },
  // 「24時間」形式
  {
    pattern: /(\d+)\s*時間/,
    toMinutes: (match) => {
      const hours = parseInt(match[1]!, 10)
      return hours * 60
    }
  },
  // 「1時間」形式（漢数字対応）
  {
    pattern: /([一二三四五六七八九十]+)\s*時間/,
    toMinutes: (match) => {
      const hours = kanjiToNumber(match[1]!)
      return hours * 60
    }
  }
]

/**
 * 漢数字を数字に変換
 */
function kanjiToNumber(kanji: string): number {
  const kanjiMap: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10
  }
  // 単純な1〜10のみ対応
  return kanjiMap[kanji] ?? 0
}

/**
 * 入力期限のデフォルト日数（システム日時からの日数）
 */
const DEFAULT_INPUT_DEADLINE_DAYS = 156

/**
 * システム日時から指定日数後のISO 8601形式日時を生成
 * @param daysFromNow システム日時からの日数
 * @returns ISO 8601形式の日時文字列（日本時間23:59:59）
 */
function getDefaultInputDeadline(daysFromNow: number = DEFAULT_INPUT_DEADLINE_DAYS): string {
  const now = new Date()
  const targetDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000)

  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')

  // 入力期限は当日の23:59:59として解釈（日本時間）
  return `${year}-${month}-${day}T23:59:59.999+09:00`
}

/**
 * 日本語日付をISO 8601形式に変換
 * 例: "2026年6月20日（金）" → "2026-06-20T23:59:59.999+09:00"
 *
 * 注意: 期限は当日の23:59:59として解釈
 */
function parseJapaneseDate(text: string): string | null {
  // YYYY年M月D日 形式（曜日は任意）
  const match = /(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(text)
  if (!match) {
    return null
  }

  const year = Number.parseInt(match[1]!, 10)
  const month = Number.parseInt(match[2]!, 10)
  const day = Number.parseInt(match[3]!, 10)

  if (!isValidDateParts(year, month, day)) {
    return null
  }

  const paddedMonth = String(month).padStart(2, '0')
  const paddedDay = String(day).padStart(2, '0')

  // 入力期限は当日の23:59:59として解釈（日本時間）
  return `${year}-${paddedMonth}-${paddedDay}T23:59:59.999+09:00`
}

/**
 * 有効期間を分単位で抽出
 */
function extractValidityDuration(text: string): number | null {
  for (const { pattern, toMinutes } of VALIDITY_PATTERNS) {
    const match = pattern.exec(text)
    if (match) {
      return toMinutes(match)
    }
  }
  return null
}

/**
 * プロモコード候補を抽出
 * 英数字13〜15文字程度のパターンを探す
 */
function extractPromoCodes(text: string): string[] {
  // プロモコードは通常13〜15文字の英数字
  // 例: UL1H97X3CKAR6
  const codePattern = /\b[A-Z0-9]{10,20}\b/g
  const matches = text.match(codePattern)
  return matches ?? []
}

/**
 * 行配列からコード入力期限を検索
 */
function findInputDeadline(lines: string[], codeIndex: number): string | null {
  // コードの前後の行から「入力期限」を含む行を探す
  const searchRange = 10
  const deadlineRegex = /(入力期限|有効期限|期限)/

  for (
    let i = Math.max(0, codeIndex - searchRange);
    i < lines.length && i <= codeIndex + searchRange;
    i++
  ) {
    const line = lines[i] ?? ''

    if (deadlineRegex.test(line)) {
      // 同じ行または次の行から日付を抽出
      const dateFromSameLine = parseJapaneseDate(line)
      if (dateFromSameLine) {
        return dateFromSameLine
      }

      // 次の行をチェック
      const nextLine = lines[i + 1] ?? ''
      const dateFromNextLine = parseJapaneseDate(nextLine)
      if (dateFromNextLine) {
        return dateFromNextLine
      }
    }
  }

  // 見出しが見つからない場合、テキスト全体から日付を探す
  for (const line of lines) {
    const date = parseJapaneseDate(line)
    if (date) {
      return date
    }
  }

  // 日付が見つからない場合、デフォルト値（156日後）を返す
  return getDefaultInputDeadline()
}

/**
 * 行配列から有効期間を検索
 */
function findValidityDuration(lines: string[], codeIndex: number): number | null {
  // コードの前後の行から「データ使い放題」などの見出しを探す
  const searchRange = 10
  const validTitleRegex = /(データ使い放題|使い放題)/

  for (
    let i = Math.max(0, codeIndex - searchRange);
    i < lines.length && i <= codeIndex + searchRange;
    i++
  ) {
    const line = lines[i] ?? ''

    // 「データ使い放題」「○日間」「○時間」を含む行
    if (validTitleRegex.test(line)) {
      const duration = extractValidityDuration(line)
      if (duration !== null) {
        return duration
      }
    }
  }

  // 見出しが見つからない場合、全体から有効期間パターンを探す
  for (const line of lines) {
    const duration = extractValidityDuration(line)
    if (duration !== null) {
      return duration
    }
  }

  // デフォルトは7日間（10080分）
  return 10080
}

/**
 * メール本文からプロモコード情報を抽出
 */
export function parseEmailText(text: string): ParsedCodeInfo[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim())
  const codes = extractPromoCodes(text)

  // 重複を除去
  const uniqueCodes = [...new Set(codes)]

  if (uniqueCodes.length === 0) {
    return []
  }

  const results: ParsedCodeInfo[] = []

  for (const code of uniqueCodes) {
    // コードが出現する行のインデックスを取得
    const codeIndex = lines.findIndex((line) => line.includes(code))

    const inputDeadline = findInputDeadline(lines, codeIndex)
    const validityDurationMinutes = findValidityDuration(lines, codeIndex)

    results.push({
      code,
      inputDeadline,
      validityDurationMinutes
    })
  }

  return results
}

/**
 * 複数コードを含むメール本文を解析
 * 出現順に順序を付与
 */
export function parseEmailForRegistration(text: string): {
  success: boolean
  codes: ParsedCodeInfo[]
  error?: string
} {
  try {
    const codes = parseEmailText(text)

    if (codes.length === 0) {
      return {
        success: false,
        codes: [],
        error:
          'プロモコードが見つかりませんでした。英数字10〜20文字のコードを含むテキストを貼り付けてください。'
      }
    }

    return {
      success: true,
      codes
    }
  } catch (e) {
    const errorMessage = String(e)
    return {
      success: false,
      codes: [],
      error: `解析エラー: ${errorMessage}`
    }
  }
}

/**
 * 日本語日付文字列を解析（手入力用）
 * 複数の形式に対応
 */
export function parseDateInput(input: string): string | null {
  // ISO 8601形式（YYYY-MM-DD）
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
  if (isoMatch) {
    const year = Number.parseInt(isoMatch[1]!, 10)
    const month = Number.parseInt(isoMatch[2]!, 10)
    const day = Number.parseInt(isoMatch[3]!, 10)

    if (!isValidDateParts(year, month, day)) {
      return null
    }

    // 日本時間の23:59:59として解釈
    const isoDate = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    return `${isoDate}T23:59:59.999+09:00`
  }

  // YYYY/MM/DD形式
  const slashMatch = /^(\d{4})\/(\d{1,2})\/(\d{1,2})/.exec(input)
  if (slashMatch) {
    const year = Number.parseInt(slashMatch[1]!, 10)
    const month = Number.parseInt(slashMatch[2]!, 10)
    const day = Number.parseInt(slashMatch[3]!, 10)

    if (!isValidDateParts(year, month, day)) {
      return null
    }

    const paddedMonth = String(month).padStart(2, '0')
    const paddedDay = String(day).padStart(2, '0')
    return `${year}-${paddedMonth}-${paddedDay}T23:59:59.999+09:00`
  }

  // 日本語形式
  return parseJapaneseDate(input)
}

/**
 * 有効期間文字列を分単位に変換（手入力用）
 */
export function parseValidityInput(input: string): number | null {
  // 数字のみの場合は分として解釈
  if (/^\d+$/.test(input.trim())) {
    return parseInt(input.trim(), 10)
  }

  return extractValidityDuration(input)
}
