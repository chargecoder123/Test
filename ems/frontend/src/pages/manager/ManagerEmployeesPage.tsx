import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Search, UsersRound } from 'lucide-react'
import { managerApi } from '../../services/managerApi'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Avatar } from '../../components/Avatar'
import { AccountStatus } from '../../components/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { TextInput } from '../../components/FormField'

export function ManagerEmployeesPage() {
  const [search, setSearch] = useState('')
  const query = useQuery({ queryKey: ['manager', 'employees', search], queryFn: () => managerApi.employees({ page: 1, page_size: 100, search: search || undefined }) })
  return (
    <div>
      <PageHeader eyebrow="Your team" title="My employees" description="A focused view of the people in your reporting line and how their work is progressing." action={<span className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200"><UsersRound className="h-4 w-4 text-brand-600" />{query.data?.total ?? '—'} team members</span>} />
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="font-display text-sm font-bold text-ink">Reporting line</h2><p className="mt-1 text-[11px] text-muted">Employees assigned to you by your administrator.</p></div><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><TextInput className="min-w-[230px] pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an employee" aria-label="Search employees" /></label></div>
        {query.isLoading ? <LoadingState label="Loading your team…" /> : query.isError ? <div className="p-5"><ErrorState message="Your employee list could not be loaded." /></div> : !query.data?.items.length ? <EmptyState title={search ? 'No matching employees' : 'Your team is taking shape'} description={search ? 'Try a different name or email.' : 'Employees assigned to your reporting line will appear here.'} /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400"><th className="px-5 py-3.5">Employee</th><th className="px-4 py-3.5">Tasks</th><th className="px-4 py-3.5">Completed</th><th className="px-4 py-3.5">Pending</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5 text-right">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{query.data.items.map((employee) => <tr key={employee.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={employee.full_name} /><div><div className="text-xs font-bold text-ink">{employee.full_name}</div><div className="mt-1 text-[11px] text-muted">{employee.email}</div></div></div></td><td className="px-4 py-4 text-xs font-semibold text-slate-600">{employee.total_tasks}</td><td className="px-4 py-4"><span className="text-xs font-bold text-emerald-700">{employee.completed_tasks}</span></td><td className="px-4 py-4"><span className="text-xs font-semibold text-slate-600">{employee.pending_tasks}</span>{employee.overdue_tasks > 0 && <span className="ml-2 rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold text-rose-600">{employee.overdue_tasks} late</span>}</td><td className="px-4 py-4"><AccountStatus active={employee.is_active} /></td><td className="px-4 py-4 text-right"><Link to={`/manager/employees/${employee.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-brand-600 transition hover:bg-blue-50">View <ArrowRight className="h-3.5 w-3.5" /></Link></td></tr>)}</tbody></table></div>}
      </Panel>
    </div>
  )
}
