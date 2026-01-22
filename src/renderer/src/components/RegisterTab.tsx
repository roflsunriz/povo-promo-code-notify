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
    day: '2-digit',
  })
}

/**
 * 有効期間をフォーマット
 */
function formatValidityDuration(minutes: number | null): string {
  if (minutes === null) {
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
  isLast,
}: ParsedCodeEditFormProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [editedCode, setEditedCode] = useState(code.code)
  const [editedDeadline, setEditedDeadline] = useState(
    code.inputDeadline ? code.inputDeadline.substring(0, 10) : ''
  )
  const [editedDuration, setEditedDuration] = useState(
    code.validityDurationMinutes?.toString() ?? '10080'
  )

  const handleSave = useCallback(() => {
    const deadlineIso = editedDeadline
      ? `${editedDeadline}T23:59:59.999+09:00`
      : null

    onUpdate(index, {
      code: editedCode,
      inputDeadline: deadlineIso,
      validityDurationMinutes: parseInt(editedDuration, 10) || 10080,
    })
    setIsEditing(false)
  }, [index, editedCode, editedDeadline, editedDuration, onUpdate])

  const handleCancel = useCallback(() => {
    setEditedCode(code.code)
    setEditedDeadline(code.inputDeadline ? code.inputDeadline.substring(0, 10) : '')
    setEditedDuration(code.validityDurationMinutes?.toString() ?? '10080')
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={isLast}
              className="p-0.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="下に移動"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
            <Input
              label="有効期間（分）"
              type="number"
              value={editedDuration}
              onChange={(e) => setEditedDuration(e.target.value)}
              helperText="7日=10080, 24時間=1440, 1時間=60"
            />
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
              <div>有効期間: {formatValidityDuration(code.validityDurationMinutes)}</div>
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
 * 手入力フォーム
 */
function ManualInputForm({
  onAdd,
  isLoading,
}: {
  onAdd: (code: ParsedCodeInfo) => void
  isLoading: boolean
}): JSX.Element {
  const [code, setCode] = useState('')
  const [deadline, setDeadline] = useState('')
  const [duration, setDuration] = useState('10080')
  const [error, setError] = useState<string | null>(null)

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
    onAdd({
      code: code.trim().toUpperCase(),
      inputDeadline: deadlineIso,
      validityDurationMinutes: parseInt(duration, 10) || 10080,
    })

    // フォームをリセット
    setCode('')
    setDeadline('')
    setDuration('10080')
    setError(null)
  }, [code, deadline, duration, onAdd])

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
        <Input
          label="有効期間（分）"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          helperText="7日=10080, 24時間=1440, 1時間=60"
        />
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
    const invalidCodes = parsedCodes.filter(
      (code) => !code.code || !code.inputDeadline || !code.validityDurationMinutes
    )
    if (invalidCodes.length > 0) {
      setParseError('すべてのコードに入力期限と有効期間を設定してください')
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
      validityDurationMinutes: code.validityDurationMinutes!,
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
          {parseError && (
            <div className="text-red-400 text-sm">{parseError}</div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => void handleParse()} isLoading={isLoading} disabled={!emailText.trim()}>
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
          <p className="text-zinc-500">※ 自動抽出に失敗した場合は、手入力フォームから追加できます</p>
        </div>
      </Card>
    </div>
  )
}
