import { useEffect, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ManagedEmployee, PageResult, Role, Task, TaskPriority, TaskStatus, TaskInput, TaskUpdateInput, User } from '../../types'
import { adminApi } from '../../services/adminApi'
import { managerApi } from '../../services/managerApi'
import { FieldLabel, SelectInput, TextArea, TextInput } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { toast } from 'sonner'

interface TaskFormDialogProps {
  open: boolean
  role: Extract<Role, 'ADMIN' | 'MANAGER'>
  task?: Task | null
  dailyJob?: boolean
  onClose: () => void
  onSave: (data: TaskInput | TaskUpdateInput, task?: Task) => Promise<void>
}

function localDateValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function TaskFormDialog({ open, role, task, dailyJob = false, onClose, onSave }: TaskFormDialogProps) {
  const employeeQuery = useQuery<PageResult<User | ManagedEmployee>>({
    queryKey: [role === 'ADMIN' ? 'admin' : 'manager', 'task-assignees'],
    queryFn: async () => {
      const result = role === 'ADMIN'
        ? await adminApi.employees({ page: 1, page_size: 100, is_active: true })
        : await managerApi.employees({ page: 1, page_size: 100 })
      return { items: result.items, total: result.total, page: result.page, page_size: result.page_size }
    },
    enabled: open,
  })
  const employees: (User | ManagedEmployee)[] = employeeQuery.data?.items || []
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [isDailyJob, setIsDailyJob] = useState(dailyJob)
  const [status, setStatus] = useState<TaskStatus>('PENDING')
  const [managerNotes, setManagerNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title || '')
    setDescription(task?.description || '')
    setAssignedTo(task ? String(task.assigned_to) : '')
    setPriority(task?.priority || 'MEDIUM')
    setDueDate(localDateValue(task?.due_date))
    setIsDailyJob(task?.is_daily_job ?? dailyJob)
    setStatus(task?.status || 'PENDING')
    setManagerNotes(task?.manager_notes || '')
  }, [open, task, dailyJob])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!assignedTo) {
      toast.error('Choose an employee for this task.')
      return
    }
    setSaving(true)
    try {
      const dueAt = dueDate ? new Date(dueDate).toISOString() : null
      const payload: TaskInput | TaskUpdateInput = {
        title: title.trim(),
        description: description.trim() || null,
        assigned_to: Number(assignedTo),
        priority,
        due_date: dueAt,
        is_daily_job: dailyJob || isDailyJob,
        manager_notes: managerNotes.trim() || null,
        ...(role === 'ADMIN' ? { status } : {}),
      }
      await onSave(payload, task || undefined)
      onClose()
    } catch {
      // The mutation owner displays the API error.
    } finally {
      setSaving(false)
    }
  }

  const employeeLabel = (employee: User | ManagedEmployee) => employee.full_name || `${employee.first_name} ${employee.last_name}`
  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : dailyJob ? 'Create a daily job' : 'Create a task'} description={task ? 'Update the brief, owner, or due date.' : 'Give your employee a clear brief and a realistic due date.'} onSubmit={submit} submitLabel={task ? 'Save task' : dailyJob ? 'Assign daily job' : 'Create task'} submitting={saving} size="lg">
      <div className="space-y-4">
        <label className="block"><FieldLabel required>Task title</FieldLabel><TextInput required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Prepare the weekly customer summary" /></label>
        <label className="block"><FieldLabel>Description</FieldLabel><TextArea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add context, expected outcomes, or useful links…" rows={3} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><FieldLabel required>Assign to</FieldLabel><SelectInput required value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">Choose an employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employeeLabel(employee)}</option>)}</SelectInput>{employeeQuery.isError && <span className="mt-1 block text-[10px] text-rose-600">Employee list could not be loaded.</span>}{!employeeQuery.isLoading && !employees.length && <span className="mt-1 block text-[10px] text-amber-700">No active employees are available to assign.</span>}</label>
          <label><FieldLabel>Priority</FieldLabel><SelectInput value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></SelectInput></label>
          <label><FieldLabel>Due date</FieldLabel><TextInput type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
          {role === 'ADMIN' && <label><FieldLabel>Status</FieldLabel><SelectInput value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}><option value="PENDING">Pending</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></SelectInput></label>}
        </div>
        <label className="block"><FieldLabel>Manager notes</FieldLabel><TextArea value={managerNotes} onChange={(event) => setManagerNotes(event.target.value)} placeholder="Optional guidance for the employee…" rows={2} /></label>
        {!dailyJob && <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 text-xs font-semibold text-slate-600"><input type="checkbox" checked={isDailyJob} onChange={(event) => setIsDailyJob(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />Mark as a daily job</label>}
      </div>
    </Modal>
  )
}
