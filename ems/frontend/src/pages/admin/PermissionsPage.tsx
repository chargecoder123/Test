import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, ChevronDown, KeyRound, Pencil, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react'
import type { PermissionCatalogItem, PermissionGrantInput } from '../../types'
import { adminApi } from '../../services/adminApi'
import { permissionApi } from '../../services/permissionApi'
import { getApiError } from '../../services/api'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelHeader } from '../../components/Panel'
import { Button } from '../../components/Button'
import { Avatar } from '../../components/Avatar'
import { AccountStatus } from '../../components/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback'
import { FieldLabel, SelectInput, TextInput, TextArea } from '../../components/FormField'
import { ConfirmDialog, Modal } from '../../components/Modal'

const actions: { field: keyof Omit<PermissionGrantInput, 'permission_id'>; label: string }[] = [
  { field: 'can_view', label: 'View' },
  { field: 'can_create', label: 'Create' },
  { field: 'can_update', label: 'Update' },
  { field: 'can_delete', label: 'Delete' },
]

export function PermissionsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedId = Number(searchParams.get('user_id')) || undefined
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(requestedId)
  const [draftRole, setDraftRole] = useState<'MANAGER' | 'EMPLOYEE'>('EMPLOYEE')
  const [draft, setDraft] = useState<Record<number, PermissionGrantInput>>({})
  const [saving, setSaving] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<PermissionCatalogItem | null>(null)
  const [deletingPermission, setDeletingPermission] = useState<PermissionCatalogItem | null>(null)
  const usersQuery = useQuery({ queryKey: ['admin', 'permission-users'], queryFn: () => adminApi.users({ page: 1, page_size: 100 }) })
  const catalogQuery = useQuery({ queryKey: ['permissions', 'catalog'], queryFn: permissionApi.catalog })
  const permissionCatalog = catalogQuery.data || []
  const user = usersQuery.data?.items.find((item) => item.id === selectedUserId)
  const grantsQuery = useQuery({ queryKey: ['permissions', 'user', selectedUserId], queryFn: () => permissionApi.forUser(selectedUserId!), enabled: Boolean(selectedUserId) })
  const manageableUsers = useMemo(() => (usersQuery.data?.items || []).filter((item) => item.role !== 'ADMIN'), [usersQuery.data])

  useEffect(() => {
    if (!selectedUserId && manageableUsers.length) setSelectedUserId(manageableUsers[0].id)
    if (selectedUserId && manageableUsers.length && !manageableUsers.some((item) => item.id === selectedUserId)) setSelectedUserId(manageableUsers[0].id)
  }, [manageableUsers, selectedUserId])

  useEffect(() => {
    if (requestedId && manageableUsers.some((item) => item.id === requestedId)) setSelectedUserId(requestedId)
  }, [requestedId, manageableUsers])

  useEffect(() => {
    if (user) setDraftRole(user.role === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE')
  }, [user?.id, user?.role])

  useEffect(() => {
    if (!catalogQuery.data || !grantsQuery.data) return
    const grants = new Map(grantsQuery.data.map((grant) => [grant.permission_id, grant]))
    setDraft(Object.fromEntries(catalogQuery.data.map((permission) => {
      const grant = grants.get(permission.id)
      return [permission.id, {
        permission_id: permission.id,
        can_view: grant?.can_view ?? false,
        can_create: grant?.can_create ?? false,
        can_update: grant?.can_update ?? false,
        can_delete: grant?.can_delete ?? false,
      }]
    })))
  }, [catalogQuery.data, grantsQuery.data, selectedUserId])

  function selectUser(id: number) {
    setSelectedUserId(id)
    setSearchParams({ user_id: String(id) })
  }

  function toggle(permissionId: number, field: keyof Omit<PermissionGrantInput, 'permission_id'>) {
    setDraft((current) => {
      const previous = current[permissionId] || { permission_id: permissionId, can_view: false, can_create: false, can_update: false, can_delete: false }
      const enabled = !previous[field]
      if (field === 'can_view' && !enabled) {
        return { ...current, [permissionId]: { permission_id: permissionId, can_view: false, can_create: false, can_update: false, can_delete: false } }
      }
      return { ...current, [permissionId]: { ...previous, [field]: enabled, can_view: field === 'can_view' ? true : enabled || previous.can_view } }
    })
  }

  async function save() {
    if (!user || !catalogQuery.data) return
    const rows: PermissionGrantInput[] = permissionCatalog.map((permission) => draft[permission.id] || {
      permission_id: permission.id, can_view: false, can_create: false, can_update: false, can_delete: false,
    })
    setSaving(true)
    try {
      if (draftRole !== user.role) await adminApi.updateUser(user.id, { role: draftRole })
      await permissionApi.saveForUser(user.id, rows)
      toast.success(`Page access updated for ${user.full_name}.`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'permission-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'people'] }),
        queryClient.invalidateQueries({ queryKey: ['permissions', 'user', user.id] }),
      ])
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setSaving(false)
    }
  }

  async function saveCatalogPermission(values: { name: string; key: string; description: string }) {
    setSaving(true)
    try {
      if (editingPermission) {
        await permissionApi.update(editingPermission.id, {
          name: values.name,
          description: values.description || null,
          ...(!editingPermission.is_system ? { key: values.key } : {}),
        })
        toast.success('Permission updated.')
      } else {
        await permissionApi.create(values)
        toast.success('Permission created.')
      }
      setCatalogOpen(false)
      setEditingPermission(null)
      await queryClient.invalidateQueries({ queryKey: ['permissions', 'catalog'] })
      if (selectedUserId) await queryClient.invalidateQueries({ queryKey: ['permissions', 'user', selectedUserId] })
    } catch (error) {
      toast.error(getApiError(error))
      throw error
    } finally {
      setSaving(false)
    }
  }

  async function removeCatalogPermission() {
    if (!deletingPermission) return
    setSaving(true)
    try {
      await permissionApi.remove(deletingPermission.id)
      toast.success('Custom permission deleted.')
      setDeletingPermission(null)
      await queryClient.invalidateQueries({ queryKey: ['permissions', 'catalog'] })
      if (selectedUserId) await queryClient.invalidateQueries({ queryKey: ['permissions', 'user', selectedUserId] })
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = Object.values(draft).filter((grant) => grant?.can_view).length
  return (
    <div>
      <PageHeader eyebrow="Security & access" title="Permission management" description="Control exactly which pages and actions each manager or employee can use. Every change is enforced by the API." action={<div className="flex flex-wrap gap-2"><Button variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditingPermission(null); setCatalogOpen(true) }}>New permission</Button><Button busy={saving} onClick={save} disabled={!user || !catalogQuery.data || !Object.keys(draft).length} icon={<Save className="h-4 w-4" />}>Save changes</Button></div>} />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel className="p-4 sm:p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><KeyRound className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Access is user-specific</div><p className="mt-1 text-[11px] leading-5 text-muted">The selected role is not a blanket permission. Each page and action below is individually stored and checked.</p></div></div></Panel>
        <Panel className="p-4 sm:p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Protected on both sides</div><p className="mt-1 text-[11px] leading-5 text-muted">Pages and buttons disappear in the app; protected endpoints also return 403 without the matching grant.</p></div></div></Panel>
      </div>
      <Panel>
        <PanelHeader title="Choose a user" subtitle="Permissions are managed per account, not by role defaults" />
        {usersQuery.isLoading ? <LoadingState label="Loading user accounts…" /> : usersQuery.isError ? <div className="p-5"><ErrorState message="Users could not be loaded." /></div> : !manageableUsers.length ? <EmptyState title="No manager or employee accounts yet" description="Create a user account first, then return here to assign page access." /> : <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
          <aside className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r sm:p-5"><div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Team accounts · {manageableUsers.length}</div><div className="max-h-[520px] space-y-1 overflow-y-auto">{manageableUsers.map((item) => <button key={item.id} onClick={() => selectUser(item.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${item.id === selectedUserId ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-slate-50'}`}><Avatar name={item.full_name} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-ink">{item.full_name}</span><span className="mt-1 block truncate text-[10px] text-muted">{item.role.charAt(0) + item.role.slice(1).toLowerCase()} · {item.email}</span></span>{item.id === selectedUserId && <Check className="h-4 w-4 text-brand-600" />}</button>)}</div></aside>
          <div className="min-w-0 p-4 sm:p-5 lg:p-6">
            {!user || grantsQuery.isLoading || catalogQuery.isLoading ? <LoadingState label="Loading permissions…" /> : grantsQuery.isError || catalogQuery.isError ? <ErrorState message="Permission settings could not be loaded." /> : <>
              <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:p-5"><Avatar name={user.full_name} size="md" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-ink">{user.full_name}</h3><AccountStatus active={user.is_active} /></div><p className="mt-1 truncate text-[11px] text-muted">{user.email}</p></div><label className="sm:w-40"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Role</span><SelectInput value={draftRole} onChange={(event) => setDraftRole(event.target.value as 'MANAGER' | 'EMPLOYEE')}><option value="MANAGER">Manager</option><option value="EMPLOYEE">Employee</option></SelectInput></label></div>
              <div className="mb-3 flex items-center justify-between"><div><h3 className="text-xs font-bold text-ink">Page permissions</h3><p className="mt-1 text-[10px] text-muted">{selectedCount} of {permissionCatalog.length} pages enabled</p></div><button onClick={() => setDraft(Object.fromEntries(permissionCatalog.map((item) => [item.id, { permission_id: item.id, can_view: false, can_create: false, can_update: false, can_delete: false }])))} className="text-[10px] font-bold text-slate-500 hover:text-brand-600">Clear all</button></div>
              <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[690px] text-left"><thead><tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400"><th className="px-4 py-3">Page / permission</th>{actions.map((action) => <th key={action.field} className="px-3 py-3 text-center">{action.label}</th>)}<th className="px-3 py-3 text-right">Manage</th></tr></thead><tbody className="divide-y divide-slate-100">{permissionCatalog.map((permission) => <tr key={permission.id} className="hover:bg-slate-50/70"><td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-xs font-bold text-ink">{permission.name}</span>{permission.is_system && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">Core</span>}</div><div className="mt-0.5 text-[10px] text-muted">{permission.description || permission.key}</div></td>{actions.map((action) => <td key={action.field} className="px-3 py-3 text-center"><input type="checkbox" checked={Boolean(draft[permission.id]?.[action.field])} onChange={() => toggle(permission.id, action.field)} aria-label={`${action.label} ${permission.name}`} className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></td>)}<td className="px-3 py-3 text-right"><button onClick={() => { setEditingPermission(permission); setCatalogOpen(true) }} title="Edit permission" className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-brand-600"><Pencil className="h-3.5 w-3.5" /></button>{!permission.is_system && <button onClick={() => setDeletingPermission(permission)} title="Delete custom permission" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>}</td></tr>)}</tbody></table></div>
              <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center"><div className="flex gap-2"><ChevronDown className="mt-0.5 h-4 w-4 shrink-0 rotate-[-90deg] text-brand-600" /><p className="text-[10px] leading-5 text-slate-600">Core keys are reserved for built-in pages. Custom permissions can be created for future modules and removed when no longer needed.</p></div><Button busy={saving} onClick={save} disabled={!user || !Object.keys(draft).length} size="sm" icon={<Save className="h-3.5 w-3.5" />}>Save permissions</Button></div>
            </>}
          </div>
        </div>}
      </Panel>
      <PermissionCatalogDialog open={catalogOpen} permission={editingPermission} busy={saving} onClose={() => { setCatalogOpen(false); setEditingPermission(null) }} onSave={saveCatalogPermission} />
      <ConfirmDialog open={Boolean(deletingPermission)} title="Delete this custom permission?" description={deletingPermission ? `“${deletingPermission.name}” will be removed from the catalog and any user assignments to it will be cleared.` : ''} onCancel={() => setDeletingPermission(null)} onConfirm={removeCatalogPermission} busy={saving} confirmLabel="Delete permission" />
    </div>
  )
}

