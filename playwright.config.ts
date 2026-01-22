/**
 * Playwright E2E テスト設定
 * Electron アプリのテスト用
 */

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Electron テストは並列実行しない
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1, // Electron テストはシングルワーカーで実行
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  timeout: 60000, // 60秒タイムアウト
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.e2e\.ts/
    }
  ]
})
