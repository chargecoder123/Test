import { CalendarDays, CheckCheck, ClipboardList, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Task } from '../types'
import { Avatar } from './Avatar'
import { EmptyState } from './Feedback'
import { PriorityBadge, StatusBadge } from './StatusBadge'
import { formatShortDate, taskIsOverdue } from '../utils/format'

interface TaskTableProps {
  tasks: Task[]
  showAssignee?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  onReview?: (task: Task) => void
}

export function TaskTable({ tasks, showAssignee = true, emptyTitle = 'No tasks yet', emptyDescription = 'Assigned work will appear here.', onEdit, onDelete, onReview }: TaskTableProps) {
  if (!tasks.length) return <EmptyState title={emptyTitle} description={emptyDescription} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[710px] text-left">
        <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400"><th className="px-5 py-3.5">Task</th>{showAssignee && <th className="px-4 py-3.5">Employee</th>}<th className="px-4 py-3.5">Priority</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5">Due date</th><th className="px-4 py-3.5 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const overdue = taskIsOverdue(task.status, task.due_date)
            return (
              <tr key={task.id} className="group transition hover:bg-slate-50/70">
                <td className="px-5 py-4"><div className="flex min-w-[210px] items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><ClipboardList className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-[13px] font-bold text-ink">{task.title}</span><span className="mt-1 block max-w-[240px] truncate text-[11px] text-muted">{task.description || (task.is_daily_job ? 'Daily job' : 'No description')}</span></span></div></td>
                {showAssignee && <td className="px-4 py-4"><div className="flex items-center gap-2.5"><Avatar name={`${task.assigned_employee.first_name} ${task.assigned_employee.last_name}`} size="sm" /><span className="text-xs font-semibold text-slate-700">{task.assigned_employee.first_name} {task.assigned_employee.last_name}</span></div></td>}
                <td className="px-4 py-4"><PriorityBadge priority={task.priority} /></td>
                <td className="px-4 py-4"><StatusBadge status={task.status} /></td>
                <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${overdue ? 'text-rose-600' : 'text-slate-600'}`}><CalendarDays className="h-3.5 w-3.5 text-slate-400" />{formatShortDate(task.due_date)}{overdue && <span className="text-[9px] uppercase tracking-wide">Late</span>}</span></td>
                <td className="px-4 py-4"><div className="flex items-center justify-end gap-1.5">
                  {onReview && task.status === 'COMPLETED' && <button onClick={() => onReview(task)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50"><CheckCheck className="h-3.5 w-3.5" /><span className="hidden xl:inline">Review</span></button>}
                  {onEdit && <button onClick={() => onEdit(task)} title="Edit task" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600"><Pencil className="h-3.5 w-3.5" /></button>}
                  {onDelete && <button onClick={() => onDelete(task)} title="Delete task" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>}
                  {!onReview && !onEdit && !onDelete && <MoreHorizontal className="h-4 w-4 text-slate-300" />}
                </div></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
