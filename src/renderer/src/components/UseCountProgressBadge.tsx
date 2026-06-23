import type { PromoCodeWithStatus } from '../../../types/code'
import type { JSX } from 'react'

interface UseCountProgress {
  current: number
  total: number
  percent: number
  label: string
  detail: string
}

function getUseCountProgress(code: PromoCodeWithStatus): UseCountProgress {
  const total = Math.max(1, code.maxUseCount)
  const completedUses = Math.min(code.useCount, total)
  const current = code.status === 'active' ? Math.min(completedUses + 1, total) : completedUses
  const remainingAfterCurrent =
    code.status === 'active' ? Math.max(0, total - current) : Math.max(0, total - completedUses)

  return {
    current,
    total,
    percent: Math.round((current / total) * 100),
    label: code.status === 'active' ? `${current}/${total}回目` : `${current}/${total}回`,
    detail:
      code.status === 'active'
        ? `使用中 ${current}回目・完了済み ${completedUses}回・次回以降 ${remainingAfterCurrent}回`
        : `使用済み ${completedUses}回・残り ${remainingAfterCurrent}回`
  }
}

export function UseCountProgressBadge({ code }: { code: PromoCodeWithStatus }): JSX.Element {
  const progress = getUseCountProgress(code)

  return (
    <span
      role="progressbar"
      aria-label={progress.detail}
      aria-valuemin={0}
      aria-valuemax={progress.total}
      aria-valuenow={progress.current}
      title={progress.detail}
      className="relative inline-flex h-6 min-w-24 items-center justify-center overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2 text-xs font-medium text-cyan-100"
    >
      <span
        className="absolute inset-y-0 left-0 bg-cyan-500/40"
        style={{ width: `${progress.percent}%` }}
      />
      <span className="relative font-mono tabular-nums">{progress.label}</span>
    </span>
  )
}

export function getUseCountProgressDetail(code: PromoCodeWithStatus): string {
  return getUseCountProgress(code).detail
}
