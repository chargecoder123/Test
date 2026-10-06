import { useQuery } from '@tanstack/react-query'
import { BriefcaseBusiness, CalendarDays, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { employeeApi } from '../../services/employeeApi'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelHeader } from '../../components/Panel'
import { Avatar } from '../../components/Avatar'
import { AccountStatus } from '../../components/StatusBadge'
import { ErrorState, LoadingState } from '../../components/Feedback'
import { formatDate } from '../../utils/format'

export function EmployeeProfilePage() {
  const query = useQuery({ queryKey: ['employee', 'profile'], queryFn: employeeApi.profile })
  if (query.isLoading) return <LoadingState label="Loading your profile…" />
  if (query.isError || !query.data) return <ErrorState message="Your profile could not be loaded." />
  const user = query.data
  return (
    <div>
      <PageHeader eyebrow="Account" title="My profile" description="Your personal details and place in the team." />
      <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
        <Panel>
          <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-6 sm:flex-row sm:items-center sm:px-7"><Avatar name={user.full_name} image={user.profile_image} size="lg" /><div className="min-w-0 flex-1"><div className="font-display text-xl font-bold text-ink">{user.full_name}</div><div className="mt-1.5 text-xs text-muted">Employee · joined {formatDate(user.created_at)}</div></div><AccountStatus active={user.is_active} /></div>
          <div className="grid gap-x-8 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7">
            <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-600"><Mail className="h-4 w-4" /></span><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Work email</div><div className="mt-1.5 break-all text-xs font-semibold text-slate-700">{user.email}</div></div></div>
            <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Phone className="h-4 w-4" /></span><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Phone</div><div className="mt-1.5 text-xs font-semibold text-slate-700">{user.phone || 'Not provided'}</div></div></div>
            <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CalendarDays className="h-4 w-4" /></span><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Start date</div><div className="mt-1.5 text-xs font-semibold text-slate-700">{formatDate(user.created_at)}</div></div></div>
            <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><ShieldCheck className="h-4 w-4" /></span><div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Account role</div><div className="mt-1.5 text-xs font-semibold text-slate-700">Employee</div></div></div>
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Your manager" subtitle="Your reporting line" />
          {user.manager ? <div className="flex items-center gap-3.5 px-5 py-6 sm:px-6"><Avatar name={`${user.manager.first_name} ${user.manager.last_name}`} size="lg" /><div className="min-w-0"><div className="text-sm font-bold text-ink">{user.manager.first_name} {user.manager.last_name}</div><div className="mt-1 text-xs text-muted">Manager</div><div className="mt-2 break-all text-[11px] font-medium text-brand-600">{user.manager.email}</div></div></div> : <div className="px-5 py-7 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><UserRound className="h-5 w-5" /></span><div className="mt-3 text-xs font-bold text-ink">No manager assigned yet</div><p className="mx-auto mt-1 max-w-[240px] text-[11px] leading-5 text-muted">Your administrator will update your reporting line when it’s ready.</p></div>}
          <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 sm:mx-6"><BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><p className="text-[10px] leading-5 text-slate-500">Your manager assigns and reviews your work. Contact your administrator to update account details.</p></div>
        </Panel>
      </div>
    </div>
  )
}
