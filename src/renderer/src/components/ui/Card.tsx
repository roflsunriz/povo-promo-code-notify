/**
 * Cardコンポーネント
 */

import type { JSX, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
}

export function Card({ children, className = '', title, description }: CardProps): JSX.Element {
  return (
    <div
      className={`
        bg-zinc-800 rounded-lg border border-zinc-700
        ${className}
      `}
    >
      {(title ?? description) && (
        <div className="px-4 py-3 border-b border-zinc-700">
          {title && <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>}
          {description && <p className="text-sm text-zinc-400 mt-1">{description}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps): JSX.Element {
  return <div className={`px-4 py-3 border-b border-zinc-700 ${className}`}>{children}</div>
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps): JSX.Element {
  return <div className={`p-4 ${className}`}>{children}</div>
}
