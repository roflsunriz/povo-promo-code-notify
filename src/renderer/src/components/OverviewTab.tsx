/**
 * 概略タブコンポーネント
 * 要件定義書 第十章に基づく
 */

import { useDashboard } from '../hooks'
import { Card } from './ui'
import { Badge, getStatusBadgeVariant, getStatusLabel } from './ui/Badge'
import type { PromoCodeWithStatus } from '../../../types/code'
import type { JSX } from 'react'

/**
 * 残り時間をフォーマット
 */
function formatRemainingTime(minutes: number | null): string {
  if (minutes === null) {
    return 'カバレッジなし'
  }

  if (minutes <= 0) {
    return '終了'
  }

  const days = Math.floor(minutes / (24 * 60))
  const hours = Math.floor((minutes % (24 * 60)) / 60)
  const mins = minutes % 60

  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days}日`)
  }

  if (hours > 0) {
    parts.push(`${hours}時間`)
  }

  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins}分`)
  }

  return parts.join('')
}

/**
 * 日時をフォーマット
 */
function formatDateTime(isoString: string | null): string {
  if (isoString === null) {
    return '-'
  }

  const date = new Date(isoString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  })
}

/**
 * コードをマスク表示
 */
function maskCode(code: string): string {
  if (code.length <= 4) {
    return code
  }
  return code.substring(0, 2) + '***' + code.substring(code.length - 2)
}

/**
 * アクティブコードカード
 */
function ActiveCodeCard({ code }: { code: PromoCodeWithStatus }): JSX.Element {
  const expiresAt = code.expiresAt ? new Date(code.expiresAt) : null
  const remainingMs = expiresAt ? expiresAt.getTime() - Date.now() : null
  const remainingMinutes = remainingMs !== null ? Math.max(0, Math.floor(remainingMs / (1000 * 60))) : null

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Badge variant={getStatusBadgeVariant(code.status)}>{getStatusLabel(code.status)}</Badge>
        <span className="font-mono text-sm text-zinc-300">{maskCode(code.code)}</span>
      </div>
      <div className="text-right">
        <div className="text-sm text-zinc-400">有効期限</div>
        <div className="text-zinc-200">{formatDateTime(code.expiresAt)}</div>
        <div className="text-sm text-amber-400">
          残り {formatRemainingTime(remainingMinutes)}
        </div>
      </div>
    </div>
  )
}

export function OverviewTab(): JSX.Element {
  const { data, isLoading, error, refresh } = useDashboard()

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-400">エラー: {error}</div>
        <button
          onClick={() => void refresh()}
          className="text-amber-400 hover:text-amber-300 underline"
        >
          再読み込み
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">データがありません</div>
      </div>
    )
  }

  const { coverage, nextCandidate, activeCodes, unusedCount, totalCount } = data

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 連続カバレッジ情報 */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">連続カバレッジ</h2>
            <p className="text-sm text-zinc-400">現在のカバレッジ状況</p>
          </div>
          <button
            onClick={() => void refresh()}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded"
            title="更新"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {coverage.hasCoverage ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-amber-400">
                {formatRemainingTime(coverage.remainingMinutes)}
              </span>
              <span className="text-zinc-400">残り</span>
            </div>

            <div>
              <div className="text-sm text-zinc-400">カバレッジ終端</div>
              <div className="text-lg text-zinc-200">
                {formatDateTime(coverage.coverageEndAt)}
              </div>
            </div>

            {coverage.hasGap && coverage.gapStartAt && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-amber-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="font-medium">ギャップ警告</span>
                </div>
                <p className="text-sm text-zinc-300 mt-1">
                  {formatDateTime(coverage.gapStartAt)} に回線が途切れる可能性があります
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">カバレッジなし</span>
            </div>
            <p className="text-sm text-zinc-300 mt-1">
              現在使用中のコードがありません。回線が途切れている可能性があります。
            </p>
          </div>
        )}
      </Card>

      {/* 次に開始すべきコード */}
      <Card>
        <h2 className="text-lg font-semibold text-zinc-100 mb-1">次に開始すべきコード</h2>
        <p className="text-sm text-zinc-400 mb-4">
          未使用コード: {unusedCount}件 / 全{totalCount}件
        </p>

        {nextCandidate.hasCandidate && nextCandidate.candidate ? (
          <div className="p-4 bg-zinc-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-400">候補コード</div>
                <div className="font-mono text-xl text-amber-400">
                  {nextCandidate.candidate.code}
                </div>
              </div>
              <Badge variant="unused">#{nextCandidate.candidate.order}</Badge>
            </div>
            <div className="mt-3 text-sm">
              <div className="text-zinc-400">コード入力期限</div>
              <div className="text-zinc-200">
                {formatDateTime(nextCandidate.candidate.inputDeadline)}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-zinc-700/50 rounded-lg text-center">
            <p className="text-zinc-400">未使用のコードがありません</p>
          </div>
        )}
      </Card>

      {/* 使用中コード要約 */}
      {activeCodes.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-zinc-100 mb-1">使用中コード</h2>
          <p className="text-sm text-zinc-400 mb-4">{activeCodes.length}件が使用中</p>

          <div className="space-y-2">
            {activeCodes.map((code) => (
              <ActiveCodeCard key={code.id} code={code} />
            ))}
          </div>
        </Card>
      )}

      {/* 統計情報 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="text-2xl font-bold text-zinc-100">{totalCount}</div>
          <div className="text-sm text-zinc-400">全コード</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="text-2xl font-bold text-green-400">{activeCodes.length}</div>
          <div className="text-sm text-zinc-400">使用中</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="text-2xl font-bold text-blue-400">{unusedCount}</div>
          <div className="text-sm text-zinc-400">未使用</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="text-2xl font-bold text-zinc-400">
            {totalCount - activeCodes.length - unusedCount}
          </div>
          <div className="text-sm text-zinc-400">完了・期限切れ</div>
        </div>
      </div>
    </div>
  )
}
