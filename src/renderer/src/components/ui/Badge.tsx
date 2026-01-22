/**
 * Badgeコンポーネント
 * コードの状態表示に使用
 */

import type { JSX, ReactNode } from 'react'

type BadgeVariant = 'active' | 'unused' | 'consumed' | 'expired' | 'info' | 'warning'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  unused: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  consumed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

export function Badge({ variant, children, className = '' }: BadgeProps): JSX.Element {
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        text-xs font-medium
        rounded-full
        border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

/**
 * コード状態からBadgeのvariantを取得
 */
export function getStatusBadgeVariant(
  status: 'active' | 'unused' | 'consumed' | 'expired'
): BadgeVariant {
  return status
}

/**
 * コード状態の日本語表示
 */
export function getStatusLabel(status: 'active' | 'unused' | 'consumed' | 'expired'): string {
  const labels: Record<string, string> = {
    active: '使用中',
    unused: '未使用',
    consumed: '消費済み',
    expired: '期限切れ',
  }
  return labels[status] ?? status
}
