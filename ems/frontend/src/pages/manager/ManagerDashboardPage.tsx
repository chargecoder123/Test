import { ArrowRight, BriefcaseBusiness, Clock3, UsersRound, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../../services/managerApi'
import { useAuth } from '../../context/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { StatsCard } from '../../components/StatsCard'
import { TaskStatusChart } from '../../components/Charts'
import { Panel, PanelHeader } from '../../components/Panel'
import { TaskTable } from '../../components/TaskTable'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { formatDate } from '../../utils/format'

export function ManagerDashboardPage() {
  const { user, hasPermission } = useAuth()
  const canViewTasks = hasPermission('tasks', 'view')
  const dashboard = useQuery({ queryKey: ['dashboard', 'manager'], queryFn: managerApi.dashboard })
  if (dashboard.isLoading) return <LoadingState label="Loading your team overview…" />
  if (dashboard.isError || !dashboard.data) return <ErrorState message="Your team dashboard could not be loaded." />
  const stats = dashboard.data.stats
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  return (
    <div className="space-y-7">
      <PageHeader eyebrow={dateLabel} title={`Your team, in focus${user?.first_name ? `, ${user.first_name}.` : '.'}`} description="Keep a pulse on your people and the work they’re moving forward." action={<Link to="/manager/tasks" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">Open task board <ArrowRight className="h-4 w-4" /></Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="My employees" value={stats.employees ?? 0} note="People in your reporting line" icon={UsersRound} tone="blue" />
        <StatsCard label="Today’s tasks" value={stats.today_tasks ?? 0} note="Jobs due or scheduled today" icon={BriefcaseBusiness} tone="violet" />
        <StatsCard label="In progress" value={stats.in_progress_tasks ?? 0} note={`${stats.pending_tasks ?? 0} waiting to start`} icon={Clock3} tone="amber" />
        <StatsCard label="Overdue work" value={stats.overdue_tasks ?? 0} note={stats.completed_tasks ? `${stats.completed_tasks} completed by your team` : 'Keep the team moving'} icon={TriangleAlert} tone={stats.overdue_tasks ? 'rose' : 'green'} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <TaskStatusChart items={dashboard.data.task_status} />
        <Panel>
          <PanelHeader title="Your team’s workload" subtitle="Stay close to the work that matters" action={<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-brand-600"><UsersRound className="h-4 w-4" /></span>} />
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Pending</div><div className="mt-2 font-display text-3xl font-bold text-ink">{stats.pending_tasks ?? 0}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-slate-400" style={{ width: `${Math.min((stats.pending_tasks || 0) * 10, 100)}%` }} /></div></div>
            <div className="rounded-2xl bg-violet-50/70 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-violet-500">In progress</div><div className="mt-2 font-display text-3xl font-bold text-ink">{stats.in_progress_tasks ?? 0}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min((stats.in_progress_tasks || 0) * 10, 100)}%` }} /></div></div>
            <div className="rounded-2xl bg-emerald-50/70 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-600">Completed</div><div className="mt-2 font-display text-3xl font-bold text-ink">{stats.completed_tasks ?? 0}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min((stats.completed_tasks || 0) * 10, 100)}%` }} /></div></div>
            <div className="rounded-2xl bg-amber-50/70 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-amber-600">Scheduled today</div><div className="mt-2 font-display text-3xl font-bold text-ink">{stats.today_tasks ?? 0}</div><div className="mt-3 text-[10px] font-medium text-amber-700/75">A good day starts with a clear plan.</div></div>
          </div>
          <div className="px-5 pb-5 sm:px-6"><Link to="/manager/daily-jobs" className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700">Manage daily jobs <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        </Panel>
      </div>
      {canViewTasks && <Panel>
        <PanelHeader title="Recently assigned tasks" subtitle="The latest work in your team" action={<Link to="/manager/tasks" className="text-xs font-bold text-brand-600">View task board</Link>} />
        {dashboard.data.recent_tasks.length ? <TaskTable tasks={dashboard.data.recent_tasks} /> : <EmptyState title="Your task board is clear" description="Assign a task or daily job to get work moving." />}
      </Panel>}
      <div className="flex items-center justify-between text-[10px] text-slate-400"><span>Team overview</span><span>Updated {formatDate(new Date().toISOString(), { hour: 'numeric', minute: '2-digit' })}</span></div>
    </div>
  )
}
