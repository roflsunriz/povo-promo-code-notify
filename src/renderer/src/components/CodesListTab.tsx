/**
 * コード一覧タブコンポーネント
 * 要件定義書 第十一章に基づく
 */

import { useState, useMemo, useCallback } from 'react'
import { useCodes } from '../hooks'
import { Select, Checkbox } from './ui'
import { Badge, getStatusBadgeVariant, getStatusLabel } from './ui/Badge'
import type { CodeStatus, PromoCodeWithStatus } from '../../../types/code'
import type { CodeFilter, CodeSort, CodeSortKey } from '../../../types/ipc'
import type { JSX } from 'react'

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
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 有効期間をフォーマット
 */
function formatValidityDuration(minutes: number): string {
  if (minutes >= 1440) {
    const days = minutes / 1440
    return `${days}日間`
  }
  if (minutes >= 60) {
    const hours = minutes / 60
    return `${hours}時間`
  }
  return `${minutes}分`
}

/**
 * コードをマスク表示
 */
function maskCode(code: string, showFull: boolean): string {
  if (showFull || code.length <= 4) {
    return code
  }
  return code.substring(0, 2) + '***' + code.substring(code.length - 2)
}

/**
 * 入力期限の残り日数を計算
 */
function getDaysUntilDeadline(inputDeadline: string): number {
  const deadline = new Date(inputDeadline)
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * コード行コンポーネント
 */
function CodeRow({
  code,
  showFullCode,
  onToggleCode
}: {
  code: PromoCodeWithStatus
  showFullCode: boolean
  onToggleCode: () => void
}): JSX.Element {
  const daysUntil = getDaysUntilDeadline(code.inputDeadline)
  const isDeadlineSoon = daysUntil <= 7 && code.status === 'unused'

  return (
    <tr className="border-b border-zinc-700 hover:bg-zinc-700/30">
      <td className="px-4 py-3 text-center text-zinc-400">#{code.order}</td>
      <td className="px-4 py-3">
        <button
          onClick={onToggleCode}
          className="font-mono text-zinc-200 hover:text-amber-400 transition-colors"
          title={showFullCode ? 'マスク表示' : '全表示'}
        >
          {maskCode(code.code, showFullCode)}
        </button>
      </td>
      <td className="px-4 py-3">
        <Badge variant={getStatusBadgeVariant(code.status)}>{getStatusLabel(code.status)}</Badge>
      </td>
      <td className={`px-4 py-3 ${isDeadlineSoon ? 'text-amber-400' : 'text-zinc-300'}`}>
        {formatDateTime(code.inputDeadline)}
        {isDeadlineSoon && <span className="ml-2 text-xs">({daysUntil}日後)</span>}
      </td>
      <td className="px-4 py-3 text-zinc-300">{formatDateTime(code.startedAt)}</td>
      <td className="px-4 py-3 text-zinc-300">{formatDateTime(code.expiresAt)}</td>
      <td className="px-4 py-3 text-zinc-400 text-sm">
        {formatValidityDuration(code.validityDurationMinutes)}
      </td>
    </tr>
  )
}

export function CodesListTab(): JSX.Element {
  // フィルター状態
  const [selectedStatuses, setSelectedStatuses] = useState<CodeStatus[]>([])
  const [deadlineWithinDays, setDeadlineWithinDays] = useState<number | null>(null)

  // ソート状態
  const [sortKey, setSortKey] = useState<CodeSortKey>('order')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // コード表示状態
  const [showFullCodes, setShowFullCodes] = useState<Set<string>>(new Set())
  const [showAllCodes, setShowAllCodes] = useState(false)

  // フィルターとソートを構築
  const filter: CodeFilter | undefined = useMemo(() => {
    if (selectedStatuses.length === 0 && deadlineWithinDays === null) {
      return undefined
    }
    return {
      statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      inputDeadlineWithinDays: deadlineWithinDays
    }
  }, [selectedStatuses, deadlineWithinDays])

  const sort: CodeSort = useMemo(
    () => ({
      key: sortKey,
      direction: sortDirection
    }),
    [sortKey, sortDirection]
  )

  const { codes, isLoading, error, refresh } = useCodes(filter, sort)

  const toggleCodeVisibility = useCallback((codeId: string) => {
    setShowFullCodes((prev) => {
      const next = new Set(prev)
      if (next.has(codeId)) {
        next.delete(codeId)
      } else {
        next.add(codeId)
      }
      return next
    })
  }, [])

  const handleStatusFilterChange = useCallback((status: CodeStatus, checked: boolean) => {
    setSelectedStatuses((prev) => {
      if (checked) {
        return [...prev, status]
      }
      return prev.filter((s) => s !== status)
    })
  }, [])

  const handleSortChange = useCallback(
    (key: CodeSortKey) => {
      if (sortKey === key) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDirection('asc')
      }
    },
    [sortKey]
  )

  const sortOptions = [
    { value: 'order', label: '順序' },
    { value: 'inputDeadline', label: '入力期限' },
    { value: 'status', label: '状態' },
    { value: 'createdAt', label: '登録日' }
  ]

  const deadlineOptions = [
    { value: '', label: 'すべて' },
    { value: '7', label: '7日以内' },
    { value: '14', label: '14日以内' },
    { value: '30', label: '30日以内' }
  ]

  if (isLoading && codes.length === 0) {
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

  return (
    <div className="space-y-4">
      {/* フィルター・ソートコントロール */}
      <div className="flex flex-wrap gap-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
        {/* 状態フィルター */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-zinc-300">状態フィルター</div>
          <div className="flex flex-wrap gap-3">
            <Checkbox
              label="使用中"
              checked={selectedStatuses.includes('active')}
              onChange={(e) => handleStatusFilterChange('active', e.target.checked)}
            />
            <Checkbox
              label="未使用"
              checked={selectedStatuses.includes('unused')}
              onChange={(e) => handleStatusFilterChange('unused', e.target.checked)}
            />
            <Checkbox
              label="消費済み"
              checked={selectedStatuses.includes('consumed')}
              onChange={(e) => handleStatusFilterChange('consumed', e.target.checked)}
            />
            <Checkbox
              label="期限切れ"
              checked={selectedStatuses.includes('expired')}
              onChange={(e) => handleStatusFilterChange('expired', e.target.checked)}
            />
          </div>
        </div>

        {/* 入力期限フィルター */}
        <div className="w-40">
          <Select
            label="入力期限"
            options={deadlineOptions}
            value={deadlineWithinDays?.toString() ?? ''}
            onChange={(e) => {
              const value = e.target.value
              setDeadlineWithinDays(value ? parseInt(value, 10) : null)
            }}
          />
        </div>

        {/* ソート */}
        <div className="w-40">
          <Select
            label="並び順"
            options={sortOptions}
            value={sortKey}
            onChange={(e) => handleSortChange(e.target.value as CodeSortKey)}
          />
        </div>

        {/* ソート方向 */}
        <div className="flex items-end">
          <button
            onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-2 text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg"
            title={sortDirection === 'asc' ? '昇順' : '降順'}
          >
            {sortDirection === 'asc' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
            )}
          </button>
        </div>

        {/* コード表示トグル */}
        <div className="flex items-end ml-auto">
          <Checkbox
            label="すべてのコードを表示"
            checked={showAllCodes}
            onChange={(e) => setShowAllCodes(e.target.checked)}
          />
        </div>
      </div>

      {/* コード一覧テーブル */}
      {codes.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          {filter ? 'フィルター条件に一致するコードがありません' : 'コードが登録されていません'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-800 border-b border-zinc-700">
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200"
                  onClick={() => handleSortChange('order')}
                >
                  順序
                  {sortKey === 'order' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">コード</th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200"
                  onClick={() => handleSortChange('status')}
                >
                  状態
                  {sortKey === 'status' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200"
                  onClick={() => handleSortChange('inputDeadline')}
                >
                  入力期限
                  {sortKey === 'inputDeadline' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">使用開始</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">有効期限</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">有効期間</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <CodeRow
                  key={code.id}
                  code={code}
                  showFullCode={showAllCodes || showFullCodes.has(code.id)}
                  onToggleCode={() => toggleCodeVisibility(code.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 件数表示 */}
      <div className="text-sm text-zinc-400 text-right">{codes.length}件を表示</div>
    </div>
  )
}
