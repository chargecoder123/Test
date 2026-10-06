import { Download, FileBarChart2, UsersRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '../../services/adminApi'
import { PageHeader } from '../../components/PageHeader'
import { StatsCard } from '../../components/StatsCard'
import { DailyTasksChart, TaskStatusChart, MonthlyTasksChart, PerformanceChart } from '../../components/Charts'
import { Button } from '../../components/Button'
import { ErrorState, LoadingState } from '../../components/Feedback'

export function ReportsPage() {
  const query = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: adminApi.dashboard })
  const reportQuery = useQuery({ queryKey: ['admin', 'report', 'tasks'], queryFn: () => adminApi.tasks({ page: 1, page_size: 100 }) })
  function exportReport() {
    if (!query.data) return
    const rows = [
      ['Employee', 'Completed tasks'],
      ...query.data.employee_performance.map((row) => [row.name, String(row.completed)]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'northstar-employee-performance.csv'
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Performance report downloaded.')
  }
  if (query.isLoading) return <LoadingState label="Building your reports…" />
  if (query.isError || !query.data) return <ErrorState message="Reports could not be generated from the current data." />
  const stats = query.data.stats
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Insights" title="Reports & analytics" description="A live view of workload, completion, and team activity across the organization." action={<Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={exportReport}>Export performance CSV</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatsCard label="Employees" value={stats.employees} icon={UsersRound} tone="blue" /><StatsCard label="Tasks completed" value={stats.completed_tasks} icon={FileBarChart2} tone="green" /><StatsCard label="Open work" value={stats.pending_tasks + stats.in_progress_tasks} note={`${stats.pending_tasks} pending · ${stats.in_progress_tasks} in progress`} icon={FileBarChart2} tone="violet" /><StatsCard label="Overdue" value={stats.overdue_tasks} note="Open tasks past due date" icon={FileBarChart2} tone={stats.overdue_tasks ? 'rose' : 'slate'} /></div>
      <div className="grid gap-5 xl:grid-cols-2"><TaskStatusChart items={query.data.task_status} /><DailyTasksChart items={query.data.daily_tasks} /><MonthlyTasksChart items={query.data.monthly_tasks} /><PerformanceChart items={query.data.employee_performance} /></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-[11px] leading-5 text-muted shadow-soft">{reportQuery.isLoading ? 'Refreshing task source data…' : reportQuery.isError ? 'The detailed task list is currently unavailable; summary charts are still live.' : `Report source: ${reportQuery.data?.total ?? 0} task records. Values update as work is created and completed.`}</div>
    </div>
  )
}
