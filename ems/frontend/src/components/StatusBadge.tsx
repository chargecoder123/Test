import clsx from 'clsx'
import type { TaskPriority, TaskStatus } from '../types'
import { getPriorityTone, getStatusTone } from '../utils/format'

export function StatusBadge({ status }: { status: TaskStatus }) {
  const label = status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold', getStatusTone(status))}>{label}</span>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold', getPriorityTone(priority))}>{priority.toLowerCase()}</span>
}

export function AccountStatus({ active }: { active: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-400')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
