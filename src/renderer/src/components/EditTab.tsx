/**
 * 編集取り消しタブコンポーネント
 * 要件定義書 第十三章に基づく
 */

import { useState, useCallback, useMemo } from 'react'
import { useCodes, useCodeActions } from '../hooks'
import { Button, Input, Card, Dialog } from './ui'
import { Badge, getStatusBadgeVariant, getStatusLabel } from './ui/Badge'
import type { PromoCodeWithStatus } from '../../../types/code'
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
 * ISOをdatetime-local形式に変換
 */
function isoToDatetimeLocal(isoString: string | null): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  // ローカル時間に調整
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

/**
 * datetime-localをISOに変換
 */
function datetimeLocalToIso(datetimeLocal: string): string {
  return new Date(datetimeLocal).toISOString()
}

/**
 * コード選択カード
 */
function CodeSelectCard({
  code,
  isSelected,
  onSelect
}: {
  code: PromoCodeWithStatus
  isSelected: boolean
  onSelect: () => void
}): JSX.Element {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-4 rounded-lg border text-left transition-colors
        ${
          isSelected
            ? 'bg-amber-500/10 border-amber-500/50'
            : 'bg-zinc-700/50 border-zinc-700 hover:border-zinc-600'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={getStatusBadgeVariant(code.status)}>{getStatusLabel(code.status)}</Badge>
          <span className="font-mono text-zinc-200">{code.code}</span>
        </div>
        <Badge variant="info">#{code.order}</Badge>
      </div>
      <div className="mt-2 text-sm text-zinc-400 grid grid-cols-2 gap-2">
        <div>入力期限: {formatDateTime(code.inputDeadline)}</div>
        <div>使用開始: {formatDateTime(code.startedAt)}</div>
      </div>
    </button>
  )
}

/**
 * コード編集パネル
 */
function CodeEditPanel({
  code,
  onStartCode,
  onCancelCode,
  onEditStartedAt,
  onDeleteCode,
  isLoading,
  onRefresh
}: {
  code: PromoCodeWithStatus
  onStartCode: (id: string) => Promise<boolean>
  onCancelCode: (id: string) => Promise<boolean>
  onEditStartedAt: (id: string, newStartedAt: string) => Promise<boolean>
  onDeleteCode: (id: string) => Promise<boolean>
  isLoading: boolean
  onRefresh: () => Promise<void>
}): JSX.Element {
  const [editedStartedAt, setEditedStartedAt] = useState(isoToDatetimeLocal(code.startedAt))
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const canStart = code.status === 'unused'
  const canCancel = code.status === 'active' || code.status === 'consumed'
  const canEdit = code.startedAt !== null

  const handleStart = useCallback(async () => {
    const success = await onStartCode(code.id)
    if (success) {
      await onRefresh()
    }
  }, [code.id, onStartCode, onRefresh])

  const handleCancel = useCallback(async () => {
    const success = await onCancelCode(code.id)
    if (success) {
      setShowCancelDialog(false)
      await onRefresh()
    }
  }, [code.id, onCancelCode, onRefresh])

  const handleEditStartedAt = useCallback(async () => {
    if (!editedStartedAt) return
    const isoString = datetimeLocalToIso(editedStartedAt)
    const success = await onEditStartedAt(code.id, isoString)
    if (success) {
      await onRefresh()
    }
  }, [code.id, editedStartedAt, onEditStartedAt, onRefresh])

  const handleDelete = useCallback(async () => {
    const success = await onDeleteCode(code.id)
    if (success) {
      setShowDeleteDialog(false)
      await onRefresh()
    }
  }, [code.id, onDeleteCode, onRefresh])

  return (
    <Card title="コード操作">
      <div className="space-y-6">
        {/* コード情報 */}
        <div className="p-4 bg-zinc-700/50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant={getStatusBadgeVariant(code.status)}>
              {getStatusLabel(code.status)}
            </Badge>
            <span className="font-mono text-xl text-amber-400">{code.code}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-zinc-400">入力期限</div>
              <div className="text-zinc-200">{formatDateTime(code.inputDeadline)}</div>
            </div>
            <div>
              <div className="text-zinc-400">有効期間</div>
              <div className="text-zinc-200">{code.validityDurationMinutes}分</div>
            </div>
            <div>
              <div className="text-zinc-400">使用開始</div>
              <div className="text-zinc-200">{formatDateTime(code.startedAt)}</div>
            </div>
            <div>
              <div className="text-zinc-400">有効期限</div>
              <div className="text-zinc-200">{formatDateTime(code.expiresAt)}</div>
            </div>
          </div>
        </div>

        {/* 使用開始 */}
        {canStart && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-300">使用開始</h3>
            <p className="text-sm text-zinc-400">
              このコードを使用開始としてマークします。現在時刻が使用開始日時として設定されます。
            </p>
            <Button onClick={() => void handleStart()} isLoading={isLoading}>
              使用開始
            </Button>
          </div>
        )}

        {/* 使用開始日時編集 */}
        {canEdit && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-300">使用開始日時を編集</h3>
            <p className="text-sm text-zinc-400">
              Android側での実開始時刻とずれた場合に調整できます。
            </p>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="使用開始日時"
                  type="datetime-local"
                  value={editedStartedAt}
                  onChange={(e) => setEditedStartedAt(e.target.value)}
                />
              </div>
              <Button
                onClick={() => void handleEditStartedAt()}
                isLoading={isLoading}
                disabled={
                  !editedStartedAt || editedStartedAt === isoToDatetimeLocal(code.startedAt)
                }
              >
                更新
              </Button>
            </div>
            {editedStartedAt && editedStartedAt !== isoToDatetimeLocal(code.startedAt) && (
              <p className="text-sm text-amber-400">有効期限が再計算されます</p>
            )}
          </div>
        )}

        {/* 取り消し */}
        {canCancel && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-300">使用を取り消し</h3>
            <p className="text-sm text-zinc-400">
              使用開始日時と有効期限を未設定に戻し、未使用として扱います。
            </p>
            <Button variant="danger" onClick={() => setShowCancelDialog(true)}>
              取り消し
            </Button>
          </div>
        )}

        {/* 削除 */}
        <div className="space-y-2 pt-4 border-t border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-300">コードを削除</h3>
          <p className="text-sm text-zinc-400">
            このコードを完全に削除します。この操作は取り消せません。
          </p>
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            削除
          </Button>
        </div>
      </div>

      {/* 取り消し確認ダイアログ */}
      <Dialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="使用を取り消しますか？"
        confirmLabel="取り消す"
        variant="danger"
        onConfirm={() => void handleCancel()}
        isLoading={isLoading}
      >
        <p>
          コード <span className="font-mono text-amber-400">{code.code}</span>{' '}
          の使用を取り消します。
        </p>
        <p className="mt-2">使用開始日時と有効期限が未設定に戻り、未使用として扱われます。</p>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="コードを削除しますか？"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={() => void handleDelete()}
        isLoading={isLoading}
      >
        <p>
          コード <span className="font-mono text-amber-400">{code.code}</span> を削除します。
        </p>
        <p className="mt-2 text-red-400">この操作は取り消せません。</p>
      </Dialog>
    </Card>
  )
}

