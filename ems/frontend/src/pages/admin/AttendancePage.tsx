import { useMemo, useState } from 'react'
import { Activity, CalendarDays, CheckCheck, Clock3, Search, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../services/adminApi'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Avatar } from '../../components/Avatar'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { TextInput } from '../../components/FormField'
import { formatDateTime } from '../../utils/format'

const eventPresentation: Record<string, { label: string; icon: typeof Activity; tone: string }> = {
  TASK_ASSIGNED: { label: 'Task assigned', icon: Sparkles, tone: 'bg-blue-50 text-brand-600' },
  TASK_STARTED: { label: 'Task started', icon: Clock3, tone: 'bg-violet-50 text-violet-600' },
  TASK_COMPLETED: { label: 'Task completed', icon: CheckCheck, tone: 'bg-emerald-50 text-emerald-600' },
  TASK_NOTE_ADDED: { label: 'Work note added', icon: Activity, tone: 'bg-amber-50 text-amber-600' },
  TASK_REVIEWED: { label: 'Task reviewed', icon: CheckCheck, tone: 'bg-indigo-50 text-indigo-600' },
}

export function AttendancePage() {
  const [search, setSearch] = useState('')
  const query = useQuery({ queryKey: ['admin', 'attendance'], queryFn: () => adminApi.attendance({ page: 1, page_size: 100 }) })
  const entries = useMemo(() => (query.data || []).filter((entry) => `${entry.user.first_name} ${entry.user.last_name} ${entry.user.email} ${entry.event_type} ${entry.note || ''}`.toLowerCase().includes(search.toLowerCase())), [query.data, search])
  return (
    <div>
      <PageHeader eyebrow="Organization activity" title="Attendance & activity" description="A chronological audit trail of task assignments, progress updates, and employee work notes." action={<span className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200"><CalendarDays className="h-4 w-4 text-brand-600" />{query.data?.length ?? '—'} events</span>} />
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="font-display text-sm font-bold text-ink">Activity timeline</h2><p className="mt-1 text-[11px] text-muted">Most recent events first</p></div><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><TextInput className="min-w-[220px] pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people or activity" aria-label="Search activity" /></label></div>
        {query.isLoading ? <LoadingState label="Loading recent activity…" /> : query.isError ? <div className="p-5"><ErrorState message="Activity could not be loaded." /></div> : !entries.length ? <EmptyState title={search ? 'No matching activity' : 'No activity recorded yet'} description={search ? 'Try a different search.' : 'Employee work and task updates will appear here as they happen.'} /> : <div className="divide-y divide-slate-100">{entries.map((event) => {
          const presentation = eventPresentation[event.event_type] || { label: event.event_type.replaceAll('_', ' ').toLowerCase(), icon: Activity, tone: 'bg-slate-100 text-slate-600' }
          const Icon = presentation.icon
          return <div key={event.id} className="flex items-start gap-3.5 px-5 py-4 sm:px-6"><Avatar name={`${event.user.first_name} ${event.user.last_name}`} size="sm" /><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${presentation.tone}`}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-ink">{event.user.first_name} {event.user.last_name}</span><span className="text-[11px] text-muted">{presentation.label}</span></div><div className="mt-1 truncate text-[11px] text-slate-500">{event.note || 'No additional details.'}</div></div><time className="shrink-0 pt-1 text-[10px] font-medium text-slate-400">{formatDateTime(event.created_at)}</time></div>
        })}</div>}
      </Panel>
    </div>
  )
}
