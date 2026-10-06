import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { PermissionGrantInput, User } from '../../types'
import { adminApi, type CreateUserInput, type UpdateUserInput } from '../../services/adminApi'
import { permissionApi } from '../../services/permissionApi'
import { getApiError } from '../../services/api'
import { FieldLabel, SelectInput, TextInput } from '../../components/FormField'
import { Modal } from '../../components/Modal'

export type PeopleScope = 'EMPLOYEE' | 'MANAGER' | 'ALL'

interface UserFormDialogProps {
  open: boolean
  scope: PeopleScope
  user?: User | null
  onClose: () => void
  onSaved: () => void
}

const defaultPageKeys: Record<'MANAGER' | 'EMPLOYEE', string[]> = {
  MANAGER: ['dashboard', 'employees', 'employee_details', 'tasks', 'task_management', 'daily_jobs'],
  EMPLOYEE: ['dashboard', 'profile', 'my_tasks', 'daily_jobs', 'task_history'],
}

export function UserFormDialog({ open, scope, user, onClose, onSaved }: UserFormDialogProps) {
  const editing = Boolean(user)
  const catalogQuery = useQuery({ queryKey: ['permissions', 'catalog'], queryFn: permissionApi.catalog, enabled: open })
  const managersQuery = useQuery({ queryKey: ['admin', 'managers', 'active'], queryFn: () => adminApi.managers({ page_size: 100, is_active: true }), enabled: open && (scope !== 'MANAGER') })
  const [role, setRole] = useState<'MANAGER' | 'EMPLOYEE'>(scope === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [managerId, setManagerId] = useState('')
  const [active, setActive] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const managers = managersQuery.data?.items || []

  useEffect(() => {
    if (!open) return
    const nextRole = (user?.role === 'MANAGER' ? 'MANAGER' : scope === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE') as 'MANAGER' | 'EMPLOYEE'
    setRole(nextRole)
    setFirstName(user?.first_name || '')
    setLastName(user?.last_name || '')
    setEmail(user?.email || '')
    setPhone(user?.phone || '')
    setPassword('')
    setConfirmPassword('')
    setManagerId(user?.manager_id ? String(user.manager_id) : '')
    setActive(user?.is_active ?? true)
    setSelected(user ? user.permissions.filter((grant) => grant.can_view).map((grant) => grant.key) : defaultPageKeys[nextRole])
  }, [open, user, scope])

  const selectedPermissions = useMemo<PermissionGrantInput[]>(() => {
    const catalog = catalogQuery.data || []
    return catalog.filter((permission) => selected.includes(permission.key)).map((permission) => ({
      permission_id: permission.id,
      can_view: true,
      can_create: permission.key === 'task_management' || permission.key === 'daily_jobs' ? role === 'MANAGER' : false,
      can_update: permission.key === 'task_management' ? role === 'MANAGER' : permission.key === 'my_tasks' && role === 'EMPLOYEE',
      can_delete: permission.key === 'task_management' && role === 'MANAGER',
    }))
  }, [catalogQuery.data, selected, role])

  function togglePermission(key: string) {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if ((!editing || password) && password !== confirmPassword) {
      toast.error('Your password confirmation does not match.')
      return
    }
    if (!editing && !catalogQuery.data) {
      toast.error('The permission catalog is still loading. Please try again.')
      return
    }
    if (!editing && password.length < 8) {
      toast.error('Passwords must contain at least 8 characters.')
      return
    }
    setSaving(true)
    try {
      if (editing && user) {
        const input: UpdateUserInput = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          is_active: active,
        }
        if (password) input.password = password
        if (user.role === 'EMPLOYEE') input.manager_id = managerId ? Number(managerId) : null
        await (scope === 'ALL' ? adminApi.updateUser(user.id, input) : user.role === 'MANAGER' ? adminApi.updateManager(user.id, input) : adminApi.updateEmployee(user.id, input))
        toast.success('User details updated.')
      } else {
        const input: CreateUserInput = {
          first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(),
          phone: phone.trim() || undefined, password, is_active: active,
          manager_id: role === 'EMPLOYEE' && managerId ? Number(managerId) : null,
          permissions: selectedPermissions,
        }
        if (role === 'MANAGER') await adminApi.createManager(input)
        else await adminApi.createEmployee(input)
        toast.success(`${role === 'MANAGER' ? 'Manager' : 'Employee'} account created.`)
      }
      onSaved()
      onClose()
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setSaving(false)
    }
  }

  const pageChoices = (catalogQuery.data || []).filter((item) => {
    if (role === 'MANAGER') return ['dashboard', 'employees', 'employee_details', 'employee_directory', 'tasks', 'task_management', 'daily_jobs', 'reports', 'attendance', 'settings', 'users'].includes(item.key)
    return ['dashboard', 'profile', 'my_tasks', 'daily_jobs', 'task_history', 'employee_directory', 'reports', 'attendance', 'settings'].includes(item.key)
  })

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit account' : scope === 'ALL' ? 'Add a team member' : `Create ${scope.toLowerCase()}`} description={editing ? 'Update account details and reporting information.' : 'Set up a secure account and choose its starting access.'} onSubmit={submit} submitLabel={editing ? 'Save changes' : 'Create account'} submitting={saving} size="lg">
      <div className="space-y-5">
        {!editing && scope === 'ALL' && <label><FieldLabel required>Role</FieldLabel><SelectInput value={role} onChange={(event) => { const nextRole = event.target.value as 'MANAGER' | 'EMPLOYEE'; setRole(nextRole); setSelected(defaultPageKeys[nextRole]) }}><option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option></SelectInput></label>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label><FieldLabel required>First name</FieldLabel><TextInput value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="e.g. Jordan" required maxLength={80} /></label>
          <label><FieldLabel required>Last name</FieldLabel><TextInput value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="e.g. Lee" required maxLength={80} /></label>
          <label><FieldLabel required>Work email</FieldLabel><TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jordan@company.com" required /></label>
          <label><FieldLabel>Phone</FieldLabel><TextInput type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 (555) 000-0000" /></label>
          {role === 'EMPLOYEE' && <label className="sm:col-span-2"><FieldLabel>Assign manager</FieldLabel><SelectInput value={managerId} onChange={(event) => setManagerId(event.target.value)}><option value="">No manager assigned</option>{user?.manager && !managers.some((manager) => manager.id === user.manager_id) && <option value={user.manager.id}>{user.manager.first_name} {user.manager.last_name} · current manager</option>}{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.full_name} · {manager.email}</option>)}</SelectInput></label>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><FieldLabel required={!editing}>{editing ? 'New password (optional)' : 'Temporary password'}</FieldLabel><TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={editing ? 'Leave blank to keep current' : 'At least 8 characters'} minLength={editing && !password ? undefined : 8} required={!editing} autoComplete="new-password" /></label>
          {(!editing || password) && <label><FieldLabel required>Confirm {editing ? 'new password' : 'password'}</FieldLabel><TextInput type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" required minLength={8} autoComplete="new-password" /></label>}
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3"><span><span className="block text-xs font-bold text-slate-700">Account status</span><span className="mt-1 block text-[11px] text-muted">Inactive users cannot sign in.</span></span><span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />Active</span></label>
        {!editing && <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm"><ShieldCheck className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Starting page access</div><p className="mt-1 text-[11px] leading-5 text-muted">Choose which pages they can open. Fine-grained create, edit, and delete access can be changed later.</p></div></div>
          {catalogQuery.isError ? <p className="mt-4 text-xs text-rose-600">Permission catalog could not be loaded. Try again before creating this account.</p> : <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {pageChoices.map((item) => <label key={item.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200"><input type="checkbox" checked={selected.includes(item.key)} onChange={() => togglePermission(item.key)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />{item.name}</label>)}
          </div>}
        </div>}
        {editing && password && password !== confirmPassword && confirmPassword && <p className="flex items-center gap-2 text-xs text-rose-600"><KeyRound className="h-3.5 w-3.5" />The password confirmation does not match.</p>}
      </div>
    </Modal>
  )
}
