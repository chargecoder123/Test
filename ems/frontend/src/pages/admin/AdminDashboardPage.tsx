import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleAlert, Clock3, UserRound, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../services/adminApi'
import { PageHeader } from '../../components/PageHeader'
import { StatsCard } from '../../components/StatsCard'
import { Panel, PanelHeader } from '../../components/Panel'
import { DailyTasksChart, TaskStatusChart, MonthlyTasksChart, PerformanceChart } from '../../components/Charts'
import { TaskTable } from '../../components/TaskTable'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { formatDate } from '../../utils/format'

export function AdminDashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: adminApi.dashboard })
  const recentTasks = useQuery({ queryKey: ['tasks', 'admin', 'recent'], queryFn: () => adminApi.tasks({ page: 1, page_size: 5 }) })

  if (dashboard.isLoading) return <LoadingState label="Preparing your organization overview…" />
  if (dashboard.isError || !dashboard.data) return <ErrorState message="The organization dashboard could not be loaded." />
  const { stats } = dashboard.data
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <div className="space-y-7">
      <PageHeader eyebrow={today} title="Good morning, here’s your overview." description="A live snapshot of the people and work moving your organization forward." action={<Link to="/admin/employees" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">Manage people <ArrowRight className="h-4 w-4" /></Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total employees" value={stats.employees} note={`${stats.active_employees} currently active`} icon={UserRound} tone="blue" />
        <StatsCard label="Managers" value={stats.managers} note={`${stats.active_managers} currently active`} icon={UsersRound} tone="violet" />
        <StatsCard label="In progress" value={stats.in_progress_tasks} note={`${stats.pending_tasks} tasks are waiting`} icon={Clock3} tone="amber" />
        <StatsCard label="Completed tasks" value={stats.completed_tasks} note={stats.overdue_tasks ? `${stats.overdue_tasks} need attention` : 'All clear on overdue work'} icon={CheckCircle2} tone={stats.overdue_tasks ? 'rose' : 'green'} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <TaskStatusChart items={dashboard.data.task_status} />
        <Panel>
          <PanelHeader title="Organization pulse" subtitle="A quick look at what needs attention" action={<CircleAlert className="h-4 w-4 text-slate-300" />} />
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><BriefcaseBusiness className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Tasks in progress</div><div className="mt-1 text-[11px] text-muted">Work currently underway</div></div></div><span className="font-display text-xl font-bold text-ink">{stats.in_progress_tasks}</span></div>
            <div className="flex items-center justify-between px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-brand-600"><Clock3 className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Waiting to start</div><div className="mt-1 text-[11px] text-muted">Pending across every team</div></div></div><span className="font-display text-xl font-bold text-ink">{stats.pending_tasks}</span></div>
            <div className="flex items-center justify-between px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><CircleAlert className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Overdue</div><div className="mt-1 text-[11px] text-muted">Open tasks past their due date</div></div></div><span className={`font-display text-xl font-bold ${stats.overdue_tasks ? 'text-rose-600' : 'text-ink'}`}>{stats.overdue_tasks}</span></div>
          </div>
          <div className="px-5 pb-5 sm:px-6"><Link to="/admin/tasks" className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700">Review task board <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        </Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <MonthlyTasksChart items={dashboard.data.monthly_tasks} />
        <DailyTasksChart items={dashboard.data.daily_tasks} />
        <PerformanceChart items={dashboard.data.employee_performance} />
      </div>
      <Panel>
        <PanelHeader title="Recently assigned work" subtitle="The latest task activity from across your organization" action={<Link to="/admin/tasks" className="text-xs font-bold text-brand-600 hover:text-brand-700">View all</Link>} />
        {recentTasks.isLoading ? <LoadingState label="Loading recent tasks…" /> : recentTasks.isError ? <div className="p-5"><ErrorState message="Recent tasks could not be loaded." /></div> : recentTasks.data?.items.length ? <TaskTable tasks={recentTasks.data.items} /> : <EmptyState title="No tasks have been assigned" description="Create the first task from the task board." />}
      </Panel>
      <div className="text-right text-[10px] text-slate-400">Updated {formatDate(new Date().toISOString(), { hour: 'numeric', minute: '2-digit' })}</div>
    </div>
  )
}
