# 検証手順

## 2026-10-31: Dependabot PR #13

- electron-builder 26.18.0と内部ライブラリの実効版を揃え、Electron 44.10.0、fast-uri、undici、minimatchの修正版を取り込んだ。Bun 1.4.0で固定インストール、全重大度監査578パッケージ0件、lint、型、199テスト、ビルドが成功した。
- minimatch 11に合わせた2つのlintプラグインのパッチは、import禁止・順序・自動修正時のコメント保持、React除外glob、隠しパスを回帰テストで確認した。`**` の隠しパスは旧 `makeRe` と判定が異なるため、今後のルール設定時に考慮する。
- 専用userData・非表示ウィンドウを使う依存更新E2Eで、6タブ、登録・編集・開始・取消・削除、設定の保存と再起動後の復元を確認した。実ユーザーデータは使用していない。
- Windows NSISインストーラーを `--publish never` で生成し、更新メタデータの版・サイズ・SHA-512を照合した。asarの全ファイルをサイズとSHA-256で照合し、出力ファイルと同梱文書を元ファイルと比較、抽出JavaScriptの構文を確認した。開発用パッチや一時プロキシ、内部指針が含まれないことも確認した。公開・インストール・自動更新の実適用は行っていない。

## 2026-10-19: CI高速化

- 変更したGitHub Actionsをactionlint 1.7.12で検査し、エラー0件を確認した。
- GitHub上の未解決Dependabot更新PRと依存脆弱性アラートがともに0件であることを確認した。

## 2026-10-16: findings.mdへの文書分離

- 比較元: `4fbe947aaeec62b701fcd175be8f3050fef03218`。目的は、共通の行動規律と固有の実現手段・過去の知見を分け、次の作業者が着手前に全文確認できるようにすること。
- 13件の移動本文を元文書と照合し、空白・改行以外の本文を保持した。旧見出しのアンカー、findingsへの参照、Markdownのコードフェンス、UTF-8、`git diff --check`を確認した。利用者向け導入・操作手順はREADMEへ残した。
- GitHubの既存Dependabotアラート0件、Open PR 0件を確認した。依存定義・lockfileに変更なし。更新確認は既存の更新PRの有無を確認した範囲であり、全依存の最新バージョン一致を意味しない。
- 新規の外部依存監査は未実施。今回の横断作業では外部監査送信が自動承認レビューで拒否されたため、既存GitHub警告の読み取りとローカルの文書・依存ファイル差分確認を代替にした。新しい脆弱性データベースとの照合結果として扱わない。再開には外部監査が許可された環境または更新済みのローカルDBが必要。
- 文書だけの変更のため、アプリのビルド・配布・インストール・実機操作・稼働プロセスの再起動は実行していない。実装や端末の動作を再検証済みとは扱わない。

## Dependabot 自動処理（2026-09-23）

`.github/workflows/dependabot-automation.yml` を actionlint で検査し、PR 用 workflow 名（CI）と一致することを確認する。Dependabot の majorを含め全 PR チェック成功の場合だけ取り込み、古い SHA・限定修復後も失敗した PR は残す。

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

## 2026-10-15: Open PR #7〜#11の統合と互換性修正

- 5件の失敗原因はsharp 0.35.4とsource-map-js 1.2.1の高重大度脆弱性。sharp 0.35.5とsource-map-js 1.2.2へ更新し、全重大度監査0件を確認した。source-map-jsは1系列へ限定したoverrideを使う。
- Vite 8.3.4、electron-vite 6、Reactプラグイン6、Electron 44.7.2、electron-store 12、Vitest 5へ移行した。TypeScript 7はparserのpeer範囲外のため6.0.3を選んだ。
- 従来のtype-checkは参照先ソースを検査していなかった。node/webを明示した型チェックに修正し、共有型alias、preload宣言、optional値、React refを修正した。undefinedを除く回帰テストを追加した。
- 品質検証はbun install --frozen-lockfile、bun audit、bun run lint、bun run format:check、bun run type-check、bun run test、bun run buildを使う。製品操作はbunx playwright test e2e/dependency-update.e2e.ts --reporter=listで、隔離した一時userDataと非表示ウィンドウに限定する。
- Vite 8の移行根拠: https://vite.dev/guide/migration 。配布パッケージは--publish neverで作成し、実ユーザーへのインストール・自動更新適用・Release公開は行わない。


### 今回の実行結果

- 固定インストール、全重大度監査（0件）、lint、書式、node/webの実体型検査、単体194件、3プロセスのビルドが成功した。
- 隔離E2Eが成功した。1280x720と800x600で6タブ切替、横はみ出しなし、登録・編集（undefined保持）・開始・取消・削除、設定保存、再読込と再起動後の永続化を確認した。rendererエラー0件。既存の実ユーザーデータを利用するE2E全体は実行せず、専用の隔離テストを使った。
- Windows NSISインストーラーとblockmapの生成が成功した。既存ミラーの取得は進行が止まったため検証用プロセスを停止し、postinstallで取得済みのElectron 44.7.2を--config.electronDist=node_modules/electron/distで指定した。標準ミラー経由の再取得は未検証として残る。
- 梱包内容の検査でGit管理外のCOMMON-AGENTS.md、検証用tmp、TypeScriptキャッシュが混入する既存設定を検出し、開発専用ディレクトリとともにfilesの除外対象へ追加した。
- 最終asarの全outと同梱文書15ファイルについて、元ファイルとのサイズ・SHA-256一致を確認した。抽出JS 3ファイルの構文検査が成功し、内部指針・開発用ディレクトリ・ルートのtmpとtsbuildinfoが含まれないことを確認した。

## 2026-10-20: Dependabot 月末一括処理

- `.github/dependabot.yml` は毎月28日00:00、`.github/workflows/dependabot-automation.yml` は同日18:00（いずれも `Asia/Tokyo`）に設定した。呼び出し先は検証済み共通 workflow の固定 SHA とし、現在の head SHA、Dependabot の資格状態、全 PR チェック成功を merge 前に再確認する。
- YAML 構文、変更差分、空白エラーをローカルで検査した。実際の月末 schedule と Dependabot PR の merge 経路は、次回の毎月28日実行で確認する。
