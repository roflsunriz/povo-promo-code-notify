/**
 * 更新タブコンポーネント
 * electron-updater による差分アップデート管理UI
 */

import { useUpdater } from '../hooks'
import { Button, Card } from './ui'
import type { JSX } from 'react'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
}

export function UpdateTab(): JSX.Element {
  const {
    currentVersion,
    latestVersion,
    status,
    progress,
    error,
    checkForUpdates,
    downloadUpdate,
    quitAndInstall
  } = useUpdater()

  const isChecking = status === 'checking'
  const isDownloading = status === 'downloading'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* エラー表示 */}
      {error !== null && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* バージョン情報 */}
      <Card title="バージョン情報">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">現在のバージョン</span>
            <span className="font-mono text-zinc-100">
              {currentVersion !== null ? `v${currentVersion}` : '---'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">最新バージョン</span>
            <span className="font-mono text-zinc-100">
              {latestVersion !== null ? `v${latestVersion}` : '---'}
            </span>
          </div>

          {status === 'not-available' && (
            <div className="mt-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              最新バージョンです
            </div>
          )}

          {status === 'available' && (
            <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              新しいバージョンが利用可能です
            </div>
          )}

          {status === 'downloaded' && (
            <div className="mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
              ダウンロード完了 — 再起動してインストールできます
            </div>
          )}
        </div>
      </Card>

      {/* ダウンロード進捗 */}
      {isDownloading && progress !== null && (
        <Card title="ダウンロード中">
          <div className="space-y-3">
            <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress.percent, 100).toFixed(1)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <span>{progress.percent.toFixed(1)}%</span>
              <span>
                {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
              </span>
              <span>{formatSpeed(progress.bytesPerSecond)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* 操作ボタン */}
      <Card title="操作">
        <div className="flex gap-4 flex-wrap">
          <Button
            onClick={() => void checkForUpdates()}
            isLoading={isChecking}
            disabled={isDownloading}
          >
            更新を確認
          </Button>

          {status === 'available' && (
            <Button onClick={() => void downloadUpdate()} variant="secondary">
              ダウンロードしてインストール
            </Button>
          )}

          {status === 'downloaded' && (
            <Button onClick={() => void quitAndInstall()} variant="secondary">
              再起動してインストール
            </Button>
          )}
        </div>
      </Card>

      {/* 説明 */}
      <Card title="自動更新について">
        <div className="text-sm text-zinc-400 space-y-2">
          <p>
            <strong className="text-zinc-300">差分ダウンロード:</strong>{' '}
            変更された部分のみをダウンロードするため、通常のアップデートより高速です。
          </p>
          <p>
            <strong className="text-zinc-300">再起動が必要:</strong>{' '}
            ダウンロード完了後、「再起動してインストール」を押すとアプリが再起動され、更新が適用されます。
          </p>
          <p className="text-zinc-500">
            ※ アプリ終了時にもダウンロード済みの更新は自動的にインストールされます
          </p>
        </div>
      </Card>
    </div>
  )
}
