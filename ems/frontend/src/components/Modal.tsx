import { useEffect, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  submitLabel?: string
  submitting?: boolean
  size?: 'md' | 'lg'
}

export function Modal({ open, onClose, title, description, children, onSubmit, submitLabel = 'Save changes', submitting, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const content = (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={clsx('max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl', size === 'lg' ? 'max-w-2xl' : 'max-w-xl')}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-7 sm:py-5">
          <div><h2 className="font-display text-lg font-bold text-ink">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        {onSubmit ? (
          <form onSubmit={onSubmit}>
            <div className="px-5 py-5 sm:px-7">{children}</div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-7">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" busy={submitting}>{submitLabel}</Button>
            </div>
          </form>
        ) : <div className="px-5 py-5 sm:px-7">{children}</div>}
      </div>
    </div>
  )
  return content
}

export function ConfirmDialog({ open, title, description, onCancel, onConfirm, busy, confirmLabel = 'Confirm' }: {
  open: boolean
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
  busy?: boolean
  confirmLabel?: string
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" busy={busy} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
