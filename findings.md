# povo-promo-code-notify の実現手段と調査知見

作業着手前にこの文書を全文読む。共通方針と目的・行動義務・禁止事項は [AGENTS.md](AGENTS.md) を参照する。

## 共通方針に対する固有の実現手段

- 対象の共通ルール: 設計と実装方針のBunバンドラー原則、検証。
- 理由: 既存のElectron main/preload/rendererをelectron-viteで生成し、配布物をelectron-builderで梱包しているため。
- 適用範囲: package.jsonに定義したElectronのビルドと梱包。
- 代替手段・検証: ESLint・Prettier・両tsconfigの型検査・Vitest・ビルドと、必要時に隔離Electron E2Eとasar実体検査を使う。
- 文書構成: 実現手段・環境・過去の調査知見はこの文書を正本とする。利用者向け導入・使用法はREADME、更新の入口はhow-to-update、実測結果はverification、変更意図はCHANGELOGに残す。共通方針の品質・秘密情報保護・ユーザー指示を免除しない。
- 移行基準: 2026-10-16の既定ブランチ `4fbe947aaeec62b701fcd175be8f3050fef03218`。以下は出典の本文を移動したもので、過去の確認日時・適用条件・未検証事項を維持する。


<a id="agents-2"></a>

移動元: [AGENTS.md](AGENTS.md)。

## パッケージ管理

- パッケージマネージャは Bun を使用する。


<a id="agents-3"></a>

移動元: [AGENTS.md](AGENTS.md)。

## 依存監査で確定した事項（2026-09-23）

- `bun audit fix` だけでは fast-uri、nanoid、sharp の脆弱版が上流の厳密な依存範囲で残る。`package.json` の既存 `overrides` と `bun.lock` を同時に更新し、`bun audit` と関連テスト・ビルドで確認する。上流が安全版を取り込んだ場合は override の必要性を再評価する。
- Bun 1.4.0 で再生成した `bun.lock` は lockfile 形式3で、Bun 1.3.8 の CI は読めない。`packageManager` を下げるときは lockfile の形式と CI/Release の固定インストールを同時に確認する。setup-bun v2 は `packageManager` から Bun 版を解決する。


<a id="agents-4"></a>

移動元: [AGENTS.md](AGENTS.md)。

## Dependabot の限定修復（2026-09-23）

- CI 再失敗後の自動修復は `bun.lock` だけをパッチとして適用する。修復後は `workflow_dispatch` で `.github/workflows/ci.yml` を再実行するため、この CI の `contents: read` と checkout の `persist-credentials: false` を維持し、PR コードを実行するジョブへ書き込み権限や秘密情報を渡さない。根拠は `.github/workflows/dependabot-automation.yml` と共通ワークフローの権限分離。


<a id="agents-5"></a>

移動元: [AGENTS.md](AGENTS.md)。

## 系列別の依存修復（2026-10-05）

- 全majorへの一律overrideを避け、親パッケージの要求系列に合う修正版をversion-scoped overrideで選ぶ。lockfileの実効版、固定インストール、全重大度監査と製品チェックを確認する。
- electron-builder 26.15.3が取り込む旧 @electron/get 3 は got/cacheable-request 経由で未解決の機密キャッシュ問題を持つため、公式5.1.0へ限定移行する。Node.js 22.12以降が必要で、downloadArtifact互換性はWindows梱包でも確認する。http-cache-semantics 4.3.0の監査0件だけでは安全性を判断しない。PoCと実際の経路は `verification.md` を参照。
- asarの梱包中は文書も含めて入力ファイルを変更しない。ヘッダーへ記録したサイズと実際の書き込みがずれ、JSを読んだ際に別ファイルの本文が返る破損を実測した。起動より先に全outと同梱文書のサイズ・ハッシュ、抽出JSの構文をオフライン検査する。


<a id="agents-6"></a>

移動元: [AGENTS.md](AGENTS.md)。

## 実体を検査する型チェック（2026-10-15）

