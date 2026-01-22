/**
 * Inputコンポーネント
 */

import { forwardRef } from 'react'
import type { InputHTMLAttributes, JSX } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className = '', id, ...props },
  ref
): JSX.Element {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full px-3 py-2
          bg-zinc-800 text-zinc-100
          border rounded-lg
          transition-colors duration-150
          placeholder:text-zinc-500
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900
          disabled:bg-zinc-800/50 disabled:text-zinc-500 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-400' : 'border-zinc-700 focus:ring-amber-400 focus:border-amber-400'}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-sm text-zinc-500">
          {helperText}
        </p>
      )}
    </div>
  )
})
