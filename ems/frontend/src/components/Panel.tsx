import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx('rounded-2xl border border-slate-200/80 bg-white shadow-soft', className)}>{children}</section>
}

export function PanelHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div>
        <h2 className="font-display text-sm font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
