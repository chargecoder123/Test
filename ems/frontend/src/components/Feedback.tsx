import { CircleAlert, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading your workspace…' }: { label?: string }) {
  return <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-sm text-muted"><LoaderCircle className="h-6 w-6 animate-spin text-brand-600" />{label}</div>
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><CircleAlert className="h-5 w-5" /></span>
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'We could not load this information.' }: { message?: string }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">{message}</div>
}
