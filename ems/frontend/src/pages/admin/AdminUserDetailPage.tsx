import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Mail, Pencil, Phone, UserRound, UsersRound } from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelHeader } from '../../components/Panel'
import { StatsCard } from '../../components/StatsCard'
import { TaskTable } from '../../components/TaskTable'
import { Avatar } from '../../components/Avatar'
import { AccountStatus } from '../../components/StatusBadge'
import { Button } from '../../components/Button'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { formatDate } from '../../utils/format'
import { UserFormDialog } from './UserFormDialog'

export function AdminUserDetailPage({ role }: { role: 'EMPLOYEE' | 'MANAGER' }) {
  const { id } = useParams()
  const userId = Number(id)
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const profileQuery = useQuery({ queryKey: ['admin', 'user', role, userId], queryFn: () => role === 'EMPLOYEE' ? adminApi.getEmployee(userId) : adminApi.getManager(userId), enabled: Number.isInteger(userId) && userId > 0 })
  const taskQuery = useQuery({ queryKey: ['admin', 'employee-tasks', userId], queryFn: () => adminApi.tasks({ assigned_to: userId, page_size: 100 }), enabled: role === 'EMPLOYEE' && Boolean(profileQuery.data) })
  const employeesQuery = useQuery({ queryKey: ['admin', 'manager-employees', userId], queryFn: () => adminApi.employees({ page: 1, page_size: 100 }), enabled: role === 'MANAGER' && Boolean(profileQuery.data) })
  if (profileQuery.isLoading) return <LoadingState label="Loading profile…" />
  if (profileQuery.isError || !profileQuery.data) return <ErrorState message="This account could not be found." />
  const person = profileQuery.data
  const tasks = taskQuery.data?.items || []
  const reports = (employeesQuery.data?.items || []).filter((employee) => employee.manager_id === person.id)
  const completed = tasks.filter((task) => task.status === 'COMPLETED').length
  const pending = tasks.filter((task) => task.status === 'PENDING').length
  const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length
  const overdue = tasks.filter((task) => task.due_date && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && new Date(task.due_date).getTime() < Date.now()).length
  const basePath = role === 'EMPLOYEE' ? '/admin/employees' : '/admin/managers'

  return (
    <div>
      <Link to={basePath} className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-brand-600"><ArrowLeft className="h-3.5 w-3.5" />Back to {role === 'EMPLOYEE' ? 'employees' : 'managers'}</Link>
      <PageHeader eyebrow={`${role.charAt(0)}${role.slice(1).toLowerCase()} profile`} title={person.full_name} description="Account details, team relationships, and work history." action={<Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>Edit account</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {role === 'EMPLOYEE' ? <>
          <StatsCard label="Total tasks" value={taskQuery.isLoading ? '—' : tasks.length} icon={BriefcaseBusiness} tone="blue" />
          <StatsCard label="Pending" value={taskQuery.isLoading ? '—' : pending} icon={CalendarDays} tone="slate" />
          <StatsCard label="In progress" value={taskQuery.isLoading ? '—' : inProgress} icon={BriefcaseBusiness} tone="violet" />
          <StatsCard label="Completed" value={taskQuery.isLoading ? '—' : completed} note={overdue ? `${overdue} overdue` : 'No overdue tasks'} icon={UserRound} tone={overdue ? 'rose' : 'green'} />
        </> : <>
          <StatsCard label="Direct reports" value={employeesQuery.isLoading ? '—' : reports.length} note="Assigned employees" icon={UsersRound} tone="blue" />
          <StatsCard label="Active employees" value={employeesQuery.isLoading ? '—' : reports.filter((employee) => employee.is_active).length} icon={UserRound} tone="green" />
          <StatsCard label="Task board" value="Live" note="Work from their reporting line" icon={BriefcaseBusiness} tone="violet" />
          <StatsCard label="Account status" value={person.is_active ? 'Active' : 'Inactive'} icon={CalendarDays} tone={person.is_active ? 'green' : 'slate'} />
        </>}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <Panel>
          <PanelHeader title="Profile details" subtitle="Account information" />
          <div className="flex items-center gap-3.5 border-b border-slate-100 px-5 py-5"><Avatar name={person.full_name} size="lg" /><div><div className="text-sm font-bold text-ink">{person.full_name}</div><div className="mt-1 text-xs text-muted">{person.role.toLowerCase()}</div></div><div className="ml-auto"><AccountStatus active={person.is_active} /></div></div>
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-slate-400" /><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Email</div><div className="mt-1 text-xs font-semibold text-slate-700">{person.email}</div></div></div>
            <div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 text-slate-400" /><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Phone</div><div className="mt-1 text-xs font-semibold text-slate-700">{person.phone || 'Not provided'}</div></div></div>
            {role === 'EMPLOYEE' && <div className="flex items-start gap-3"><UsersRound className="mt-0.5 h-4 w-4 text-slate-400" /><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Manager</div><div className="mt-1 text-xs font-semibold text-slate-700">{person.manager?.first_name} {person.manager?.last_name}{!person.manager && 'Unassigned'}</div></div></div>}
            <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" /><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Joined</div><div className="mt-1 text-xs font-semibold text-slate-700">{formatDate(person.created_at)}</div></div></div>
          </div>
        </Panel>
        {role === 'EMPLOYEE' ? <Panel><PanelHeader title="Task history" subtitle="Assigned work and current progress" />{taskQuery.isError ? <div className="p-5"><ErrorState message="Task history could not be loaded." /></div> : taskQuery.isLoading ? <LoadingState /> : <TaskTable tasks={tasks} showAssignee={false} emptyTitle="No task history" emptyDescription="Tasks assigned to this employee will appear here." />}</Panel> : <Panel><PanelHeader title="Direct reports" subtitle="Employees assigned to this manager" />{employeesQuery.isError ? <div className="p-5"><ErrorState message="Manager reports could not be loaded." /></div> : employeesQuery.isLoading ? <LoadingState /> : !reports.length ? <EmptyState title="No direct reports" description="Assign employees to this manager from the Employees page." action={<Link to="/admin/employees" className="text-xs font-bold text-brand-600">View employees</Link>} /> : <div className="divide-y divide-slate-100">{reports.map((employee) => <Link key={employee.id} to={`/admin/employees/${employee.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"><Avatar name={employee.full_name} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-ink">{employee.full_name}</span><span className="mt-1 block truncate text-[11px] text-muted">{employee.email}</span></span><AccountStatus active={employee.is_active} /><ArrowLeft className="h-3.5 w-3.5 rotate-180 text-slate-300" /></Link>)}</div>}</Panel>}
      </div>
      <UserFormDialog open={editOpen} scope={role} user={person} onClose={() => setEditOpen(false)} onSaved={() => { queryClient.invalidateQueries({ queryKey: ['admin', 'people'] }); queryClient.invalidateQueries({ queryKey: ['admin', 'user', role, userId] }) }} />
    </div>
  )
}
