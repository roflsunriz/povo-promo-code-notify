/**
 * メール本文解析サービスのテスト
 * 要件定義書 第十二章に基づく
 */

import { describe, expect, it } from 'vitest'
import { parseEmailText, parseEmailForRegistration, parseDateInput, parseValidityInput } from './email-parser'

describe('email-parser', () => {
  describe('parseEmailText', () => {
    describe('プロモコードの抽出', () => {
      it('単一のプロモコードを抽出できること', () => {
        const text = `
データ使い放題ボーナス（7日間）
UL1H97X3CKAR6

コードの入力期限
2026年6月20日（金）
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.code).toBe('UL1H97X3CKAR6')
      })

      it('複数のプロモコードを出現順に抽出できること', () => {
        const text = `
データ使い放題ボーナス（7日間）
ABCDEFGHIJ123

データ使い放題ボーナス（7日間）
XYZVWUT98765

コードの入力期限
2026年6月20日（金）
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(2)
        expect(result[0]?.code).toBe('ABCDEFGHIJ123')
        expect(result[1]?.code).toBe('XYZVWUT98765')
      })

      it('重複するコードは1つにまとめられること', () => {
        const text = `
コード: UL1H97X3CKAR6
確認用: UL1H97X3CKAR6
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.code).toBe('UL1H97X3CKAR6')
      })

      it('10〜20文字の英数字コードを抽出できること', () => {
        const text = `
短いコード: ABCD123456
長いコード: 12345678901234567890
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(2)
        expect(result[0]?.code).toBe('ABCD123456')
        expect(result[1]?.code).toBe('12345678901234567890')
      })

      it('コードがない場合は空配列を返すこと', () => {
        const text = '何もないテキスト'
        const result = parseEmailText(text)

        expect(result).toHaveLength(0)
      })

      it('短すぎるコードは抽出されないこと', () => {
        const text = 'SHORT123'
        const result = parseEmailText(text)

        expect(result).toHaveLength(0)
      })
    })

    describe('入力期限の抽出', () => {
      it('YYYY年M月D日形式の日付を抽出できること', () => {
        const text = `
UL1H97X3CKAR6
コードの入力期限
2026年6月20日（金）
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.inputDeadline).toBe('2026-06-20T23:59:59.999+09:00')
      })

      it('曜日なしのYYYY年M月D日形式を抽出できること', () => {
        const text = `
UL1H97X3CKAR6
入力期限: 2026年12月31日
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.inputDeadline).toBe('2026-12-31T23:59:59.999+09:00')
      })

      it('1桁の月・日を正しくパースできること', () => {
        const text = `
UL1H97X3CKAR6
入力期限: 2026年1月5日
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.inputDeadline).toBe('2026-01-05T23:59:59.999+09:00')
      })

      it('有効期限キーワードでも日付を抽出できること', () => {
        const text = `
UL1H97X3CKAR6
有効期限: 2026年3月15日
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.inputDeadline).toBe('2026-03-15T23:59:59.999+09:00')
      })

      it('期限キーワードでも日付を抽出できること', () => {
        const text = `
UL1H97X3CKAR6
期限: 2026年7月7日
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.inputDeadline).toBe('2026-07-07T23:59:59.999+09:00')
      })

      it('見出しがない場合でもテキスト内の日付を抽出すること', () => {
        const text = `
2026年8月10日
UL1H97X3CKAR6
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.inputDeadline).toBe('2026-08-10T23:59:59.999+09:00')
      })

      it('日付がない場合はnullになること', () => {
        const text = 'UL1H97X3CKAR6のみ'
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.inputDeadline).toBeNull()
      })

      it('無効な日付は抽出されないこと', () => {
        const text = `
UL1H97X3CKAR6
入力期限: 2026年2月30日
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.inputDeadline).toBeNull()
      })
    })

    describe('有効期間の抽出', () => {
      it('○日間形式を分単位で抽出できること', () => {
        const text = `
データ使い放題ボーナス（7日間）
UL1H97X3CKAR6
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(10080) // 7 * 24 * 60
      })

      it('1日間を正しく抽出できること', () => {
        const text = `
データ使い放題（1日間）
UL1H97X3CKAR6
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(1440) // 1 * 24 * 60
      })

      it('○時間形式を分単位で抽出できること', () => {
        const text = `
データ使い放題（24時間）
UL1H97X3CKAR6
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(1440) // 24 * 60
      })

      it('1時間を正しく抽出できること', () => {
        const text = `
データ使い放題（1時間）
UL1H97X3CKAR6
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(60)
      })

      it('漢数字の時間を抽出できること', () => {
        const text = `
データ使い放題（一時間）
UL1H97X3CKAR6
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(60)
      })

      it('使い放題キーワードで有効期間を抽出できること', () => {
        const text = `
使い放題 3日間
UL1H97X3CKAR6
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(4320) // 3 * 24 * 60
      })

      it('見出しがない場合でもテキスト内の有効期間パターンを抽出すること', () => {
        const text = `
UL1H97X3CKAR6
有効: 14日間
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(20160) // 14 * 24 * 60
      })

      it('見出しに期間がない場合は別行の期間を採用すること', () => {
        const text = `
データ使い放題ボーナス
UL1H97X3CKAR6
有効: 3日間
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(4320) // 3 * 24 * 60
      })

      it('有効期間パターンがない場合はデフォルト7日間になること', () => {
        const text = 'UL1H97X3CKAR6'
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.validityDurationMinutes).toBe(10080) // デフォルト7日間
      })
    })

    describe('実際のメール形式', () => {
      it('povoメール形式を正しく解析できること', () => {
        const text = `
povo2.0のご利用ありがとうございます。

■データ使い放題ボーナス（7日間）について
以下のプロモコードをご利用ください。

データ使い放題ボーナス（7日間）
UL1H97X3CKAR6

コードの入力期限
2026年6月20日（金）

※本コードは上記期限までにpovo2.0アプリにてご入力ください。
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(1)
        expect(result[0]?.code).toBe('UL1H97X3CKAR6')
        expect(result[0]?.inputDeadline).toBe('2026-06-20T23:59:59.999+09:00')
        expect(result[0]?.validityDurationMinutes).toBe(10080)
      })

      it('複数コードを含むメールを正しく解析できること', () => {
        const text = `
データ使い放題ボーナス（7日間）
AAAA1111BBBB1

データ使い放題ボーナス（7日間）
CCCC2222DDDD2

データ使い放題ボーナス（7日間）
EEEE3333FFFF3

コードの入力期限
2026年12月31日（水）
        `
        const result = parseEmailText(text)

        expect(result).toHaveLength(3)
        expect(result[0]?.code).toBe('AAAA1111BBBB1')
        expect(result[1]?.code).toBe('CCCC2222DDDD2')
        expect(result[2]?.code).toBe('EEEE3333FFFF3')
        // すべてのコードに同じ入力期限が適用される
        expect(result[0]?.inputDeadline).toBe('2026-12-31T23:59:59.999+09:00')
        expect(result[1]?.inputDeadline).toBe('2026-12-31T23:59:59.999+09:00')
        expect(result[2]?.inputDeadline).toBe('2026-12-31T23:59:59.999+09:00')
      })
    })
  })

  describe('parseEmailForRegistration', () => {
    it('成功時にsuccessがtrueになること', () => {
      const text = `
データ使い放題ボーナス（7日間）
UL1H97X3CKAR6
入力期限: 2026年6月20日
      `
      const result = parseEmailForRegistration(text)

      expect(result.success).toBe(true)
      expect(result.codes).toHaveLength(1)
      expect(result.error).toBeUndefined()
    })

    it('コードが見つからない場合にsuccessがfalseになること', () => {
      const text = 'コードがないテキスト'
      const result = parseEmailForRegistration(text)

      expect(result.success).toBe(false)
      expect(result.codes).toHaveLength(0)
      expect(result.error).toContain('プロモコードが見つかりませんでした')
    })

    it('複数コードを正常に処理できること', () => {
      const text = `
ABCDEF123456
GHIJKL789012
MNOPQR345678
      `
      const result = parseEmailForRegistration(text)

      expect(result.success).toBe(true)
      expect(result.codes).toHaveLength(3)
    })

    it('不正な入力で例外が発生してもエラーを返すこと', () => {
      const invalidInput = null as unknown as string
      const result = parseEmailForRegistration(invalidInput)

      expect(result.success).toBe(false)
      expect(result.codes).toHaveLength(0)
      expect(result.error).toContain('解析エラー')
    })
  })

  describe('parseDateInput', () => {
    describe('ISO 8601形式', () => {
      it('YYYY-MM-DD形式を解析できること', () => {
        const result = parseDateInput('2026-06-20')

        expect(result).toBe('2026-06-20T23:59:59.999+09:00')
      })

      it('YYYY-MM-DDTHH:MM:SS形式を解析できること', () => {
        const result = parseDateInput('2026-06-20T12:00:00')

        expect(result).toBe('2026-06-20T23:59:59.999+09:00')
      })
    })

    describe('YYYY/MM/DD形式', () => {
      it('スラッシュ区切りの日付を解析できること', () => {
        const result = parseDateInput('2026/06/20')

        expect(result).toBe('2026-06-20T23:59:59.999+09:00')
      })

      it('1桁の月・日を正しくパースできること', () => {
        const result = parseDateInput('2026/1/5')

        expect(result).toBe('2026-01-05T23:59:59.999+09:00')
      })
    })

    describe('日本語形式', () => {
      it('YYYY年M月D日形式を解析できること', () => {
        const result = parseDateInput('2026年6月20日')

        expect(result).toBe('2026-06-20T23:59:59.999+09:00')
      })

      it('曜日付きの日本語日付を解析できること', () => {
        const result = parseDateInput('2026年6月20日（金）')

        expect(result).toBe('2026-06-20T23:59:59.999+09:00')
      })

      it('1桁の月・日を正しくパースできること', () => {
        const result = parseDateInput('2026年1月5日')

        expect(result).toBe('2026-01-05T23:59:59.999+09:00')
      })
    })

    describe('無効な入力', () => {
      it('無効な文字列の場合はnullを返すこと', () => {
        const result = parseDateInput('invalid')

        expect(result).toBeNull()
      })

      it('空文字の場合はnullを返すこと', () => {
        const result = parseDateInput('')

        expect(result).toBeNull()
      })

      it('存在しない日付はnullを返すこと（ISO）', () => {
        const result = parseDateInput('2026-02-30')

        expect(result).toBeNull()
      })

      it('存在しない日付はnullを返すこと（スラッシュ）', () => {
        const result = parseDateInput('2026/02/30')

        expect(result).toBeNull()
      })

      it('存在しない日付はnullを返すこと（日本語）', () => {
        const result = parseDateInput('2026年2月30日')

        expect(result).toBeNull()
      })

      it('範囲外の月はnullを返すこと（ISO）', () => {
        expect(parseDateInput('2026-00-10')).toBeNull()
        expect(parseDateInput('2026-13-10')).toBeNull()
      })

      it('範囲外の月はnullを返すこと（スラッシュ）', () => {
        expect(parseDateInput('2026/0/10')).toBeNull()
        expect(parseDateInput('2026/13/10')).toBeNull()
      })

      it('範囲外の月はnullを返すこと（日本語）', () => {
        expect(parseDateInput('2026年0月10日')).toBeNull()
        expect(parseDateInput('2026年13月10日')).toBeNull()
      })

      it('範囲外の日はnullを返すこと', () => {
        expect(parseDateInput('2026-01-00')).toBeNull()
        expect(parseDateInput('2026-01-32')).toBeNull()
        expect(parseDateInput('2026/1/0')).toBeNull()
        expect(parseDateInput('2026/1/32')).toBeNull()
        expect(parseDateInput('2026年1月0日')).toBeNull()
        expect(parseDateInput('2026年1月32日')).toBeNull()
      })
    })
  })

  describe('parseValidityInput', () => {
    describe('数字のみ', () => {
      it('数字のみの入力を分として解釈すること', () => {
        const result = parseValidityInput('60')

        expect(result).toBe(60)
      })

      it('大きな数字も正しく解釈すること', () => {
        const result = parseValidityInput('10080')

        expect(result).toBe(10080)
      })

      it('前後の空白を無視すること', () => {
        const result = parseValidityInput('  120  ')

        expect(result).toBe(120)
      })
    })

    describe('日数形式', () => {
      it('○日間形式を分に変換すること', () => {
        const result = parseValidityInput('7日間')

        expect(result).toBe(10080) // 7 * 24 * 60
      })

      it('○日形式を分に変換すること', () => {
        const result = parseValidityInput('3日')

        expect(result).toBe(4320) // 3 * 24 * 60
      })
    })

    describe('時間形式', () => {
      it('○時間形式を分に変換すること', () => {
        const result = parseValidityInput('24時間')

        expect(result).toBe(1440) // 24 * 60
      })

      it('1時間を分に変換すること', () => {
        const result = parseValidityInput('1時間')

        expect(result).toBe(60)
      })

      it('漢数字の時間を分に変換すること', () => {
        const result = parseValidityInput('一時間')

        expect(result).toBe(60)
      })

      it('漢数字「二」を正しく処理すること', () => {
        const result = parseValidityInput('二時間')

        expect(result).toBe(120)
      })

      it('漢数字「三」を正しく処理すること', () => {
        const result = parseValidityInput('三時間')

        expect(result).toBe(180)
      })

      it('漢数字「十」を正しく処理すること', () => {
        const result = parseValidityInput('十時間')

        expect(result).toBe(600)
      })
    })

    describe('無効な入力', () => {
      it('無効な文字列の場合はnullを返すこと', () => {
        const result = parseValidityInput('invalid')

        expect(result).toBeNull()
      })

      it('空文字の場合はnullを返すこと', () => {
        const result = parseValidityInput('')

        expect(result).toBeNull()
      })
    })
  })

  describe('エッジケース', () => {
    it('CRLFの改行を正しく処理できること', () => {
      const text = 'UL1H97X3CKAR6\r\n入力期限: 2026年6月20日'
      const result = parseEmailText(text)

      expect(result).toHaveLength(1)
      expect(result[0]?.inputDeadline).toBe('2026-06-20T23:59:59.999+09:00')
    })

    it('前後の空白がある行を正しく処理できること', () => {
      const text = `
        UL1H97X3CKAR6        
        入力期限: 2026年6月20日
      `
      const result = parseEmailText(text)

      expect(result).toHaveLength(1)
    })

    it('空行が多い場合も正しく処理できること', () => {
      const text = `


UL1H97X3CKAR6


入力期限


2026年6月20日


      `
      const result = parseEmailText(text)

      expect(result).toHaveLength(1)
      expect(result[0]?.inputDeadline).toBe('2026-06-20T23:59:59.999+09:00')
    })

    it('ISO 8601形式の無効な日付の場合はnullを返すこと', () => {
      // 形式は正しいが日付として無効
      const result = parseDateInput('2026-99-99')

      expect(result).toBeNull()
    })

    it('日数の「間」がない形式も解析できること', () => {
      const result = parseValidityInput('30日')

      expect(result).toBe(43200) // 30 * 24 * 60
    })
  })
})
