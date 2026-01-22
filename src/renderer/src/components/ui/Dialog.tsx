/**
 * Dialogコンポーネント
 * 確認ダイアログ用
 */

import { useEffect, useRef } from 'react'
import { Button } from './Button'
import type { JSX, ReactNode, MouseEvent } from 'react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  variant?: 'default' | 'danger'
  isLoading?: boolean
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  onConfirm,
  variant = 'default',
  isLoading = false
}: DialogProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event): void => {
      e.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [onClose])

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>): void => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className="
        fixed inset-0 z-50
        bg-transparent
        backdrop:bg-black/50
        p-0 m-auto
        max-w-md w-full
        rounded-lg
        open:animate-in open:fade-in open:zoom-in-95
      "
      onClick={handleBackdropClick}
      aria-labelledby="dialog-title"
    >
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl">
        <div className="px-4 py-3 border-b border-zinc-700">
          <h2 id="dialog-title" className="text-lg font-semibold text-zinc-100">
            {title}
          </h2>
        </div>
        <div className="p-4 text-zinc-300">{children}</div>
        <div className="px-4 py-3 border-t border-zinc-700 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  )
}
