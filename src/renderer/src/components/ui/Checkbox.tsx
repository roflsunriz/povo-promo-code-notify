/**
 * Checkboxコンポーネント
 */

import { forwardRef } from 'react'
import type { InputHTMLAttributes, JSX } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className = '', id, ...props },
  ref
): JSX.Element {
  const checkboxId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <label
      htmlFor={checkboxId}
      className={`
        inline-flex items-center gap-2 cursor-pointer
        text-zinc-300 text-sm
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        className="
          w-4 h-4
          bg-zinc-800
          border border-zinc-600
          rounded
          text-amber-500
          focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-900
          disabled:opacity-50
        "
        {...props}
      />
      {label}
    </label>
  )
})
