import {
  TabLayout,
  OverviewTab,
  CodesListTab,
  RegisterTab,
  EditTab,
  NotificationTab
} from './components'
import type { TabId } from './components'
import type { JSX } from 'react'

function renderTab(tabId: TabId): JSX.Element {
  switch (tabId) {
    case 'overview':
      return <OverviewTab />
    case 'codes':
      return <CodesListTab />
    case 'register':
      return <RegisterTab />
    case 'edit':
      return <EditTab />
    case 'notification':
      return <NotificationTab />
  }
}

export function App(): JSX.Element {
  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-zinc-100">
      {/* ヘッダー */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-amber-400">povo プロモコード管理</h1>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-hidden">
        <TabLayout>{(activeTab) => renderTab(activeTab)}</TabLayout>
      </main>

      {/* フッター */}
      <footer className="flex-shrink-0 px-6 py-2 border-t border-zinc-800 text-center text-zinc-500 text-xs">
        <p>povo-promo-code-notify v1.4.1</p>
      </footer>
    </div>
  )
}
