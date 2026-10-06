import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Activity, ArrowRight, BriefcaseBusiness, CalendarClock, Check, MessageSquareText, Play, Search, Sparkles, Zap } from 'lucide-react'
import type { Task } from '../../types'
import { employeeApi } from '../../services/employeeApi'
import { useAuth } from '../../context/AuthContext'
import { getApiError } from '../../services/api'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelHeader } from '../../components/Panel'
import { Button } from '../../components/Button'
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { ConfirmDialog, Modal } from '../../components/Modal'
import { FieldLabel, SelectInput, TextArea, TextInput } from '../../components/FormField'
import { formatDateTime, formatShortDate, taskIsOverdue } from '../../utils/format'

export type EmployeeTaskView = 'tasks' | 'daily' | 'history'

export function EmployeeTasksPage({ view }: { view: EmployeeTaskView }) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('my_tasks', 'update')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [noteTask, setNoteTask] = useState<Task | null>(null)
  const [note, setNote] = useState('')
  const [busyTask, setBusyTask] = useState<Task | null>(null)
  const [working, setWorking] = useState(false)
  const queryKey = ['employee', 'tasks', view, statusFilter]
  const query = useQuery({
    queryKey,
    queryFn: () => view === 'daily' ? employeeApi.dailyJobs() : view === 'history' ? employeeApi.history(statusFilter || undefined) : employeeApi.tasks(),
  })
  const activityQuery = useQuery({ queryKey: ['employee', 'activity'], queryFn: employeeApi.activity, enabled: view === 'history' })
  const visibleTasks = useMemo(() => (query.data?.items || []).filter((task) => {
    const matchesStatus = !statusFilter || task.status === statusFilter
    const matchesSearch = !search || `${task.title} ${task.description || ''} ${task.assigner.first_name} ${task.assigner.last_name}`.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  }), [query.data, statusFilter, search])
  const pageTitle = view === 'daily' ? 'Daily jobs' : view === 'history' ? 'Task history' : 'My tasks'
  const pageDescription = view === 'daily' ? 'The day-to-day work your manager has lined up for you.' : view === 'history' ? 'A record of the work you have received and completed.' : 'Your assigned work, with clear next steps and due dates.'

  async function updateTask(task: Task, action: 'start' | 'complete') {
    setWorking(true)
    try {
      if (action === 'start') await employeeApi.startTask(task.id)
      else await employeeApi.completeTask(task.id)
      toast.success(action === 'start' ? 'Task started. You’ve got this.' : 'Task marked complete. Nice work!')
      await queryClient.invalidateQueries({ queryKey: ['employee', 'tasks'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'employee'] })
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setWorking(false)
      setBusyTask(null)
    }
  }

  async function addNote() {
    if (!noteTask || !note.trim()) return
    setWorking(true)
    try {
      await employeeApi.addTaskNote(noteTask.id, note.trim())
      toast.success('Your note was added to the task.')
      setNoteTask(null)
      setNote('')
      await queryClient.invalidateQueries({ queryKey: ['employee', 'tasks'] })
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setWorking(false)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="My work" title={pageTitle} description={pageDescription} action={view !== 'history' ? <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200"><BriefcaseBusiness className="h-4 w-4 text-brand-600" />{query.data?.total ?? '—'} assignments</span> : undefined} />
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-brand-600"><Sparkles className="h-4 w-4" /></span><div><h2 className="font-display text-sm font-bold text-ink">{view === 'daily' ? 'Today’s jobs' : view === 'history' ? 'Work timeline' : 'Assigned to me'}</h2><p className="mt-1 text-[11px] text-muted">{visibleTasks.length} visible {visibleTasks.length === 1 ? 'task' : 'tasks'}</p></div></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><TextInput className="min-w-[210px] pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your tasks" aria-label="Search tasks" /></label><SelectInput className="sm:w-36" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter tasks by status"><option value="">All statuses</option><option value="PENDING">Pending</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></SelectInput></div></div>
        {query.isLoading ? <LoadingState label="Finding your work…" /> : query.isError ? <div className="p-5"><ErrorState message="Your tasks could not be loaded." /></div> : !visibleTasks.length ? <EmptyState title={search || statusFilter ? 'No matching tasks' : view === 'daily' ? 'No daily jobs assigned' : view === 'history' ? 'No task history yet' : 'You’re all caught up'} description={search || statusFilter ? 'Try a different search or status.' : 'New work from your manager will show up here.'} /> : <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">{visibleTasks.map((task) => {
          const overdue = taskIsOverdue(task.status, task.due_date)
          const actionable = view !== 'history' && task.status !== 'COMPLETED' && task.status !== 'CANCELLED'
          return <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-soft sm:p-5">
            <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Zap className="h-[18px] w-[18px]" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-ink">{task.title}</h3>{task.is_daily_job && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-600">Daily job</span>}</div><p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-slate-500">{task.description || 'No description was added.'}</p></div><PriorityBadge priority={task.priority} /></div>
            <div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge status={task.status} /><span className={`inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold ${overdue ? 'text-rose-600' : 'text-slate-500'}`}><CalendarClock className="h-3 w-3" />Due {formatShortDate(task.due_date)}{overdue && ' · overdue'}</span></div>
            <div className="mt-4 rounded-xl bg-slate-50/80 px-3.5 py-3"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Manager</span><span className="text-[11px] font-semibold text-slate-700">{task.assigner.first_name} {task.assigner.last_name}</span></div>{task.manager_notes && <p className="mt-2 whitespace-pre-line border-t border-slate-200/70 pt-2 text-[11px] leading-5 text-slate-600"><span className="font-bold text-slate-700">Guidance: </span>{task.manager_notes}</p>}{task.completed_at && <div className="mt-2 border-t border-slate-200/70 pt-2 text-[10px] text-slate-500">Completed {formatDateTime(task.completed_at)}</div>}</div>
            {task.employee_notes && <div className="mt-3 line-clamp-2 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2.5 text-[10px] leading-5 text-slate-600"><span className="font-bold text-brand-700">Your notes: </span>{task.employee_notes}</div>}
            {actionable && canUpdate && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5"><button onClick={() => { setNoteTask(task); setNote('') }} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-ink"><MessageSquareText className="h-3.5 w-3.5" />Add note</button><div>{task.status === 'PENDING' ? <Button size="sm" onClick={() => setBusyTask(task)} icon={<Play className="h-3.5 w-3.5" />}>Start task</Button> : <Button size="sm" onClick={() => setBusyTask(task)} icon={<Check className="h-3.5 w-3.5" />}>Mark complete</Button>}</div></div>}
            {!actionable && <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5 text-[11px] font-semibold text-emerald-700"><Check className="h-4 w-4" />Work submitted{task.completed_at && <span className="font-normal text-slate-400">· {formatDateTime(task.completed_at)}</span>}<ArrowRight className="ml-auto h-4 w-4 text-slate-300" /></div>}
          </article>
        })}</div>}
      </Panel>
      {view === 'history' && <Panel className="mt-5"><PanelHeader title="My activity" subtitle="A private timeline of sign-ins and work updates" />{activityQuery.isLoading ? <LoadingState label="Loading your activity…" /> : activityQuery.isError ? <div className="p-5"><ErrorState message="Your activity timeline could not be loaded." /></div> : !activityQuery.data?.length ? <EmptyState title="No activity recorded" description="Your recent work updates will appear here." /> : <div className="divide-y divide-slate-100">{activityQuery.data.map((event) => <div key={event.id} className="flex items-center gap-3.5 px-5 py-3.5 sm:px-6"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-600"><Activity className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="text-xs font-bold text-ink">{event.event_type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}</div><div className="mt-1 truncate text-[11px] text-muted">{event.note || 'Activity recorded.'}</div></div><time className="shrink-0 text-[10px] font-medium text-slate-400">{formatDateTime(event.created_at)}</time></div>)}</div>}</Panel>}
      <Modal open={Boolean(noteTask)} onClose={() => setNoteTask(null)} title="Add a work note" description={noteTask ? `Your note will be visible to your manager on “${noteTask.title}”.` : ''}>
        <div className="space-y-4"><label><FieldLabel>Work note</FieldLabel><TextArea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Share a quick update, blocker, or handoff detail…" /></label><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setNoteTask(null)}>Cancel</Button><Button busy={working} disabled={!note.trim()} onClick={addNote}>Add note</Button></div></div>
      </Modal>
      <ConfirmDialog open={Boolean(busyTask)} title={busyTask?.status === 'PENDING' ? 'Start this task?' : 'Mark this task complete?'} description={busyTask?.title ? `“${busyTask.title}” will be moved to ${busyTask.status === 'PENDING' ? 'in progress' : 'completed'}.` : ''} onCancel={() => setBusyTask(null)} onConfirm={() => busyTask && updateTask(busyTask, busyTask.status === 'PENDING' ? 'start' : 'complete')} busy={working} confirmLabel={busyTask?.status === 'PENDING' ? 'Start task' : 'Mark complete'} />
    </div>
  )
}
