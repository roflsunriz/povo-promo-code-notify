1. App.tsxのフッターバージョンを更新する
2. package.jsonのversionを更新する
3. RELEASE_NOTES.mdを更新しチェンジログを追加する
4. git tag v1.x.x && git push origin v1.x.x
5. GitHub Actionsがインストーラーをビルドし、Releaseを自動作成