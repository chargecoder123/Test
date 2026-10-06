import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, Check, Command, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/Button'
import { getApiError } from '../../services/api'
import { getHomePath } from '../../utils/format'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const user = await signIn(email.trim(), password)
      toast.success(`Welcome back, ${user.first_name}.`)
      navigate(getHomePath(user), { replace: true })
    } catch (error) {
      toast.error(getApiError(error, 'We couldn’t sign you in. Check your details and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.02fr_.98fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#111d35] px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full border border-white/[0.08]" />
        <div className="absolute -right-16 -top-16 h-[400px] w-[400px] rounded-full border border-white/[0.07]" />
        <div className="absolute -bottom-44 -left-28 h-[480px] w-[480px] rounded-full bg-brand-600/20 blur-[100px]" />
        <div className="relative z-10 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white"><Command className="h-5 w-5" /></span><div><div className="font-display text-base font-extrabold tracking-tight">northstar</div><div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">people operations</div></div></div>
        <div className="relative z-10 my-auto max-w-xl pb-10 pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-200"><Sparkles className="h-3.5 w-3.5" />People, in sync</span>
          <h1 className="mt-7 font-display text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] xl:text-[58px]">A clearer view<br />of <span className="text-blue-300">great work.</span></h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">Bring your team, daily work, and progress together in one calm, connected workspace.</p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200"><UsersRound className="h-4 w-4" /></span><div className="mt-4 text-xs font-bold">People first</div><div className="mt-1 text-[11px] leading-5 text-slate-400">Your entire team, working in step.</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200"><ShieldCheck className="h-4 w-4" /></span><div className="mt-4 text-xs font-bold">Access by design</div><div className="mt-1 text-[11px] leading-5 text-slate-400">The right tools for every role.</div></div>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-500"><span>© {new Date().getFullYear()} Northstar EMS</span><span>Secure team access</span></div>
      </section>
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex items-center gap-2.5 lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Command className="h-4 w-4" /></span><span className="font-display text-sm font-extrabold text-ink">northstar</span></div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><LockKeyhole className="h-5 w-5" /></div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Your workspace awaits</div>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Welcome back</h2>
            <p className="mt-2 text-sm text-muted">Sign in with your work account to continue.</p>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Work email</span><span className="relative block"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-50" /></span></label>
            <label className="block"><span className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-600">Password</span><span className="relative block"><LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-50" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
            <Button type="submit" busy={submitting} className="mt-1 w-full py-3.5" icon={<ArrowRight className="h-4 w-4" />}>Sign in to Northstar</Button>
          </form>
          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm"><Check className="h-4 w-4" /></span><p className="text-[11px] leading-5 text-slate-500"><span className="font-bold text-slate-700">Protected sign-in.</span> Your access is securely managed by your organization’s administrator.</p></div>
        </div>
        <div className="mx-auto flex w-full max-w-[440px] items-center justify-between pb-2 text-[10px] text-slate-400"><span>© Northstar EMS</span><span>Need access? Contact your administrator.</span></div>
      </section>
    </main>
  )
}
