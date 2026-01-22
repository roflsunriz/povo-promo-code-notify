import type { JSX } from 'react'

export function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-400">
          povo プロモコード管理
        </h1>
        <p className="text-zinc-400 mt-2">
          プロモコードの期限と使用状況を管理します
        </p>
      </header>

      <main>
        {/* タブコンポーネントはPhase 3で実装 */}
        <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
          <p className="text-zinc-300">
            アプリケーションの準備が完了しました。
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Phase 1: プロジェクト基盤構築完了
          </p>
        </div>
      </main>

      <footer className="mt-8 text-center text-zinc-500 text-sm">
        <p>povo-promo-code-notify v0.1.0</p>
      </footer>
    </div>
  )
}
