/**
 * 通知タブコンポーネント
 * 要件定義書 第十四章に基づく
 */

import { useState, useCallback } from 'react'
import { useNotificationSettings, useDataExportImport } from '../hooks'
import { Button, Input, Card, Checkbox, Dialog } from './ui'
import type { NotificationSettings } from '../../../types/code'
import type { JSX } from 'react'

/**
 * 既定の閾値（コンポーネント外で定義して参照安定性を確保）
 */
const DEFAULT_EXPIRY_THRESHOLDS = [1440, 180, 60, 30] as const // 24h, 3h, 1h, 30m

/**
 * 分を人間が読みやすい形式に変換
 */
function formatMinutes(minutes: number): string {
  if (minutes >= 1440) {
    const days = minutes / 1440
    return `${days}日前`
  }
  if (minutes >= 60) {
    const hours = minutes / 60
    return `${hours}時間前`
  }
  return `${minutes}分前`
}

/**
 * 閾値入力行
 */
function ThresholdRow({
  value,
  enabled,
  onToggle,
  onRemove,
  isDefault
}: {
  value: number
  enabled: boolean
  onToggle: () => void
  onRemove: () => void
  isDefault: boolean
}): JSX.Element {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Checkbox
          label=""
          checked={enabled}
          onChange={onToggle}
          aria-label={`${formatMinutes(value)}の通知を${enabled ? '無効' : '有効'}にする`}
        />
        <span className={enabled ? 'text-zinc-200' : 'text-zinc-500'}>{formatMinutes(value)}</span>
        {isDefault && <span className="text-xs text-zinc-500">(既定)</span>}
      </div>
      {!isDefault && (
        <button onClick={onRemove} className="p-1 text-zinc-400 hover:text-red-400" title="削除">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

/**
 * 閾値追加フォーム
 */
function AddThresholdForm({
  onAdd,
  existingValues
}: {
  onAdd: (minutes: number) => void
  existingValues: number[]
}): JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>('hours')
  const [error, setError] = useState<string | null>(null)

  const handleAdd = useCallback(() => {
    const num = parseInt(inputValue, 10)
    if (isNaN(num) || num <= 0) {
      setError('正の数を入力してください')
      return
    }

    let minutes: number
    switch (unit) {
      case 'days':
        minutes = num * 1440
        break
      case 'hours':
        minutes = num * 60
        break
      default:
        minutes = num
    }

    if (existingValues.includes(minutes)) {
      setError('この閾値は既に存在します')
      return
    }

    onAdd(minutes)
    setInputValue('')
    setError(null)
  }, [inputValue, unit, existingValues, onAdd])

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-end">
        <div className="w-24">
          <Input
            label="値"
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            min={1}
          />
        </div>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as 'minutes' | 'hours' | 'days')}
          className="px-3 py-2 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg"
        >
          <option value="minutes">分前</option>
          <option value="hours">時間前</option>
          <option value="days">日前</option>
        </select>
        <Button onClick={handleAdd} size="sm">
          追加
        </Button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}

