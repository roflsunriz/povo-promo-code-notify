/**
 * Electron アプリ E2E テスト
 * 要件定義書 第十九章 受け入れ条件に基づく
 */

import { test, expect, type ElectronApplication, type Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  // Electron アプリを起動
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../out/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  })

  // 最初のウィンドウを取得
  page = await electronApp.firstWindow()

  // ウィンドウがロードされるまで待機
  await page.waitForLoadState('domcontentloaded')

  // ウィンドウサイズを設定（タブラベルが表示されるように）
  await page.setViewportSize({ width: 1280, height: 720 })
})

test.afterAll(async () => {
  // アプリを終了
  if (electronApp) {
    await electronApp.close()
  }
})

test.describe('受け入れ条件テスト', () => {
  test.describe('アプリ起動', () => {
    test('アプリが正常に起動すること', async () => {
      // ウィンドウが存在することを確認
      const windows = electronApp.windows()
      expect(windows.length).toBe(1)
    })

    test('起動時に概略タブが表示されること', async () => {
      // 概略タブがアクティブであることを確認
      const overviewTab = page.getByRole('tab', { name: '概略' })
      await expect(overviewTab).toBeVisible()
    })
  })

  test.describe('タブ構成', () => {
    test('5つのタブが存在すること', async () => {
      // 実際のタブ名に合わせて修正（「・」を使用）
      const tabs = ['概略', 'コード一覧', '登録', '編集・取り消し', '通知']

      for (const tabName of tabs) {
        const tab = page.getByRole('tab', { name: tabName })
        await expect(tab).toBeVisible()
      }
    })

    test('タブ切り替えが動作すること', async () => {
      // コード一覧タブをクリック
      await page.getByRole('tab', { name: 'コード一覧' }).click()
      // コード一覧タブがアクティブであることを確認
      const codesTab = page.getByRole('tab', { name: 'コード一覧' })
      await expect(codesTab).toHaveAttribute('aria-selected', 'true')

      // 登録タブをクリック
      await page.getByRole('tab', { name: '登録' }).click()
      const registerTab = page.getByRole('tab', { name: '登録' })
      await expect(registerTab).toHaveAttribute('aria-selected', 'true')

      // 概略タブに戻る
      await page.getByRole('tab', { name: '概略' }).click()
    })
  })

  test.describe('概略タブ', () => {
    test.beforeEach(async () => {
      await page.getByRole('tab', { name: '概略' }).click()
    })

    test('カバレッジ情報が表示されること', async () => {
      // カバレッジ終端または「カバレッジなし」が表示される
      const panel = page.getByRole('tabpanel')
      // 複数要素がある場合は first() を使用
      const hasContent = await panel.getByText('カバレッジ').first().isVisible()
      expect(hasContent).toBe(true)
    })
  })

  test.describe('登録タブ', () => {
    test.beforeEach(async () => {
      await page.getByRole('tab', { name: '登録' }).click()
    })

    test('メール本文入力エリアが存在すること', async () => {
      const textarea = page.getByRole('textbox', { name: /メール本文/i })
      await expect(textarea).toBeVisible()
    })

    test('手入力フォームが存在すること', async () => {
      // コード入力フィールド
      const codeInput = page.getByLabel(/コード/i).first()
      await expect(codeInput).toBeVisible()
    })
  })

  test.describe('通知タブ', () => {
    test.beforeEach(async () => {
      await page.getByRole('tab', { name: '通知' }).click()
    })

    test('通知設定が表示されること', async () => {
      const panel = page.getByRole('tabpanel')
      // 利用終了通知の見出しが表示される（first() で最初の要素を取得）
      await expect(panel.getByRole('heading', { name: '利用終了通知' })).toBeVisible()
    })

    test('テスト通知ボタンが存在すること', async () => {
      const testButton = page.getByRole('button', { name: /テスト通知/i })
      await expect(testButton).toBeVisible()
    })
  })
})

test.describe('データ操作テスト', () => {
  test.describe('コード登録フロー', () => {
    test('手入力フォームが存在すること', async () => {
      // 登録タブに移動
      await page.getByRole('tab', { name: '登録' }).click()

      // 手入力セクションの存在を確認
      const panel = page.getByRole('tabpanel')
      await expect(panel.getByRole('heading', { name: '手入力で追加' })).toBeVisible()
    })
  })
})
