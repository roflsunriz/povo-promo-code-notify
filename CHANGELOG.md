# 変更履歴

このプロジェクトの主な変更はこのファイルに記録します。

書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠します。

## [Unreleased]

### Security

- 既知の脆弱性を解消するため、上流依存が旧版へ固定する fast-uri、nanoid、sharp を安全な patch 版へ更新し、Bun のロックファイルを再生成した。
- CI の依存監査で検出された高重大度の脆弱性を解消するため、Electron、fast-uri、brace-expansion、nanoid、undici、sharp を安全版へ更新した。

### Changed

- 修正済み依存を含む新しい `bun.lock` を CI とリリースで読めるように、Bun の要求版を 1.4.0 へ更新した。
- 依存更新を安全に省力化するため、Dependabot の patch／minor PR を既存 CI の全チェック成功後に自動取り込みし、失敗ジョブを一度再実行し、必要なら `bun.lock` を限定して再生成する設定を追加した。
- GitHub Actions の Node.js 20 非推奨警告を解消するため、checkout と setup-node を Node.js 24 対応版へ更新した。

- 作業開始時の共通指針見落としを防ぐため、調査やコマンド実行より前に `COMMON-AGENTS.md` を先頭から末尾まで読み、EOFを確認する必須ゲートを追加した。

### Fixed

- CI のフォーマット検査に適合するよう、既存の IPC 関連型定義とハンドラーを整形した。

## [1.6.0] - 2026-07-16

### Added

- Windows ログオン時に画面を開かず通知機能を常駐させられるよう、`--start-in-tray` 起動引数を追加しました。
- 表示起動とトレイ起動を対話形式で選び、既存の関連タスクを確認後に置き換えられる PowerShell 7 用タスクスケジューラ登録スクリプトを追加しました。
