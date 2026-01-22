# povo プロモコード管理

povo 2.0のプロモコードを管理するWindows 11向けデスクトップアプリケーションです。

## 機能

- プロモコードの台帳管理
- コード入力期限・有効期限の追跡
- 連続カバレッジ（回線が途切れない期間）の可視化
- Windows通知による期限リマインダー
- JSONエクスポート/インポート

## 技術スタック

- **Electron** - デスクトップアプリフレームワーク
- **React** - UIライブラリ
- **TypeScript** - 型安全な開発
- **TailwindCSS** - スタイリング
- **Vite / electron-vite** - ビルドツール
- **Zod** - バリデーション
- **Vitest** - テストフレームワーク

## 環境構築

### 前提条件

- Node.js 22以上
- pnpm 10以上

### セットアップ

```bash
# 依存パッケージのインストール
pnpm install

# 開発サーバー起動
pnpm dev
```

## 開発コマンド

```bash
# 開発サーバー起動（HMR有効）
pnpm dev

# リンター実行
pnpm lint

# リンター自動修正
pnpm lint:fix

# 型チェック
pnpm type-check

# フォーマット
pnpm format

# テスト実行
pnpm test

# テスト（監視モード）
pnpm test:watch

# カバレッジ付きテスト
pnpm test:coverage

# プロダクションビルド
pnpm build

# Windowsインストーラー作成
pnpm build:win
```

## ディレクトリ構造

```
src/
├── main/           # Electronメインプロセス
├── preload/        # preloadスクリプト
├── renderer/       # Reactアプリ（レンダラープロセス）
│   └── src/
│       ├── components/  # UIコンポーネント
│       ├── hooks/       # カスタムフック
│       └── utils/       # ユーティリティ
└── types/          # 型定義（一元管理）
```

## ライセンス

MIT
