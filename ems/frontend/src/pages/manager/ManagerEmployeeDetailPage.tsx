import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, Mail, Phone, TriangleAlert, UsersRound } from 'lucide-react'
import { managerApi } from '../../services/managerApi'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelHeader } from '../../components/Panel'
import { StatsCard } from '../../components/StatsCard'
import { Avatar } from '../../components/Avatar'
import { AccountStatus } from '../../components/StatusBadge'
import { TaskTable } from '../../components/TaskTable'
import { ErrorState, LoadingState } from '../../components/Feedback'
import { formatDate } from '../../utils/format'

export function ManagerEmployeeDetailPage() {
  const { id } = useParams()
  const employeeId = Number(id)
  const employeeQuery = useQuery({ queryKey: ['manager', 'employee', employeeId], queryFn: () => managerApi.employee(employeeId), enabled: employeeId > 0 })
  const taskQuery = useQuery({ queryKey: ['manager', 'employee-tasks', employeeId], queryFn: () => managerApi.employeeTasks(employeeId), enabled: employeeQuery.isSuccess })
  if (employeeQuery.isLoading) return <LoadingState label="Loading employee profile…" />
  if (employeeQuery.isError || !employeeQuery.data) return <ErrorState message="This employee is not available in your reporting line." />
  const employee = employeeQuery.data
  return (
    <div>
      <Link to="/manager/employees" className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-brand-600"><ArrowLeft className="h-3.5 w-3.5" />Back to my employees</Link>
      <PageHeader eyebrow="Employee details" title={employee.full_name} description="Profile information and work progress for your team member." action={<AccountStatus active={employee.is_active} />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total tasks" value={employee.total_tasks} icon={BriefcaseBusiness} tone="blue" />
        <StatsCard label="In progress" value={employee.in_progress_tasks} icon={Clock3} tone="violet" />
        <StatsCard label="Completed" value={employee.completed_tasks} icon={CheckCircle2} tone="green" />
        <StatsCard label="Overdue" value={employee.overdue_tasks} icon={TriangleAlert} tone={employee.overdue_tasks ? 'rose' : 'slate'} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[.65fr_1.35fr]">
        <Panel>
          <PanelHeader title="Employee profile" subtitle="Team member information" />
          <div className="flex items-center gap-3.5 border-b border-slate-100 px-5 py-5"><Avatar name={employee.full_name} size="lg" /><div><div className="text-sm font-bold text-ink">{employee.full_name}</div><div className="mt-1 text-xs text-muted">Employee</div></div></div>
          <div className="space-y-4 px-5 py-5"><div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 text-slate-400" /><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Work email</div><div className="mt-1 text-xs font-semibold text-slate-700">{employee.email}</div></div></div><div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-slate-400" /><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Phone</div><div className="mt-1 text-xs font-semibold text-slate-700">{employee.phone || 'Not provided'}</div></div></div><div className="flex gap-3"><UsersRound className="mt-0.5 h-4 w-4 text-slate-400" /><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Reporting line</div><div className="mt-1 text-xs font-semibold text-slate-700">You</div></div></div><div className="text-[11px] text-muted">Joined {formatDate(employee.created_at)}</div></div>
        </Panel>
        <Panel><PanelHeader title="Task history" subtitle={`${employee.total_tasks} tasks assigned to ${employee.first_name}`} />{taskQuery.isLoading ? <LoadingState label="Loading task history…" /> : taskQuery.isError ? <div className="p-5"><ErrorState message="Employee task history could not be loaded." /></div> : <TaskTable tasks={taskQuery.data?.items || []} showAssignee={false} emptyTitle="No task history yet" emptyDescription="Tasks assigned to this employee will appear here." />}</Panel>
      </div>
    </div>
  )
}
