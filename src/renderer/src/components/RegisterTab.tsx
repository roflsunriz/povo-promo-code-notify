/**
 * 登録タブコンポーネント
 * 要件定義書 第十二章に基づく
 */

import { useState, useCallback } from 'react'
import { useCodeRegistration } from '../hooks'
import { Button, Input, Textarea, Card } from './ui'
import { Badge } from './ui/Badge'
import type { CreatePromoCodeInput } from '../../../types/code'
import type { ParsedCodeInfo } from '../../../types/ipc'
import type { JSX } from 'react'

/**
 * 日時をフォーマット
 */
function formatDateTime(isoString: string | null): string {
  if (isoString === null) {
    return '未設定'
  }

  const date = new Date(isoString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 有効期間をフォーマット
 */
function formatValidityDuration(minutes: number | null, validityEndAt?: string | null): string {
  // 終端日時指定の場合
  if (validityEndAt) {
    const date = new Date(validityEndAt)
    return `${date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}まで`
  }

  if (minutes === null || minutes === 0) {
    return '未設定'
  }
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
 * 抽出されたコードの編集フォーム
 */
interface ParsedCodeEditFormProps {
  code: ParsedCodeInfo
  index: number
  order: number
  onUpdate: (index: number, code: ParsedCodeInfo) => void
  onRemove: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

function ParsedCodeEditForm({
  code,
  index,
  order,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: ParsedCodeEditFormProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [editedCode, setEditedCode] = useState(code.code)
  const [editedDeadline, setEditedDeadline] = useState(
    code.inputDeadline ? code.inputDeadline.substring(0, 10) : ''
  )

  // 有効期間を日・時・分に分解
  const initialDHM = minutesToDHM(code.validityDurationMinutes ?? 10080)
  const [editedDurationDays, setEditedDurationDays] = useState(initialDHM.days.toString())
  const [editedDurationHours, setEditedDurationHours] = useState(initialDHM.hours.toString())
  const [editedDurationMinutes, setEditedDurationMinutes] = useState(initialDHM.minutes.toString())
  const [editedMaxUseCount, setEditedMaxUseCount] = useState((code.maxUseCount ?? 1).toString())
  const [editedUseCount, setEditedUseCount] = useState((code.useCount ?? 0).toString())

  const handlePresetSelect = useCallback((days: number, hours: number, minutes: number) => {
    setEditedDurationDays(days.toString())
    setEditedDurationHours(hours.toString())
    setEditedDurationMinutes(minutes.toString())
  }, [])

  const handleSave = useCallback(() => {
    const deadlineIso = editedDeadline ? `${editedDeadline}T23:59:59.999+09:00` : null
    const totalMinutes = dhmToMinutes(
      parseInt(editedDurationDays, 10) || 0,
      parseInt(editedDurationHours, 10) || 0,
      parseInt(editedDurationMinutes, 10) || 0
    )

    onUpdate(index, {
      code: editedCode,
      inputDeadline: deadlineIso,
      validityDurationMinutes: totalMinutes || 10080,
      maxUseCount: parseInt(editedMaxUseCount, 10) || 1,
      useCount: parseInt(editedUseCount, 10) || 0
    })
    setIsEditing(false)
  }, [
    index,
    editedCode,
    editedDeadline,
    editedDurationDays,
    editedDurationHours,
    editedDurationMinutes,
    editedMaxUseCount,
    editedUseCount,
    onUpdate
  ])

  const handleCancel = useCallback(() => {
    setEditedCode(code.code)
    setEditedDeadline(code.inputDeadline ? code.inputDeadline.substring(0, 10) : '')
    const dhm = minutesToDHM(code.validityDurationMinutes ?? 10080)
    setEditedDurationDays(dhm.days.toString())
    setEditedDurationHours(dhm.hours.toString())
    setEditedDurationMinutes(dhm.minutes.toString())
    setEditedMaxUseCount((code.maxUseCount ?? 1).toString())
    setEditedUseCount((code.useCount ?? 0).toString())
    setIsEditing(false)
  }, [code])

  return (
    <div className="p-4 bg-zinc-700/50 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="info">#{order}</Badge>
          {/* 順序変更ボタン */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onMoveUp(index)}
              disabled={isFirst}
              className="p-0.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="上に移動"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={isLast}
              className="p-0.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="下に移動"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="flex-1 space-y-3">
            <Input
              label="コード"
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
            />
            <Input
              label="入力期限"
              type="date"
              value={editedDeadline}
              onChange={(e) => setEditedDeadline(e.target.value)}
            />
            <DurationInput
              days={editedDurationDays}
              hours={editedDurationHours}
              minutes={editedDurationMinutes}
              onDaysChange={setEditedDurationDays}
              onHoursChange={setEditedDurationHours}
              onMinutesChange={setEditedDurationMinutes}
              onPresetSelect={handlePresetSelect}
            />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={editedMaxUseCount}
                  onChange={(e) => setEditedMaxUseCount(e.target.value)}
                  className="w-16 px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-400">最大回数</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={editedUseCount}
                  onChange={(e) => setEditedUseCount(e.target.value)}
                  className="w-16 px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-400">使用済み</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                保存
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancel}>
                キャンセル
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="font-mono text-lg text-amber-400">{code.code}</div>
            <div className="mt-2 text-sm text-zinc-400 space-y-1">
              <div>入力期限: {formatDateTime(code.inputDeadline)}</div>
              <div>
                有効期間: {formatValidityDuration(code.validityDurationMinutes, code.validityEndAt)}
              </div>
              <div>
                使用回数: {code.useCount ?? 0}/{code.maxUseCount ?? 1}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-zinc-400 hover:text-zinc-200"
              title="編集"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          <button
            onClick={() => onRemove(index)}
            className="p-2 text-zinc-400 hover:text-red-400"
            title="削除"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 有効期間の入力モード
 */
type ValidityInputMode = 'duration' | 'endAt'

/**
 * 有効期間プリセット
 */
const DURATION_PRESETS = [
  { label: '7日', days: 7, hours: 0, minutes: 0 },
  { label: '24時間', days: 0, hours: 24, minutes: 0 },
  { label: '1時間', days: 0, hours: 1, minutes: 0 }
] as const

/**
 * 分を日・時・分に変換
 */
function minutesToDHM(totalMinutes: number): { days: number; hours: number; minutes: number } {
  const days = Math.floor(totalMinutes / 1440)
  const remainingAfterDays = totalMinutes % 1440
  const hours = Math.floor(remainingAfterDays / 60)
  const minutes = remainingAfterDays % 60
  return { days, hours, minutes }
}

/**
 * 日・時・分を分に変換
 */
function dhmToMinutes(days: number, hours: number, minutes: number): number {
  return days * 1440 + hours * 60 + minutes
}

/**
 * 有効期間入力コンポーネント
 */
interface DurationInputProps {
  days: string
  hours: string
  minutes: string
  onDaysChange: (value: string) => void
  onHoursChange: (value: string) => void
  onMinutesChange: (value: string) => void
  onPresetSelect: (days: number, hours: number, minutes: number) => void
}

function DurationInput({
  days,
  hours,
  minutes,
  onDaysChange,
  onHoursChange,
  onMinutesChange,
  onPresetSelect
}: DurationInputProps): JSX.Element {
  const totalMinutes = dhmToMinutes(
    parseInt(days, 10) || 0,
    parseInt(hours, 10) || 0,
    parseInt(minutes, 10) || 0
  )

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">有効期間</label>

      {/* プリセットボタン */}
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onPresetSelect(preset.days, preset.hours, preset.minutes)}
            className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 日・時・分入力 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            value={days}
            onChange={(e) => onDaysChange(e.target.value)}
            className="w-16 px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-sm text-zinc-400">日</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="23"
            value={hours}
            onChange={(e) => onHoursChange(e.target.value)}
            className="w-16 px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-sm text-zinc-400">時間</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => onMinutesChange(e.target.value)}
            className="w-16 px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-sm text-zinc-400">分</span>
        </div>
      </div>

      {/* 合計分表示 */}
      <div className="text-xs text-zinc-500">= {totalMinutes.toLocaleString()}分</div>
    </div>
  )
}

/**
 * 終端日時入力コンポーネント
 */
interface EndAtInputProps {
  date: string
  time: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
}

function EndAtInput({ date, time, onDateChange, onTimeChange }: EndAtInputProps): JSX.Element {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">終端日時</label>
      <p className="text-xs text-zinc-500">
        povo2.0アプリに表示される終了日時を入力してください（使用開始時に期間が計算されます）
      </p>

      {/* 日時入力 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center gap-1">
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 終端日時のプレビュー */}
      {date && time && (
        <div className="text-xs text-zinc-500">
          ={' '}
          {new Date(`${date}T${time}`).toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
          まで
        </div>
      )}
    </div>
  )
}

/**
 * 有効期間の入力モード切り替えタブ
 */
interface ValidityModeTabsProps {
  mode: ValidityInputMode
  onModeChange: (mode: ValidityInputMode) => void
}

function ValidityModeTabs({ mode, onModeChange }: ValidityModeTabsProps): JSX.Element {
  return (
    <div className="flex gap-1 p-1 bg-zinc-800 rounded-lg">
      <button
        type="button"
        onClick={() => onModeChange('duration')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          mode === 'duration'
            ? 'bg-amber-600 text-white'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
        }`}
      >
        期間で指定
      </button>
      <button
        type="button"
        onClick={() => onModeChange('endAt')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          mode === 'endAt'
            ? 'bg-amber-600 text-white'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
        }`}
      >
        終端日時で指定
      </button>
    </div>
  )
}

/**
 * 手入力フォーム
 */
function ManualInputForm({
  onAdd,
  isLoading
}: {
  onAdd: (code: ParsedCodeInfo) => void
  isLoading: boolean
}): JSX.Element {
  const [code, setCode] = useState('')
  const [deadline, setDeadline] = useState('')
  const [validityMode, setValidityMode] = useState<ValidityInputMode>('duration')

  // 期間指定モード用
  const [durationDays, setDurationDays] = useState('7')
  const [durationHours, setDurationHours] = useState('0')
  const [durationMinutes, setDurationMinutes] = useState('0')

  // 終端日時指定モード用
  const [endAtDate, setEndAtDate] = useState('')
  const [endAtTime, setEndAtTime] = useState('00:00')

  // 使用回数
  const [maxUseCount, setMaxUseCount] = useState('1')
  const [useCount, setUseCount] = useState('0')

  const [error, setError] = useState<string | null>(null)

  const handlePresetSelect = useCallback((days: number, hours: number, minutes: number) => {
    setDurationDays(days.toString())
    setDurationHours(hours.toString())
    setDurationMinutes(minutes.toString())
  }, [])

  const handleAdd = useCallback(() => {
    if (!code.trim()) {
      setError('コードを入力してください')
      return
    }
    if (!deadline) {
      setError('入力期限を入力してください')
      return
    }

    const deadlineIso = `${deadline}T23:59:59.999+09:00`

    const parsedMaxUseCount = parseInt(maxUseCount, 10) || 1
    const parsedUseCount = parseInt(useCount, 10) || 0

    if (validityMode === 'duration') {
      // 期間指定モード
      const totalMinutes = dhmToMinutes(
        parseInt(durationDays, 10) || 0,
        parseInt(durationHours, 10) || 0,
        parseInt(durationMinutes, 10) || 0
      )

      if (totalMinutes <= 0) {
        setError('有効期間を1分以上に設定してください')
        return
      }

      onAdd({
        code: code.trim().toUpperCase(),
        inputDeadline: deadlineIso,
        validityDurationMinutes: totalMinutes,
        validityEndAt: null,
        maxUseCount: parsedMaxUseCount,
        useCount: parsedUseCount
      })
    } else {
      // 終端日時指定モード
      if (!endAtDate || !endAtTime) {
        setError('終端日時を入力してください')
        return
      }

      const validityEndAtIso = `${endAtDate}T${endAtTime}:00.000+09:00`

      onAdd({
        code: code.trim().toUpperCase(),
        inputDeadline: deadlineIso,
        validityDurationMinutes: 0, // 使用開始時に計算される
        validityEndAt: validityEndAtIso,
        maxUseCount: parsedMaxUseCount,
        useCount: parsedUseCount
      })
    }

    // フォームをリセット
    setCode('')
    setDeadline('')
    setDurationDays('7')
    setDurationHours('0')
    setDurationMinutes('0')
    setEndAtDate('')
    setEndAtTime('00:00')
    setMaxUseCount('1')
    setUseCount('0')
    setError(null)
  }, [
    code,
    deadline,
    validityMode,
    durationDays,
    durationHours,
    durationMinutes,
    endAtDate,
    endAtTime,
    maxUseCount,
    useCount,
    onAdd
  ])

  return (
    <Card title="手入力で追加">
      <div className="space-y-4">
        <Input
          label="コード"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="例: UL1H97X3CKAR6"
          error={error && !code.trim() ? error : undefined}
        />
        <Input
          label="入力期限"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          error={error && !deadline ? error : undefined}
        />

        {/* 有効期間の入力モード切り替え */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">有効期間の指定方法</label>
          <ValidityModeTabs mode={validityMode} onModeChange={setValidityMode} />
        </div>

        {/* 入力モードに応じた入力フィールド */}
        {validityMode === 'duration' ? (
          <DurationInput
            days={durationDays}
            hours={durationHours}
            minutes={durationMinutes}
            onDaysChange={setDurationDays}
            onHoursChange={setDurationHours}
            onMinutesChange={setDurationMinutes}
            onPresetSelect={handlePresetSelect}
          />
        ) : (
          <EndAtInput
            date={endAtDate}
            time={endAtTime}
            onDateChange={setEndAtDate}
            onTimeChange={setEndAtTime}
          />
        )}

        {/* 使用回数 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">使用回数</label>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                value={maxUseCount}
                onChange={(e) => setMaxUseCount(e.target.value)}
                className="w-16 px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-sm text-zinc-400">最大回数</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={useCount}
                onChange={(e) => setUseCount(e.target.value)}
                className="w-16 px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-sm text-zinc-400">使用済み回数</span>
            </div>
          </div>
          <div className="text-xs text-zinc-500">
            ※ 購入時に即時適用された場合は、使用済み回数を1に設定してください
          </div>
        </div>

        {error && (error.includes('有効期間') || error.includes('終端日時')) && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
        <Button onClick={handleAdd} disabled={isLoading}>
          追加
        </Button>
      </div>
    </Card>
  )
}

export function RegisterTab(): JSX.Element {
  const { parseEmail, registerCodes, isLoading, error } = useCodeRegistration()

  const [emailText, setEmailText] = useState('')
  const [parsedCodes, setParsedCodes] = useState<ParsedCodeInfo[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const handleParse = useCallback(async () => {
    setParseError(null)
    setRegistrationSuccess(false)
    const codes = await parseEmail(emailText)
    if (codes.length === 0 && error) {
      setParseError(error)
    } else if (codes.length === 0) {
      setParseError('プロモコードが見つかりませんでした')
    } else {
      setParsedCodes(codes)
    }
  }, [emailText, parseEmail, error])

  const handleUpdateCode = useCallback((index: number, updatedCode: ParsedCodeInfo) => {
    setParsedCodes((prev) => {
      const next = [...prev]
      next[index] = updatedCode
      return next
    })
  }, [])

  const handleRemoveCode = useCallback((index: number) => {
    setParsedCodes((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return
    setParsedCodes((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      const current = next[index]
      if (temp !== undefined && current !== undefined) {
        next[index - 1] = current
        next[index] = temp
      }
      return next
    })
  }, [])

  const handleMoveDown = useCallback((index: number) => {
    setParsedCodes((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      const temp = next[index + 1]
      const current = next[index]
      if (temp !== undefined && current !== undefined) {
        next[index + 1] = current
        next[index] = temp
      }
      return next
    })
  }, [])

  const handleAddManual = useCallback((code: ParsedCodeInfo) => {
    setParsedCodes((prev) => [...prev, code])
  }, [])

  const handleRegister = useCallback(async () => {
    // 入力チェック
    // 終端日時モード（validityEndAtあり）の場合はvalidityDurationMinutesは0でもOK
    const invalidCodes = parsedCodes.filter(
      (code) =>
        !code.code ||
        !code.inputDeadline ||
        (code.validityEndAt === null && !code.validityDurationMinutes)
    )
    if (invalidCodes.length > 0) {
      setParseError('すべてのコードに入力期限と有効期間（または終端日時）を設定してください')
      return
    }

    // 次の順序番号を取得するためにAPIを呼び出す
    const response = await window.api.getAllCodes()
    const existingCount = response.codes.length
    let nextOrder = existingCount + 1

    // CreatePromoCodeInputに変換
    const inputs: CreatePromoCodeInput[] = parsedCodes.map((code) => ({
      order: nextOrder++,
      code: code.code,
      inputDeadline: code.inputDeadline!,
      validityDurationMinutes: code.validityDurationMinutes ?? 0,
      validityEndAt: code.validityEndAt ?? null,
      maxUseCount: code.maxUseCount ?? 1,
      useCount: code.useCount ?? 0
    }))

    const success = await registerCodes(inputs)
    if (success) {
      setParsedCodes([])
      setEmailText('')
      setRegistrationSuccess(true)
      setParseError(null)
    }
  }, [parsedCodes, registerCodes])

  const handleClear = useCallback(() => {
    setParsedCodes([])
    setEmailText('')
    setParseError(null)
    setRegistrationSuccess(false)
  }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 成功メッセージ */}
      {registrationSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">登録が完了しました</span>
          </div>
        </div>
      )}

      {/* メール本文貼り付け */}
      <Card title="メール本文から抽出" description="povoから届いたメールの本文を貼り付けてください">
        <div className="space-y-4">
          <Textarea
            label="メール本文"
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="メール本文をここに貼り付け..."
            rows={8}
          />
          {parseError && <div className="text-red-400 text-sm">{parseError}</div>}
          <div className="flex gap-2">
            <Button
              onClick={() => void handleParse()}
              isLoading={isLoading}
              disabled={!emailText.trim()}
            >
              抽出
            </Button>
            {emailText && (
              <Button variant="secondary" onClick={handleClear}>
                クリア
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 抽出結果プレビュー */}
      {parsedCodes.length > 0 && (
        <Card title="抽出結果" description={`${parsedCodes.length}件のコードが見つかりました`}>
          <div className="space-y-3">
            {parsedCodes.map((code, index) => (
              <ParsedCodeEditForm
                key={`${code.code}-${index}`}
                code={code}
                index={index}
                order={index + 1}
                onUpdate={handleUpdateCode}
                onRemove={handleRemoveCode}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={index === 0}
                isLast={index === parsedCodes.length - 1}
              />
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={() => void handleRegister()} isLoading={isLoading}>
              {parsedCodes.length}件を登録
            </Button>
            <Button variant="secondary" onClick={handleClear}>
              キャンセル
            </Button>
          </div>
        </Card>
      )}

      {/* 手入力フォーム */}
      <ManualInputForm onAdd={handleAddManual} isLoading={isLoading} />

      {/* 使用方法ヘルプ */}
      <Card title="使い方">
        <div className="text-sm text-zinc-400 space-y-2">
          <p>1. povoから届いたメールの本文をコピーして、上のテキストエリアに貼り付けます</p>
          <p>2. 「抽出」ボタンをクリックすると、コードと期限情報が自動で抽出されます</p>
          <p>3. 抽出結果を確認し、必要に応じて編集・削除・並べ替えを行います</p>
          <p>4. 「登録」ボタンをクリックして保存します</p>
          <p className="text-zinc-500">
            ※ 自動抽出に失敗した場合は、手入力フォームから追加できます
          </p>
        </div>
      </Card>
    </div>
  )
}
