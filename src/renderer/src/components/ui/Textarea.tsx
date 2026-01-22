/**
 * Textareaコンポーネント
 */

import { forwardRef } from 'react'
import type { JSX, TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helperText, className = '', id, ...props },
  ref
): JSX.Element {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`
          w-full px-3 py-2
          bg-zinc-800 text-zinc-100
          border rounded-lg
          transition-colors duration-150
          placeholder:text-zinc-500
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900
          disabled:bg-zinc-800/50 disabled:text-zinc-500 disabled:cursor-not-allowed
          resize-y min-h-[100px]
          ${error ? 'border-red-500 focus:ring-red-400' : 'border-zinc-700 focus:ring-amber-400 focus:border-amber-400'}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${textareaId}-helper`} className="text-sm text-zinc-500">
          {helperText}
        </p>
      )}
    </div>
  )
})
