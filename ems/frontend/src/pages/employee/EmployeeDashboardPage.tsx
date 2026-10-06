import { ArrowRight, BriefcaseBusiness, CalendarClock, CheckCircle2, Clock3, UserRound, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { employeeApi } from '../../services/employeeApi'
import { useAuth } from '../../context/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { StatsCard } from '../../components/StatsCard'
import { TaskStatusChart } from '../../components/Charts'
import { Panel, PanelHeader } from '../../components/Panel'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge'
import { formatShortDate, taskIsOverdue } from '../../utils/format'

export function EmployeeDashboardPage() {
  const { user, hasPermission } = useAuth()
  const canViewTasks = hasPermission('my_tasks', 'view')
  const dashboard = useQuery({ queryKey: ['dashboard', 'employee'], queryFn: employeeApi.dashboard })
  if (dashboard.isLoading) return <LoadingState label="Loading your workday…" />
  if (dashboard.isError || !dashboard.data) return <ErrorState message="Your employee dashboard could not be loaded." />
  const stats = dashboard.data.stats
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  return (
    <div className="space-y-7">
      <PageHeader eyebrow={dateLabel} title={`Welcome back, ${user?.first_name || 'there'}.`} description="Here’s what’s on your plate today. One step at a time." action={<Link to="/employee/tasks" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">View my tasks <ArrowRight className="h-4 w-4" /></Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="My open tasks" value={stats.my_tasks ?? 0} note="Your assigned workload" icon={BriefcaseBusiness} tone="blue" />
        <StatsCard label="Today’s jobs" value={stats.today_jobs ?? 0} note="Due or scheduled today" icon={CalendarClock} tone="violet" />
        <StatsCard label="In progress" value={stats.in_progress_tasks ?? 0} note={`${stats.pending_tasks ?? 0} ready when you are`} icon={Clock3} tone="amber" />
        <StatsCard label="Completed" value={stats.completed_tasks ?? 0} note={stats.overdue_tasks ? `${stats.overdue_tasks} past due` : 'You’re right on track'} icon={CheckCircle2} tone={stats.overdue_tasks ? 'rose' : 'green'} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <TaskStatusChart items={dashboard.data.task_status} />
        {canViewTasks && <Panel>
          <PanelHeader title="Your next steps" subtitle="Tasks that need your attention" action={<Link to="/employee/tasks" className="text-xs font-bold text-brand-600">See all</Link>} />
          {!dashboard.data.recent_tasks.length ? <EmptyState title="Nothing on your list yet" description="When your manager assigns work, you’ll find it here." /> : <div className="divide-y divide-slate-100">
            {dashboard.data.recent_tasks.map((task) => <div key={task.id} className="flex items-start gap-3.5 px-5 py-4 sm:px-6"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Zap className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-xs font-bold text-ink">{task.title}</h3>{task.is_daily_job && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-600">Daily</span>}</div><p className="mt-1 line-clamp-1 text-[11px] text-muted">{task.description || 'No description provided.'}</p><div className="mt-3 flex flex-wrap items-center gap-2"><PriorityBadge priority={task.priority} /><StatusBadge status={task.status} /><span className={`text-[10px] font-semibold ${taskIsOverdue(task.status, task.due_date) ? 'text-rose-600' : 'text-muted'}`}>Due {formatShortDate(task.due_date)}</span></div></div><Link to="/employee/tasks" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label={`Open ${task.title}`}><ArrowRight className="h-4 w-4" /></Link></div>)}
          </div>}
        </Panel>}
      </div>
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:flex sm:items-center sm:justify-between sm:px-7"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm"><UserRound className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Need your profile or manager details?</div><p className="mt-1 text-[11px] text-slate-500">Keep your account information up to date.</p></div></div><Link to="/employee/profile" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-brand-600 sm:mt-0">Open my profile <ArrowRight className="h-3.5 w-3.5" /></Link></div>
    </div>
  )
}
