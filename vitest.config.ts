import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/main/services/**/*.ts', 'src/types/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/index.ts',
        // electron-storeはメインプロセス専用のため、E2Eテストでカバー
        '**/store.ts',
        // 定数定義のみのためテスト不要
        'src/types/code.ts',
        // IPC通信層はメインプロセスとレンダラー間の連携のため、E2Eテストでカバー
        'src/types/ipc.ts',
        // 通知スケジューラーの発火ロジックはElectron Notification APIに依存するため、E2Eテストでカバー
        // 単体テストではスケジューリングロジックのみをカバー
        '**/notification-scheduler.ts',
      ],
      thresholds: {
        lines: 90,
        // branches は防御的コード（noUncheckedIndexedAccess 対応）やエラーハンドリングにより
        // 90% 達成が困難なため、85% を閾値とする
        // 未カバー分岐: email-parser.ts の catch ブロック、coverage.ts/next-candidate.ts の null チェック
        branches: 85,
        functions: 90,
        statements: 90,
      },
    },
    // タイムゾーン固定（Asia/Tokyo）
    env: {
      TZ: 'Asia/Tokyo',
    },
  },
  resolve: {
    alias: {
      '@types': resolve(__dirname, 'src/types'),
    },
  },
})