- ルートtsconfigはfilesが空でreferencesのみのため、tsc --noEmitだけでは製品ソースを検査しない。type-checkはnode/web両プロジェクトを明示指定する。共有型のaliasはTypeScript予約スコープとの衝突を避けて@sharedを使う。
- preloadのindex.tsと同名のindex.d.tsは同一プロジェクトで読み込まれない場合があるため、Window宣言はapi.d.tsに分離する。E2Eもこの宣言を参照する。
- TypeScript 7はtypescript-eslint 8.71.2のpeer範囲（6.1未満）外なので6.0系列を使う。更新時に公式npmメタデータを再確認する。Vite 8はelectron-vite 6とReactプラグイン6を組み合わせ、vitest設定はESMの.mtsで保管する。
- 依存更新の隔離操作確認はbunx playwright test e2e/dependency-update.e2e.ts --reporter=listを使う。userDataを製品import前に一時フォルダへ設定し、--start-in-trayで非表示起動する。実ユーザーデータを使う既存E2Eとは区別する。


- electron-builderはGitのignoreを配布除外に使わず、COMMON-AGENTS.mdのリンク先やルートのtmp・tsbuildinfoも梱包する。electron-builder.ymlのfiles除外を保ち、asar一覧で開発用データの混入を確認する。


<a id="readme-4"></a>

移動元: [README.md](README.md)。

## 技術スタック

- **Electron** - デスクトップアプリフレームワーク
- **React** - UIライブラリ
- **TypeScript** - 型安全な開発
- **TailwindCSS** - スタイリング
- **Vite / electron-vite** - ビルドツール
- **bun** - パッケージマネージャ
- **Zod** - バリデーション
- **Vitest** - テストフレームワーク
- **Playwright** - E2Eテスト


<a id="readme-5"></a>

移動元: [README.md](README.md)。

## 開発者向け情報

### 環境構築

#### 前提条件

- Node.js 22.12以上（CIではNode.js 22を使用）
- Bun 1.4.0以上（`bun.lock` の形式に対応するため）

#### セットアップ

```bash
# 依存パッケージのインストール
bun install

# 開発サーバー起動
bun run dev
```

### 開発コマンド

```bash
# 開発サーバー起動（HMR有効）
bun run dev

# リンター実行
bun run lint

# リンター自動修正
bun run lint:fix

# 型チェック
bun run type-check

# フォーマット
bun run format

# テスト実行
bun run test

# テスト（監視モード）
bun run test:watch

# カバレッジ付きテスト
bun run test:coverage

# E2Eテスト
bun run test:e2e

# プロダクションビルド
bun run build

# Windowsインストーラー作成
bun run build:win
```

### 環境変数

現在は必須の環境変数はありません。必要になった場合は `.env.example` を用意し、`dotenv-safe` で検証します。

### ディレクトリ構造

```
src/
├── main/              # Electronメインプロセス
│   ├── services/      # ビジネスロジック
│   │   ├── code-status.ts      # コードステータス計算
│   │   ├── coverage.ts         # カバレッジ計算
│   │   ├── email-parser.ts     # メール本文解析
│   │   ├── next-candidate.ts   # 次候補コード選定
│   │   ├── notification-scheduler.ts  # 通知スケジュール
│   │   └── store.ts            # データ永続化
│   ├── ipc-handlers.ts         # IPC通信ハンドラ
│   ├── observability.ts        # ログ・エラー収集
│   └── index.ts                # エントリポイント
├── preload/           # preloadスクリプト
├── renderer/          # Reactアプリ（レンダラープロセス）
│   └── src/
│       ├── components/         # UIコンポーネント
│       │   ├── ui/             # 汎用UIパーツ
│       │   ├── OverviewTab.tsx # ダッシュボード
│       │   ├── CodesListTab.tsx # コード一覧
│       │   ├── RegisterTab.tsx  # 登録
│       │   ├── EditTab.tsx      # 編集
│       │   └── NotificationTab.tsx # 通知設定
│       └── hooks/              # カスタムフック
└── types/             # 型定義（一元管理）
    ├── code.ts        # ドメイン型
    ├── ipc.ts         # IPC通信型
    └── schemas.ts     # Zodスキーマ
```

