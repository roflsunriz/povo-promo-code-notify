# リリースノート

## v1.0.2 (2026-01-23)

### 変更概要

- **セキュリティ修正**: `tar`パッケージの脆弱性を解消（GHSA-8qq5-rm4j-mr97, GHSA-r6q2-hw4h-h46w）
- `electron-builder`を26.4.0→26.5.0にアップグレード
- `pnpm.overrides`で`tar`>=7.5.4を強制し、推移的依存の脆弱性に対応
- `electron-builder install-app-deps`のESM互換性問題を回避

### 互換性

- 破壊的変更はありません
- ネイティブモジュールを追加する場合は、upstream（@electron/rebuild）の修正を待つ必要があります

### 参考

- https://github.com/advisories/GHSA-8qq5-rm4j-mr97
- https://github.com/advisories/GHSA-r6q2-hw4h-h46w
- https://github.com/electron-userland/electron-builder/issues/9143

---

## v1.0.1 (2026-01-23)

### 変更概要

- READMEを大幅に拡充（機能説明、使い方ガイド、FAQ追加）
- GitHub Actionsによるリリース自動化ワークフローを追加
- タグプッシュでWindowsインストーラーを自動ビルド・公開

### 互換性

- 破壊的変更はありません

---

## v1.0.0 (2026-01-23)

### 変更概要

- IPC入力のバリデーションを追加し、mainプロセスで不正入力を遮断
- 相関ID付きの構造化ログと未捕捉エラーの収集を追加
- CIに`pnpm audit`と`format:check`を追加し品質ゲートを強化
- README/ADR/PRテンプレートを整備して運用情報を明確化
- テストカバレッジのブランチ閾値を90%に引き上げ

### 互換性

- 破壊的変更はありません

### 既知の制約

- `npm` 実行時に `shamefully-hoist` の警告が出ます（既存設定由来）
