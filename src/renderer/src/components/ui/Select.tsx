/**
 * Selectコンポーネント
 */

import { forwardRef } from 'react'
import type { JSX, SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, className = '', id, ...props },
  ref
): JSX.Element {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`
          w-full px-3 py-2
          bg-zinc-800 text-zinc-100
          border rounded-lg
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900
          disabled:bg-zinc-800/50 disabled:text-zinc-500 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-400' : 'border-zinc-700 focus:ring-amber-400 focus:border-amber-400'}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