function PermissionCatalogDialog({ open, permission, busy, onClose, onSave }: {
  open: boolean
  permission: PermissionCatalogItem | null
  busy: boolean
  onClose: () => void
  onSave: (values: { name: string; key: string; description: string }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  useEffect(() => {
    if (!open) return
    setName(permission?.name || '')
    setKey(permission?.key || '')
    setDescription(permission?.description || '')
  }, [open, permission])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await onSave({ name: name.trim(), key: key.trim(), description: description.trim() })
    } catch {
      // The API error is already shown by the page.
    }
  }
  return <Modal open={open} onClose={onClose} title={permission ? 'Edit permission' : 'Create a permission'} description={permission?.is_system ? 'Core permission keys are reserved; their display names can still be updated.' : 'Add a named access capability for the workspace.'} onSubmit={submit} submitLabel={permission ? 'Save permission' : 'Create permission'} submitting={busy}>
    <div className="space-y-4"><label><FieldLabel required>Permission name</FieldLabel><TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Projects" required maxLength={80} /></label><label><FieldLabel required>Permission key</FieldLabel><TextInput value={key} onChange={(event) => setKey(event.target.value)} placeholder="projects" required pattern="[a-z][a-z0-9_]*" maxLength={80} readOnly={Boolean(permission?.is_system)} /><span className="mt-1 block text-[10px] text-muted">Lowercase letters, numbers, and underscores only. Core keys cannot be changed.</span></label><label><FieldLabel>Description</FieldLabel><TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What can a user access with this permission?" maxLength={255} /></label></div>
  </Modal>
}
