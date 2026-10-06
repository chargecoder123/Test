import { Panel, PanelHeader } from './Panel'

const chartColors: Record<string, string> = { PENDING: '#cbd5e1', IN_PROGRESS: '#8b76f5', COMPLETED: '#2fb47c', CANCELLED: '#f37d8b' }

export function TaskStatusChart({ items }: { items: { key: string; label: string; value: number }[] }) {
  const visible = items.filter((item) => item.key !== 'CANCELLED')
  const total = visible.reduce((sum, item) => sum + item.value, 0)
  let cumulative = 0
  const segments = visible.map((item) => {
    const start = cumulative
    const amount = total ? (item.value / total) * 100 : 0
    cumulative += amount
    return `${chartColors[item.key] || '#94a3b8'} ${start}% ${cumulative}%`
  }).join(', ')
  return (
    <Panel>
      <PanelHeader title="Task status" subtitle="Current workload across your team" />
      <div className="flex flex-col items-center gap-6 px-5 py-6 sm:flex-row sm:justify-center sm:gap-9 sm:px-7">
        <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: total ? `conic-gradient(${segments})` : '#edf1f7' }}>
          <div className="absolute inset-[15px] flex flex-col items-center justify-center rounded-full bg-white"><span className="font-display text-3xl font-extrabold tracking-tight text-ink">{total}</span><span className="mt-0.5 text-[10px] font-semibold text-muted">tracked tasks</span></div>
        </div>
        <div className="w-full space-y-3 sm:max-w-[180px]">
          {visible.map((item) => <div key={item.key} className="flex items-center justify-between gap-5"><span className="flex items-center gap-2.5 text-xs font-semibold text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[item.key] }} />{item.label}</span><span className="text-xs font-bold text-ink">{item.value}</span></div>)}
          <div className="border-t border-slate-100 pt-3 text-[10px] leading-5 text-muted">Completed work is included in team totals.</div>
        </div>
      </div>
    </Panel>
  )
}

export function DailyTasksChart({ items }: { items: { day: string; date: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <Panel>
      <PanelHeader title="Daily task flow" subtitle="New tasks created over the last seven days" />
      <div className="flex h-[220px] items-end gap-2 px-4 pb-4 pt-7 sm:gap-4 sm:px-6">
        {items.map((item) => <div key={item.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-slate-500">{item.value || ''}</span><div className="flex h-[145px] w-full items-end"><div className="w-full rounded-t-lg bg-blue-100 transition-all hover:bg-brand-300" style={{ height: `${Math.max((item.value / max) * 100, 4)}%`, minHeight: item.value ? 12 : 4 }} /></div><span className="text-[10px] font-semibold text-muted">{item.day}</span></div>)}
      </div>
    </Panel>
  )
}

export function MonthlyTasksChart({ items }: { items: { month: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <Panel>
      <PanelHeader title="Work over time" subtitle="Tasks created in the last six months" />
      <div className="flex h-[220px] items-end gap-3 px-5 pb-4 pt-7 sm:gap-5 sm:px-7">
        {items.map((item, index) => {
          const height = Math.max((item.value / max) * 100, 5)
          return <div key={`${item.month}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-slate-500">{item.value || ''}</span><div className="flex h-[145px] w-full items-end"><div className={`w-full rounded-t-lg transition-all ${index === items.length - 1 ? 'bg-brand-500' : 'bg-blue-100'}`} style={{ height: `${height}%`, minHeight: item.value ? 12 : 4 }} /></div><span className="text-[10px] font-semibold text-muted">{item.month}</span></div>
        })}
      </div>
    </Panel>
  )
}

export function PerformanceChart({ items }: { items: { name: string; completed: number }[] }) {
  const max = Math.max(...items.map((item) => item.completed), 1)
  return (
    <Panel>
      <PanelHeader title="Team momentum" subtitle="Completed tasks by employee" />
      {!items.length ? <div className="px-6 py-10 text-center text-sm text-muted">Performance will appear as work is completed.</div> : <div className="space-y-4 px-5 py-5 sm:px-7">
        {items.map((item, index) => <div key={`${item.name}-${index}`}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-semibold text-slate-600">{item.name}</span><span className="text-[11px] font-bold text-ink">{item.completed}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${index === 0 ? 'bg-brand-500' : 'bg-blue-300'}`} style={{ width: `${Math.max((item.completed / max) * 100, 3)}%` }} /></div></div>)}
      </div>}
    </Panel>
  )
}
