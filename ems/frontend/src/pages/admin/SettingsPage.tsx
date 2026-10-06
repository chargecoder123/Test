import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, KeyRound, Save, Server, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { adminApi } from '../../services/adminApi'
import { getApiError } from '../../services/api'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelHeader } from '../../components/Panel'
import { Button } from '../../components/Button'
import { FieldLabel, TextInput } from '../../components/FormField'

export function SettingsPage() {
  const { user, setCurrentUser } = useAuth()
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    setFirstName(user?.first_name || '')
    setLastName(user?.last_name || '')
    setEmail(user?.email || '')
    setPhone(user?.phone || '')
  }, [user])

  useEffect(() => {
    fetch('/health').then((response) => setApiHealthy(response.ok)).catch(() => setApiHealthy(false))
  }, [])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    if (password && password !== confirmPassword) {
      toast.error('Password confirmation does not match.')
      return
    }
    setSaving(true)
    try {
      const updated = await adminApi.updateUser(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        ...(password ? { password } : {}),
      })
      setCurrentUser(updated)
      setPassword('')
      setConfirmPassword('')
      toast.success('Account settings saved.')
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Workspace" title="Settings" description="Update your administrator account and review the system connection." />
      <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
        <Panel>
          <PanelHeader title="Administrator profile" subtitle="These details are used across your Northstar workspace" />
          <form onSubmit={save} className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel required>First name</FieldLabel><TextInput value={firstName} onChange={(event) => setFirstName(event.target.value)} required maxLength={80} /></label><label><FieldLabel required>Last name</FieldLabel><TextInput value={lastName} onChange={(event) => setLastName(event.target.value)} required maxLength={80} /></label><label><FieldLabel required>Email</FieldLabel><TextInput value={email} type="email" onChange={(event) => setEmail(event.target.value)} required /></label><label><FieldLabel>Phone</FieldLabel><TextInput value={phone} type="tel" onChange={(event) => setPhone(event.target.value)} placeholder="Not provided" /></label></div>
            <div className="border-t border-slate-100 pt-5"><div className="mb-4 flex items-center gap-2 text-xs font-bold text-ink"><KeyRound className="h-4 w-4 text-brand-600" />Reset password <span className="font-normal text-muted">· optional</span></div><div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel>New password</FieldLabel><TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /></label><label><FieldLabel>Confirm new password</FieldLabel><TextInput type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="Type it again" /></label></div></div>
            <div className="flex justify-end border-t border-slate-100 pt-5"><Button type="submit" busy={saving} icon={<Save className="h-4 w-4" />}>Save account</Button></div>
          </form>
        </Panel>
        <div className="space-y-5">
          <Panel><PanelHeader title="System health" subtitle="Connection status from your API" /><div className="flex items-center gap-3.5 p-5"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${apiHealthy ? 'bg-emerald-50 text-emerald-600' : apiHealthy === false ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}><Server className="h-5 w-5" /></span><div className="flex-1"><div className="text-xs font-bold text-ink">FastAPI backend</div><div className="mt-1 text-[11px] text-muted">{apiHealthy === null ? 'Checking connection…' : apiHealthy ? 'Connected and responding' : 'Unable to reach the health endpoint'}</div></div>{apiHealthy && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}</div><div className="mx-5 mb-5 rounded-xl bg-slate-50 px-3.5 py-3 text-[10px] leading-5 text-slate-500">API requests use the configured Vite proxy in development and the same-origin API base in production.</div></Panel>
          <Panel><PanelHeader title="Access & security" subtitle="How workspace protection works" /><div className="space-y-4 p-5"><div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><ShieldCheck className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Role-based access</div><p className="mt-1 text-[11px] leading-5 text-muted">Managers and employees see only pages and actions explicitly granted by an administrator.</p></div></div><div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand-600"><UserRound className="h-4 w-4" /></span><div><div className="text-xs font-bold text-ink">Protected accounts</div><p className="mt-1 text-[11px] leading-5 text-muted">Passwords are hashed by the API. Refresh sessions are revocable and rotate on use.</p></div></div></div></Panel>
        </div>
      </div>
    </div>
  )
}