### リリース手順

1. `package.json` のバージョンを更新
2. `CHANGELOG.md` と `docs/RELEASE_NOTES.md` に変更内容を記載
3. 変更をコミット・プッシュ
4. タグを作成してプッシュ: `git tag v1.x.x && git push origin v1.x.x`
5. GitHub Actions がインストーラーをビルドし、Releaseを自動作成


<a id="readme-6"></a>

移動元: [README.md](README.md)。

## 運用・デプロイ

- Windows向けの配布物は `bun build:win` で作成します
- 生成物は `release/`（electron-builderの出力先）に配置されます
- GitHub Releasesから最新版をダウンロードできます


<a id="readme-10"></a>

移動元: [README.md](README.md)。

## 依存更新の自動処理

Dependabot は対象の依存関係を毎週確認します。majorを含む更新は、互換性を確認し、PR のチェック（CI）が成功した後に自動で squash merge されます。CI の失敗ジョブは 1 回だけ再実行します。再失敗時は読み取り権限のジョブで `bun.lock` を再生成し、限定した修正コミットで CI を再実行します。修復できない PR は残します。互換性修正が必要な更新は、手動で修正・検証してから取り込みます。


<a id="update-1"></a>

移動元: [how-to-update.md](how-to-update.md)。

## Dependabot PR の更新

前提は `.github/dependabot.yml` と PR 用 CI（CI）です。更新 PR の head SHA と `gh pr checks <PR番号>` の結果を確認してください。majorを含め、互換性を確認して全チェック成功後に自動取り込みされます。初回 CI 失敗は failed jobs のみを 1 回再実行し、再失敗時は `bun.lock` の再生成を試み、修復後の CI を再実行します。変更がない場合や再度失敗した場合は PR を残します。

設定を変えたときは `actionlint .github/workflows/dependabot-automation.yml` と実際の PR の Actions 結果を確認します。問題があれば呼び出し先の共通 workflow SHA を直前の検証済み値へ戻すコミットを push します。取り込まれた依存更新に問題があれば通常の revert コミットで復旧します。


<a id="update-2"></a>

移動元: [how-to-update.md](how-to-update.md)。

## 依存脆弱性の更新

`package.json` の `overrides` は、上流パッケージが fast-uri、nanoid、sharp の旧版を固定している間に安全な patch 版を選ぶために使う。上流が安全版を採用したら override を減らせるか確認する。更新時は `bun install --lockfile-only --ignore-scripts`、`bun install --frozen-lockfile`、`bun audit` を実行し、該当する lint・型・テスト・ビルドを確認する。問題があれば更新コミットを revert し、lockfile と package.json を同じ版へ戻す。

CI 完了より Dependabot の分類が遅れる場合は、`callback_workflow_file` が指す呼び出し側 workflow を `workflow_dispatch` し、同じ PR 番号・head SHA・全チェックを再確認する。呼び出し側のファイル名を変える際はこの入力も一緒に更新する。


<a id="update-3"></a>

移動元: [how-to-update.md](how-to-update.md)。

## 系列別overrideの保守

`package.json` のversion-scoped overrideは親依存のmajor範囲を確認して更新し、同じBunでlockfile生成・固定インストール・全重大度監査・既存品質チェックを実行してください。上流が修正版を取り込んだ際は不要なoverrideを外せるか確認します。問題があれば修復コミットを通常のrevertで戻し、package.jsonとlockfileを同じ版に保ちます。今回の既知制約と配布検証は `verification.md` を参照してください。


<a id="update-4"></a>

移動元: [how-to-update.md](how-to-update.md)。

## Vite 8以降の更新

Viteはelectron-viteとReactプラグインのpeerDependenciesを同時に確認して更新します。Vite 8への移行ではelectron-vite 6とReactプラグイン6を使用します。TypeScriptはtypescript-eslintの対応範囲内で選びます。更新後は固定インストール、全重大度監査、lint、書式、型、単体テスト、ビルド、隔離データでのElectron操作を確認します。復旧は関連する依存・設定・lockfileをまとめてrevertします。
