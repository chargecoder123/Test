import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Eye, KeyRound, MoreHorizontal, Pencil, Plus, Search, UserRoundPlus, UsersRound, UserX } from 'lucide-react'
import clsx from 'clsx'
import { adminApi, type UserQuery } from '../../services/adminApi'
import type { User } from '../../types'
import { getApiError } from '../../services/api'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/Button'
import { Panel } from '../../components/Panel'
import { Avatar } from '../../components/Avatar'
import { AccountStatus } from '../../components/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { TextInput, SelectInput } from '../../components/FormField'
import { ConfirmDialog } from '../../components/Modal'
import { PeopleScope, UserFormDialog } from './UserFormDialog'
import { formatDate } from '../../utils/format'

interface PeoplePageProps {
  scope: PeopleScope
}

const pageTitles: Record<PeopleScope, { title: string; description: string; eyebrow: string }> = {
  EMPLOYEE: { title: 'Employees', description: 'Manage your people, reporting lines, and account access.', eyebrow: 'People directory' },
  MANAGER: { title: 'Managers', description: 'Keep your leadership team and manager accounts up to date.', eyebrow: 'People directory' },
  ALL: { title: 'All users', description: 'A single view of every account in your organization.', eyebrow: 'Organization' },
}

export function PeoplePage({ scope }: PeoplePageProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)
  const isActive = statusFilter === 'all' ? undefined : statusFilter === 'active'
  const params = useMemo<UserQuery>(() => ({
    search: search || undefined,
    role: scope === 'ALL' ? undefined : scope,
    is_active: isActive,
    page,
    page_size: 10,
  }), [search, scope, isActive, page])
  const query = useQuery({
    queryKey: ['admin', 'people', params],
    queryFn: () => scope === 'EMPLOYEE' ? adminApi.employees(params) : scope === 'MANAGER' ? adminApi.managers(params) : adminApi.users(params),
  })
  const pageInfo = query.data
  const title = pageTitles[scope]
  const countLabel = scope === 'ALL' ? 'accounts' : scope === 'MANAGER' ? 'managers' : 'employees'

  function openCreate() {
    setEditingUser(null)
    setFormOpen(true)
  }
  function openEdit(user: User) {
    setEditingUser(user)
    setFormOpen(true)
  }
  async function toggleStatus() {
    if (!deactivatingUser) return
    setStatusBusy(true)
    try {
      await adminApi.setStatus(deactivatingUser.id, !deactivatingUser.is_active)
      toast.success(deactivatingUser.is_active ? 'Account deactivated.' : 'Account reactivated.')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'people'] })
      setDeactivatingUser(null)
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setStatusBusy(false)
    }
  }

  return (
    <div>
      <PageHeader eyebrow={title.eyebrow} title={title.title} description={title.description} action={<Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>{scope === 'MANAGER' ? 'Add manager' : scope === 'EMPLOYEE' ? 'Add employee' : 'Add a person'}</Button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Showing</span><UsersRound className="h-4 w-4 text-brand-500" /></div><div className="mt-2 font-display text-2xl font-bold text-ink">{query.data?.total ?? '—'}</div><div className="mt-1 text-[11px] text-muted">{countLabel} in this view</div></div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Access</span><KeyRound className="h-4 w-4 text-violet-500" /></div><div className="mt-2 font-display text-2xl font-bold text-ink">Role based</div><div className="mt-1 text-[11px] text-muted">Page permissions can be customized</div></div>
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-50 to-indigo-50 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600">Team tip</div><div className="mt-2 text-sm font-bold text-ink">Start with clear access.</div><div className="mt-1 text-[11px] text-slate-500">Every new account can be tailored to its role.</div></div>
      </div>
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 className="font-display text-sm font-bold text-ink">Directory</h2><p className="mt-1 text-[11px] text-muted">{pageInfo ? `${pageInfo.total} ${countLabel} · page ${pageInfo.page} of ${Math.max(1, Math.ceil(pageInfo.total / pageInfo.page_size))}` : 'Search, filter, and manage accounts'}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><TextInput className="min-w-[220px] pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search name or email" aria-label="Search users" /></label>
            <SelectInput className="sm:w-36" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1) }} aria-label="Filter by account status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></SelectInput>
          </div>
        </div>
        {query.isLoading ? <LoadingState label="Loading people…" /> : query.isError ? <div className="p-5"><ErrorState message="The directory could not be loaded." /></div> : !pageInfo?.items.length ? <EmptyState title={search ? 'No people found' : 'Your directory is ready'} description={search ? 'Try another name or email address.' : 'Create your first account to start building the team.'} action={!search ? <Button icon={<UserRoundPlus className="h-4 w-4" />} onClick={openCreate}>Create account</Button> : undefined} /> : <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400"><th className="px-5 py-3.5">Name</th><th className="px-4 py-3.5">Role</th><th className="px-4 py-3.5">Manager</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5">Joined</th><th className="px-4 py-3.5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {pageInfo.items.map((person) => {
                const detailPath = person.role === 'EMPLOYEE' ? `/admin/employees/${person.id}` : person.role === 'MANAGER' ? `/admin/managers/${person.id}` : null
                return <tr key={person.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={person.full_name} size="md" /><div><div className="text-xs font-bold text-ink">{person.full_name}</div><div className="mt-1 text-[11px] text-muted">{person.email}</div></div></div></td>
                  <td className="px-4 py-4"><span className={clsx('rounded-full px-2.5 py-1 text-[10px] font-bold', person.role === 'ADMIN' ? 'bg-violet-50 text-violet-700' : person.role === 'MANAGER' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')}>{person.role.charAt(0) + person.role.slice(1).toLowerCase()}</span></td>
                  <td className="px-4 py-4 text-xs text-slate-600">{person.manager ? `${person.manager.first_name} ${person.manager.last_name}` : person.role === 'EMPLOYEE' ? <span className="text-slate-400">Unassigned</span> : '—'}</td>
                  <td className="px-4 py-4"><AccountStatus active={person.is_active} /></td>
                  <td className="px-4 py-4 text-xs text-slate-500">{formatDate(person.created_at)}</td>
                  <td className="px-4 py-4"><div className="flex items-center justify-end gap-1">
                    {detailPath && <Link to={detailPath} title="View details" className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-brand-600"><Eye className="h-4 w-4" /></Link>}
                    <button onClick={() => openEdit(person)} title="Edit account" className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                    {person.role !== 'ADMIN' && <Link to={`/admin/permissions?user_id=${person.id}`} title="Manage permissions" className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-700"><KeyRound className="h-4 w-4" /></Link>}
                    {person.role !== 'ADMIN' && <button onClick={() => setDeactivatingUser(person)} title={person.is_active ? 'Deactivate account' : 'Reactivate account'} className={clsx('rounded-lg p-2', person.is_active ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600' : 'text-emerald-600 hover:bg-emerald-50')}><UserX className="h-4 w-4" /></button>}
                    {person.role === 'ADMIN' && <MoreHorizontal className="mx-2 h-4 w-4 text-slate-300" />}
                  </div></td>
                </tr>
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5"><span className="text-[11px] text-muted">Showing {pageInfo.items.length} of {pageInfo.total}</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} icon={<ArrowLeft className="h-3.5 w-3.5" />}>Previous</Button><Button size="sm" variant="outline" disabled={page >= Math.ceil(pageInfo.total / pageInfo.page_size)} onClick={() => setPage((value) => value + 1)}>Next <ArrowRight className="h-3.5 w-3.5" /></Button></div></div>
        </div>}
      </Panel>
      <UserFormDialog open={formOpen} scope={scope} user={editingUser} onClose={() => setFormOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin', 'people'] })} />
      <ConfirmDialog open={Boolean(deactivatingUser)} title={deactivatingUser?.is_active ? 'Deactivate this account?' : 'Reactivate this account?'} description={deactivatingUser?.is_active ? `${deactivatingUser?.full_name} will no longer be able to sign in. Their history will remain available to administrators.` : `${deactivatingUser?.full_name} will be able to sign in again.`} onCancel={() => setDeactivatingUser(null)} onConfirm={toggleStatus} busy={statusBusy} confirmLabel={deactivatingUser?.is_active ? 'Deactivate account' : 'Reactivate account'} />
    </div>
  )
}
