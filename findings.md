# 調査知見

- `bun audit fix` だけで残るfast-uri/nanoid/sharpは親majorごとのversion-scoped overrideとlockfileを同時更新する。Bun 1.4のlock形式3は1.3系CIで読めないため、実行版とlock形式を揃える。
- electron-builder配下の旧 `@electron/get` は監査0件だけで安全と判断せず、公式5系への限定移行後にWindows artifact downloadを確認する。
- asar梱包中に入力fileを変更するとheader sizeと実dataがずれ、別file本文をJSとして読む破損が起きる。梱包中は文書も変更せず、起動前にasar全entryのsize/hashと抽出JS構文をoffline検査する。
- root tsconfigはreferencesだけで、`tsc --noEmit` 単体では製品を検査しない。node/webを明示したtype-checkを使う。preloadのWindow宣言は同名 `index.d.ts` でなく別 `api.d.ts` に置く。
- electron-builderはGit ignoreを配布除外に使わない。`COMMON-AGENTS.md` link先、開発用パッチ、`*_vite_proxy.tmp.*`、tmp、tsbuildinfo等を設定で除外し、asar一覧を監査する。
- 依存更新E2Eは製品import前に一時userDataを設定し、`--start-in-tray` で隔離起動する。実利用dataを使う通常E2Eと混同しない。
- TypeScript 7はtypescript-eslint対応まで6系。Vite 8はelectron-vite 6、React plugin 6、Vitest `.mts` を一組で更新する。
- electron-builder更新時は `app-builder-lib` と `electron-builder-squirrel-windows` の実効版を要求版に合わせ、配布ビルドの表示版を確認する。
- minimatch 11は旧CommonJS形式と `makeRe` を提供しないため、eslint-plugin-import 2.32.0とeslint-plugin-react 7.37.5に `patches/` の互換修正を適用する。import/orderの削除済みESLint APIは `includeComments` 付きの現行APIへ置換する。旧 `makeRe` と異なり、新しいmatcherは `**` の隠しパスを既定で除外する。プラグイン更新時はテストと上流対応を確認し、パッチの削除を再評価する。