export function EditTab(): JSX.Element {
  const { codes, isLoading: isCodesLoading, refresh } = useCodes()
  const {
    startCode,
    cancelCode,
    editStartedAt,
    deleteCode,
    isLoading: isActionLoading
  } = useCodeActions()

  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'unused' | 'active'>('all')

  const filteredCodes = useMemo(() => {
    if (filterStatus === 'all') return codes
    return codes.filter((code) => code.status === filterStatus)
  }, [codes, filterStatus])

  const selectedCode = useMemo(() => {
    if (!selectedCodeId) return null
    return codes.find((code) => code.id === selectedCodeId) ?? null
  }, [codes, selectedCodeId])

  const handleRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  if (isCodesLoading && codes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* コード選択リスト */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">コードを選択</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 text-sm rounded ${
                filterStatus === 'all'
                  ? 'bg-amber-500 text-zinc-900'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilterStatus('unused')}
              className={`px-3 py-1 text-sm rounded ${
                filterStatus === 'unused'
                  ? 'bg-amber-500 text-zinc-900'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              未使用
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 text-sm rounded ${
                filterStatus === 'active'
                  ? 'bg-amber-500 text-zinc-900'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              使用中
            </button>
          </div>
        </div>

        {filteredCodes.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            {filterStatus === 'all'
              ? 'コードが登録されていません'
              : `${filterStatus === 'unused' ? '未使用' : '使用中'}のコードがありません`}
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredCodes.map((code) => (
              <CodeSelectCard
                key={code.id}
                code={code}
                isSelected={selectedCodeId === code.id}
                onSelect={() => setSelectedCodeId(code.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 編集パネル */}
      <div>
        {selectedCode ? (
          <CodeEditPanel
            code={selectedCode}
            onStartCode={startCode}
            onCancelCode={cancelCode}
            onEditStartedAt={editStartedAt}
            onDeleteCode={deleteCode}
            isLoading={isActionLoading}
            onRefresh={handleRefresh}
          />
        ) : (
          <Card>
            <div className="text-center py-12 text-zinc-400">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              <p>左側からコードを選択してください</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
