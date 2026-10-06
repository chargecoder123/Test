import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: number | string
  note?: string
  icon: LucideIcon
  tone?: 'blue' | 'green' | 'amber' | 'violet' | 'rose' | 'slate'
}

export function StatsCard({ label, value, note, icon: Icon, tone = 'blue' }: StatsCardProps) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }[tone]
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}><Icon className="h-[18px] w-[18px]" /></span>
        <ArrowUpRight className="h-4 w-4 text-slate-300" />
      </div>
      <div className="mt-5 font-display text-[30px] font-bold leading-none tracking-tight text-ink">{value}</div>
      <div className="mt-2 text-sm font-semibold text-slate-600">{label}</div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </article>
  )
}