export function NotificationTab(): JSX.Element {
  const { settings, isLoading, error, updateSettings, sendTestNotification, refresh } =
    useNotificationSettings()
  const { exportToFile, importFromFile, isExporting, isImporting } = useDataExportImport()

  const [localExpiryThresholds, setLocalExpiryThresholds] = useState<number[]>([])
  const [localDeadlineThresholds, setLocalDeadlineThresholds] = useState<number[]>([])
  const [enabledExpiryThresholds, setEnabledExpiryThresholds] = useState<Set<number>>(new Set())
  const [enabledDeadlineThresholds, setEnabledDeadlineThresholds] = useState<Set<number>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  // 設定を読み込んだら状態を初期化
  if (settings && !isInitialized) {
    setLocalExpiryThresholds(settings.expiryThresholdsMinutes)
    setLocalDeadlineThresholds(settings.inputDeadlineThresholdsMinutes)
    setEnabledExpiryThresholds(new Set(settings.expiryThresholdsMinutes))
    setEnabledDeadlineThresholds(new Set(settings.inputDeadlineThresholdsMinutes))
    setIsInitialized(true)
  }

  const handleToggleExpiry = useCallback((value: number) => {
    setEnabledExpiryThresholds((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  const handleToggleDeadline = useCallback((value: number) => {
    setEnabledDeadlineThresholds((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  const handleAddExpiry = useCallback((minutes: number) => {
    setLocalExpiryThresholds((prev) => [...prev, minutes].sort((a, b) => b - a))
    setEnabledExpiryThresholds((prev) => new Set([...prev, minutes]))
  }, [])

  const handleAddDeadline = useCallback((minutes: number) => {
    setLocalDeadlineThresholds((prev) => [...prev, minutes].sort((a, b) => b - a))
    setEnabledDeadlineThresholds((prev) => new Set([...prev, minutes]))
  }, [])

  const handleRemoveExpiry = useCallback((minutes: number) => {
    setLocalExpiryThresholds((prev) => prev.filter((v) => v !== minutes))
    setEnabledExpiryThresholds((prev) => {
      const next = new Set(prev)
      next.delete(minutes)
      return next
    })
  }, [])

  const handleRemoveDeadline = useCallback((minutes: number) => {
    setLocalDeadlineThresholds((prev) => prev.filter((v) => v !== minutes))
    setEnabledDeadlineThresholds((prev) => {
      const next = new Set(prev)
      next.delete(minutes)
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaveMessage(null)

    const newSettings: NotificationSettings = {
      expiryThresholdsMinutes: localExpiryThresholds.filter((v) => enabledExpiryThresholds.has(v)),
      inputDeadlineThresholdsMinutes: localDeadlineThresholds.filter((v) =>
        enabledDeadlineThresholds.has(v)
      )
    }

    const success = await updateSettings(newSettings)
    if (success) {
      setSaveMessage('設定を保存しました')
      await refresh()
    } else {
      setSaveMessage('保存に失敗しました')
    }

    setIsSaving(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }, [
    localExpiryThresholds,
    localDeadlineThresholds,
    enabledExpiryThresholds,
    enabledDeadlineThresholds,
    updateSettings,
    refresh
  ])

  const handleTestNotification = useCallback(async () => {
    const success = await sendTestNotification()
    if (success) {
      setSaveMessage('テスト通知を送信しました')
    } else {
      setSaveMessage('テスト通知の送信に失敗しました')
    }
    setTimeout(() => setSaveMessage(null), 3000)
  }, [sendTestNotification])

  const handleReset = useCallback(() => {
    setLocalExpiryThresholds([...DEFAULT_EXPIRY_THRESHOLDS])
    setLocalDeadlineThresholds([])
    setEnabledExpiryThresholds(new Set(DEFAULT_EXPIRY_THRESHOLDS))
    setEnabledDeadlineThresholds(new Set())
  }, [])

  const handleExport = useCallback(async () => {
    setImportMessage(null)
    const result = await exportToFile()
    if (result.success) {
      setImportMessage('エクスポートが完了しました')
    } else if (result.error !== 'キャンセルされました') {
      setImportMessage(`エクスポート失敗: ${result.error}`)
    }
    setTimeout(() => setImportMessage(null), 5000)
  }, [exportToFile])

  const handleImportConfirm = useCallback(() => {
    setShowImportConfirm(true)
  }, [])

  const handleImport = useCallback(async () => {
    setShowImportConfirm(false)
    setImportMessage(null)
    const result = await importFromFile()
    if (result.success) {
      setImportMessage(`インポートが完了しました。バックアップ: ${result.backupPath}`)
      // 設定を再読み込み
      await refresh()
      setIsInitialized(false)
    } else if (result.error !== 'キャンセルされました') {
      setImportMessage(`インポート失敗: ${result.error}`)
    }
    setTimeout(() => setImportMessage(null), 10000)
  }, [importFromFile, refresh])

  if (isLoading && !isInitialized) {
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

  // 全ての閾値（既定含む）を取得
  const allExpiryThresholds = [
    ...new Set([...DEFAULT_EXPIRY_THRESHOLDS, ...localExpiryThresholds])
  ].sort((a, b) => b - a)
  const allDeadlineThresholds = [...localDeadlineThresholds].sort((a, b) => b - a)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 保存メッセージ */}
      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.includes('失敗')
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-green-500/10 border border-green-500/30 text-green-400'
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* 利用終了通知 */}
      <Card title="利用終了通知" description="使用中コードの有効期限に対して通知します">
        <div className="space-y-4">
          <div className="space-y-2">
            {allExpiryThresholds.map((value) => (
              <ThresholdRow
                key={value}
                value={value}
                enabled={enabledExpiryThresholds.has(value)}
                onToggle={() => handleToggleExpiry(value)}
                onRemove={() => handleRemoveExpiry(value)}
                isDefault={DEFAULT_EXPIRY_THRESHOLDS.includes(value)}
              />
            ))}
          </div>

          <AddThresholdForm onAdd={handleAddExpiry} existingValues={allExpiryThresholds} />
        </div>
      </Card>

      {/* 公式入力期限通知 */}
      <Card
        title="公式入力期限通知"
        description="未使用コードの入力期限に対して通知します（既定はオフ）"
      >
        <div className="space-y-4">
          {allDeadlineThresholds.length === 0 ? (
            <div className="text-sm text-zinc-400 p-3 bg-zinc-700/50 rounded-lg">
              通知閾値が設定されていません。下のフォームから追加してください。
            </div>
          ) : (
            <div className="space-y-2">
              {allDeadlineThresholds.map((value) => (
                <ThresholdRow
                  key={value}
                  value={value}
                  enabled={enabledDeadlineThresholds.has(value)}
                  onToggle={() => handleToggleDeadline(value)}
                  onRemove={() => handleRemoveDeadline(value)}
                  isDefault={false}
                />
              ))}
            </div>
          )}

          <AddThresholdForm onAdd={handleAddDeadline} existingValues={allDeadlineThresholds} />
        </div>
      </Card>

      {/* テスト通知 */}
      <Card title="テスト通知">
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">通知が正常に機能しているかテストできます。</p>
          <Button variant="secondary" onClick={() => void handleTestNotification()}>
            テスト通知を送信
          </Button>
        </div>
      </Card>

      {/* 操作ボタン */}
      <div className="flex gap-4">
        <Button onClick={() => void handleSave()} isLoading={isSaving}>
          設定を保存
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          既定に戻す
        </Button>
      </div>

      {/* 説明 */}
      <Card title="通知について">
        <div className="text-sm text-zinc-400 space-y-2">
          <p>
            <strong className="text-zinc-300">利用終了通知:</strong>{' '}
            使用中のコードの有効期限が近づくと通知されます。
            既定では24時間前、3時間前、1時間前、30分前に通知されます。
          </p>
          <p>
            <strong className="text-zinc-300">公式入力期限通知:</strong>{' '}
            未使用のコードの入力期限が近づくと通知されます。
            既定ではオフですが、必要に応じて閾値を追加できます。
          </p>
          <p className="text-zinc-500">※ アプリが起動していない場合は通知されません</p>
        </div>
      </Card>

      {/* エクスポート/インポート */}
      <Card
        title="データのエクスポート/インポート"
        description="コードデータと設定をJSON形式でエクスポート・インポートできます"
      >
        <div className="space-y-4">
          {importMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                importMessage.includes('失敗')
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                  : 'bg-green-500/10 border border-green-500/30 text-green-400'
              }`}
            >
              {importMessage}
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => void handleExport()} isLoading={isExporting}>
              エクスポート
            </Button>
            <Button variant="secondary" onClick={handleImportConfirm} isLoading={isImporting}>
              インポート
            </Button>
          </div>

          <div className="text-sm text-zinc-400 space-y-1">
            <p>
              <strong className="text-zinc-300">エクスポート:</strong>{' '}
              全てのコードデータと通知設定をJSONファイルとして保存します。
            </p>
            <p>
              <strong className="text-zinc-300">インポート:</strong>{' '}
              JSONファイルからデータを読み込み、現在のデータを置き換えます。
              インポート前に自動的にバックアップが作成されます。
            </p>
          </div>
        </div>
      </Card>

      {/* インポート確認ダイアログ */}
      <Dialog
        isOpen={showImportConfirm}
        onClose={() => setShowImportConfirm(false)}
        title="データをインポート"
      >
        <div className="space-y-4">
          <p className="text-zinc-300">
            インポートを実行すると、現在のデータが上書きされます。
            インポート前に自動的にバックアップが作成されますが、よろしいですか？
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowImportConfirm(false)}>
              キャンセル
            </Button>
            <Button onClick={() => void handleImport()}>インポート実行</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
