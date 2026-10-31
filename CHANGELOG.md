# 変更履歴

このプロジェクトの主な変更はこのファイルに記録します。

書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠します。

## [Unreleased]

### Changed

- GitHub Actions の月間利用時間を抑えるため、Dependabot version update と自動マージを毎週・即時処理から毎月28日（Asia/Tokyo）の月末一括処理へ変更した。
- 同じ参照の古いCIを取り消し、Bun依存キャッシュを再利用してWindows検証の待ち時間を短縮した。

### Security

- Electronの証明書対策と間接依存の脆弱性修正を取り込むため、Electron、fast-uri、undici、minimatchを安全版へ更新した。
- 依存更新PRのCIを妨げていたsharpとsource-map-jsの高重大度脆弱性を修正した。

- Electron 41.10.7 と系列別の間接依存修正版へ更新し、アプリと配布ツールの脆弱性を解消した。古い Electron ダウンローダー由来の機密キャッシュ問題を除くため、公式 @electron/get 5.1.0 へ限定移行した。

- 既知の脆弱性を解消するため、上流依存が旧版へ固定する fast-uri、nanoid、sharp を安全な patch 版へ更新し、Bun のロックファイルを再生成した。
- CI の依存監査で検出された高重大度の脆弱性を解消するため、Electron、fast-uri、brace-expansion、nanoid、undici、sharp を安全版へ更新した。

### Changed

- 共通指針とプロジェクト固有の実現手段を混同せず再利用できるように、文書の構成・環境・コマンド・調査知見を `findings.md` へ分離し、着手前の全文確認と参照導線を整えた。

- Dependabot PR #7〜#11を統合し、Vite 8と対応するelectron-vite・Reactプラグインへ移行した。製品と開発ツールの依存関係を互換性のある版へ更新した。


- 不具合・機能提案などの受付とPRの記入形式を揃え、プロジェクト固有の確認項目を残した。 READMEは既存の意味と手順を保ち、実装と異なる説明や読みにくい表現を修正した。

- 修正済み依存を含む新しい `bun.lock` を CI とリリースで読めるように、Bun の要求版を 1.4.0 へ更新した。
- 依存更新を安全に省力化するため、Dependabot の patch／minor PR を既存 CI の全チェック成功後に自動取り込みし、失敗ジョブを一度再実行し、必要なら `bun.lock` を限定して再生成する設定を追加した。
- GitHub Actions の Node.js 20 非推奨警告を解消するため、checkout と setup-node を Node.js 24 対応版へ更新した。
- リリースワークフローでも Node.js 24 対応ランタイムで動作させるため、checkout と setup-node を v7、action-gh-release を v3 へ更新した（Dependabot #2-#4 対応）。

- 作業開始時の共通指針見落としを防ぐため、調査やコマンド実行より前に `COMMON-AGENTS.md` を先頭から末尾まで読み、EOFを確認する必須ゲートを追加した。

### Fixed

- 更新後のelectron-builderが配布処理で使われるよう内部ライブラリを揃え、minimatch 11とESLint 10に合わせてlintプラグインの互換性を修正した。
- 開発用パッチと一時生成されたViteプロキシが配布物へ混入しないよう、梱包対象から除外した。
- 配布物へ内部指針や検証キャッシュを含めないよう、Windows梱包の除外対象を明示した。

- 型チェックが製品ソースを実際に検査するよう修正し、共有型の参照と省略可能な値の扱いを厳密な設定に合わせた。部分更新でundefinedが既存値を消さないようにした。

- CI と Dependabot の分類の実行順が前後しても更新を取りこぼさないよう、同じ PR 番号と head SHA を再照合する経路を追加した。
- CI のフォーマット検査に適合するよう、既存の IPC 関連型定義とハンドラーを整形した。

## [1.6.0] - 2026-07-16

### Added

- Windows ログオン時に画面を開かず通知機能を常駐させられるよう、`--start-in-tray` 起動引数を追加しました。
- 表示起動とトレイ起動を対話形式で選び、既存の関連タスクを確認後に置き換えられる PowerShell 7 用タスクスケジューラ登録スクリプトを追加しました。
