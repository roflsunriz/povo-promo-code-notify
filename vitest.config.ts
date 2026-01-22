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
        // electron-storeはメインプロセス専用のため、E2Eテスト（Phase 6）でカバー
        '**/store.ts',
        // 定数定義のみのためテスト不要
        'src/types/code.ts',
      ],
      thresholds: {
        lines: 90,
        branches: 90,
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
