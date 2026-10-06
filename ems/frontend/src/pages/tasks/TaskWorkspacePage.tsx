import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BriefcaseBusiness, ClipboardList, Plus, Search, SlidersHorizontal } from 'lucide-react'
import type { Role, Task, TaskInput, TaskUpdateInput } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { managerApi } from '../../services/managerApi'
import { taskApi } from '../../services/taskApi'
import { getApiError } from '../../services/api'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/Button'
import { Panel } from '../../components/Panel'
import { TaskTable } from '../../components/TaskTable'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { SelectInput, TextInput } from '../../components/FormField'
import { ConfirmDialog, Modal } from '../../components/Modal'
import { FieldLabel, TextArea } from '../../components/FormField'
import { TaskFormDialog } from './TaskFormDialog'

interface TaskWorkspaceProps {
  role: Extract<Role, 'ADMIN' | 'MANAGER'>
  dailyOnly?: boolean
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function TaskWorkspacePage({ role, dailyOnly = false }: TaskWorkspaceProps) {
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [createDaily, setCreateDaily] = useState(dailyOnly)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [reviewTask, setReviewTask] = useState<Task | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [working, setWorking] = useState(false)
  const isManager = role === 'MANAGER'
  const queryKey = ['tasks', role.toLowerCase(), dailyOnly ? 'daily' : 'all', search, statusFilter]
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (isManager && dailyOnly) return managerApi.dailyJobs()
      if (isManager) return managerApi.tasks({ page: 1, page_size: 100, search: search || undefined, status: statusFilter || undefined })
      return taskApi.all({ page: 1, page_size: 100, search: search || undefined, status: statusFilter || undefined, daily_only: dailyOnly || undefined })
    },
  })
  const taskRows = useMemo(() => {
    const items = query.data?.items || []
    if (!isManager || !dailyOnly) return items
    return items.filter((task) => (!statusFilter || task.status === statusFilter) && (!search || `${task.title} ${task.description || ''} ${task.assigned_employee.first_name} ${task.assigned_employee.last_name}`.toLowerCase().includes(search.toLowerCase())))
  }, [query.data, isManager, dailyOnly, statusFilter, search])
  const canCreateRegular = role === 'ADMIN' || hasPermission('task_management', 'create')
  const canCreateDaily = role === 'ADMIN' || hasPermission('daily_jobs', 'create')
  const canEdit = role === 'ADMIN' || hasPermission('task_management', 'update')
  const canDelete = role === 'ADMIN' || hasPermission('task_management', 'delete')

  function openCreate(isDaily: boolean) {
    setEditingTask(null)
    setCreateDaily(isDaily)
    setFormOpen(true)
  }
  function openEdit(task: Task) {
    setEditingTask(task)
    setCreateDaily(task.is_daily_job)
    setFormOpen(true)
  }

  async function saveTask(payload: TaskInput | TaskUpdateInput, task?: Task) {
    setWorking(true)
    try {
      if (task) {
        if (role === 'ADMIN') await taskApi.update(task.id, payload)
        else await managerApi.updateTask(task.id, payload)
        toast.success('Task updated.')
      } else {
        const input = payload as TaskInput
        if (role === 'ADMIN') await taskApi.create(input)
        else if (input.is_daily_job) await managerApi.createDailyJob(input)
        else await managerApi.createTask(input)
        toast.success(input.is_daily_job ? 'Daily job assigned.' : 'Task created.')
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['manager', 'employee-tasks'] }),
      ])
    } catch (error) {
      toast.error(getApiError(error))
      throw error
    } finally {
      setWorking(false)
    }
  }

  async function removeTask() {
    if (!deletingTask) return
    setWorking(true)
    try {
      if (role === 'ADMIN') await taskApi.remove(deletingTask.id)
      else await managerApi.deleteTask(deletingTask.id)
      toast.success('Task deleted.')
      setDeletingTask(null)
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setWorking(false)
    }
  }

  async function submitReview() {
    if (!reviewTask || !reviewNotes.trim()) return
    setWorking(true)
    try {
      await managerApi.reviewTask(reviewTask.id, reviewNotes.trim())
      toast.success('Review added to the task.')
      setReviewTask(null)
      setReviewNotes('')
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      await queryClient.invalidateQueries({ queryKey: ['manager', 'employee-tasks'] })
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setWorking(false)
    }
  }

  const heading = dailyOnly ? 'Daily jobs' : 'Task management'
  const intro = dailyOnly ? 'Plan repeatable, day-to-day work and keep assignments visible.' : 'Assign clear outcomes, track progress, and review completed work.'
  return (
    <div>
      <PageHeader eyebrow={isManager ? 'Team operations' : 'Work management'} title={heading} description={intro} action={<div className="flex flex-wrap gap-2">{canCreateDaily && !dailyOnly && <Button variant="outline" icon={<BriefcaseBusiness className="h-4 w-4" />} onClick={() => openCreate(true)}>Daily job</Button>}{(dailyOnly ? canCreateDaily : canCreateRegular) && <Button icon={<Plus className="h-4 w-4" />} onClick={() => openCreate(dailyOnly)}>Create {dailyOnly ? 'job' : 'task'}</Button>}</div>} />
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-brand-600"><ClipboardList className="h-4 w-4" /></span><div><h2 className="font-display text-sm font-bold text-ink">{dailyOnly ? 'Job board' : 'Task board'}</h2><p className="mt-1 text-[11px] text-muted">{taskRows.length} {dailyOnly ? 'daily jobs' : 'tasks'}{query.data?.total && query.data.total > taskRows.length ? ` · ${query.data.total} total` : ''}</p></div></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><TextInput className="min-w-[220px] pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks or people" aria-label="Search tasks" /></label><label className="relative"><SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><SelectInput className="min-w-[150px] pl-9" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter tasks by status">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectInput></label></div></div>
        {query.isLoading ? <LoadingState label="Loading your task board…" /> : query.isError ? <div className="p-5"><ErrorState message="The task list could not be loaded." /></div> : !taskRows.length ? <EmptyState title={search || statusFilter ? 'No matching work' : `No ${dailyOnly ? 'daily jobs' : 'tasks'} yet`} description={search || statusFilter ? 'Try a different search or status filter.' : 'Create an assignment to get your team moving.'} action={(dailyOnly ? canCreateDaily : canCreateRegular) ? <Button icon={<Plus className="h-4 w-4" />} onClick={() => openCreate(dailyOnly)}>Create {dailyOnly ? 'job' : 'task'}</Button> : undefined} /> : <TaskTable tasks={taskRows} onEdit={canEdit ? openEdit : undefined} onDelete={canDelete ? setDeletingTask : undefined} onReview={isManager && canEdit ? (task) => { setReviewTask(task); setReviewNotes(task.manager_notes || '') } : undefined} />}
      </Panel>
      <TaskFormDialog open={formOpen} role={role} task={editingTask} dailyJob={createDaily} onClose={() => setFormOpen(false)} onSave={saveTask} />
      <ConfirmDialog open={Boolean(deletingTask)} title="Delete this task?" description={deletingTask ? `“${deletingTask.title}” will be permanently removed from the task board.` : ''} onCancel={() => setDeletingTask(null)} onConfirm={removeTask} busy={working} confirmLabel="Delete task" />
      <Modal open={Boolean(reviewTask)} onClose={() => setReviewTask(null)} title="Review completed work" description={reviewTask ? `Leave feedback for ${reviewTask.assigned_employee.first_name} on “${reviewTask.title}”.` : ''}>
        <div className="space-y-4"><label><FieldLabel>Manager feedback</FieldLabel><TextArea rows={5} value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Recognize what went well or share what to improve…" /></label><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setReviewTask(null)}>Cancel</Button><Button busy={working} disabled={!reviewNotes.trim()} onClick={submitReview}>Save review</Button></div></div>
      </Modal>
    </div>
  )
}
