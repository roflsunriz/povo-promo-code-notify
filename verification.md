# 検証手順

## Dependabot 自動処理（2026-09-23）

`.github/workflows/dependabot-automation.yml` を actionlint で検査し、PR 用 workflow 名（CI）と一致することを確認する。Dependabot の patch／minor かつ全 PR チェック成功の場合だけ取り込み、major・古い SHA・限定修復後も失敗した PR は残す。

実際の Dependabot PR がまだない場合、動作経路は未検証として扱う。実 PR 発生後に自動化ジョブ、CI の再試行、マージ結果を確認する。

## 依存脆弱性の確認（2026-09-23）

監査では fast-uri、nanoid、sharp を含む推移依存の旧版が検出された。Bun 1.4.0 で lockfile の固定インストールと再監査を行い、既知脆弱性 0 件を確認した。書式・lint・型・192件のテスト・ビルド成功。

初回の GitHub Windows CI は Bun 1.3.8 が `bun.lock` の形式3を読めずに失敗した。`packageManager` を Bun 1.4.0 に更新し、CI とリリースの setup-bun がこの値を読む構成で再確認する。

大量の Dependabot PR により CI 完了より分類が遅れる場合でも、分類後の `workflow_dispatch` が現在の PR 番号と head SHA を照合して再評価する。別の作成者、古い SHA、未完了の CI はマージしない。

## 2026-10-05: GitHub受付・READMEの整備（公開前）

- 比較元: `8083d3211e4ccad3f8f5919db64dca2a59467f72`（`main`）。
- 受付フォーム 2 件のYAML構造、重複キー・ID、入力型、選択肢、予約ファイル名を一括検査し、エラー0件。
- 既存の固有質問・入力例・必須条件を原文と照合。READMEのリンク・画像・コマンド・条件を確認し、裏付けがある誤記だけを訂正した。
- 既存のCI、Dependabot、labeler、ライセンスのファイル内容は比較元から変更していない。
- 製品のビルド・インストール・実機操作、GitHub上のフォーム表示、公開後CIは今回の静的検証に含めない。公開後に実際の受付表示と必要ラベルの適用を確認する。

## 2026-10-05: マージ後の依存監査失敗の修復

- 旧受付整備PRは既にマージ済みで、現在の既定ブランチCIに依存監査の失敗があることをGitHub APIと失敗ログで再確認した。過去の公開前記録を現在の成功根拠には使わない。
- `brace-expansion`、`fast-uri`、`js-yaml`、`undici` は親依存が要求するmajor系列ごとに修正版を指定する。全系列を新majorへ一律置換しない。
- `app-builder-lib -> @electron/get 3 -> got 11 -> cacheable-request -> http-cache-semantics` の経路を、公式 `@electron/get 5.1.0` へ限定移行した。Node.js 22.12以降が必要。既存 electron-builder 26.15.3 の `downloadArtifact` 呼び出し互換性は、Windowsインストーラー生成で確認した。
- npm配布の `http-cache-semantics 4.3.0` は監査上検出されなくても、private/Set-Cookie付きの非保存可能な応答に `max-stale=999999` を指定すると再利用されることをローカルPoCで確認した。安全版と扱わず、上記の依存経路そのものを新ダウンローダーへ移した。現在のロックに got/cacheable-request/http-cache-semantics はない。
- 固定インストール、全重大度の `bun audit`（0件）、lint、型、既存 192 テスト、main/preload/rendererビルドを確認。配布パッケージを作成し、非梱包ビルドを専用userDataで非表示起動して確認した。現在の配布物は起動前のオフライン照合を行う。公開、実ユーザーへのインストール、自動更新の実適用は行わない。
- Electron 41.10.7 で6タブ切り替えとプロモコードの登録・再読込・削除IPCを確認し、rendererのコンソールエラー0件。
- 非梱包ビルドの操作確認後、隔離フォルダでasarを作る間に文書を更新し、一時配布物のオフセットを破損させた。梱包済みJSを読んだ際に更新手順の本文が返り、検証用Electronのエラーダイアログが表示された。検証プロセスだけを終了し、元checkout・実ユーザーデータ・GitHubの配布物は変更していない。GUI再実行を停止し、入力を固定して再生成したasarの全out・同梱文書のサイズとSHA-256、抽出JSの構文をオフラインで照合する。
