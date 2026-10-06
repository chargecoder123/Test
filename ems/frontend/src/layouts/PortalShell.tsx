import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, BarChart3, Bell, BriefcaseBusiness, CalendarCheck, ChevronDown, CircleHelp, ClipboardList,
  Command, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, UserRound, UserRoundCog, X,
} from 'lucide-react'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/Avatar'
import type { PermissionAction } from '../types'

interface NavItem {
  to: string
  label: string
  permission: string
  icon: LucideIcon
  action?: PermissionAction
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navigation: Record<'ADMIN' | 'MANAGER' | 'EMPLOYEE', NavGroup[]> = {
  ADMIN: [
    { title: 'Workspace', items: [
      { to: '/admin/dashboard', label: 'Overview', permission: 'dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'All users', permission: 'users', icon: Users },
    ] },
    { title: 'People', items: [
      { to: '/admin/employees', label: 'Employees', permission: 'employees', icon: UserRound },
      { to: '/admin/managers', label: 'Managers', permission: 'managers', icon: UserRoundCog },
    ] },
    { title: 'Work & access', items: [
      { to: '/admin/tasks', label: 'Tasks', permission: 'tasks', icon: ClipboardList },
      { to: '/admin/permissions', label: 'Permissions', permission: 'settings', icon: ShieldCheck },
      { to: '/admin/reports', label: 'Reports', permission: 'reports', icon: BarChart3 },
      { to: '/admin/attendance', label: 'Attendance', permission: 'attendance', icon: CalendarCheck },
    ] },
    { title: 'System', items: [
      { to: '/admin/settings', label: 'Settings', permission: 'settings', icon: Settings },
    ] },
  ],
  MANAGER: [
    { title: 'Workspace', items: [
      { to: '/manager/dashboard', label: 'Overview', permission: 'dashboard', icon: LayoutDashboard },
      { to: '/manager/employees', label: 'My employees', permission: 'employees', icon: Users },
    ] },
    { title: 'Work', items: [
      { to: '/manager/tasks', label: 'Task board', permission: 'tasks', icon: ClipboardList },
      { to: '/manager/daily-jobs', label: 'Daily jobs', permission: 'daily_jobs', icon: BriefcaseBusiness },
    ] },
  ],
  EMPLOYEE: [
    { title: 'Workspace', items: [
      { to: '/employee/dashboard', label: 'Overview', permission: 'dashboard', icon: LayoutDashboard },
      { to: '/employee/profile', label: 'My profile', permission: 'profile', icon: UserRound },
    ] },
    { title: 'My work', items: [
      { to: '/employee/tasks', label: 'My tasks', permission: 'my_tasks', icon: ClipboardList },
      { to: '/employee/daily-jobs', label: 'Daily jobs', permission: 'daily_jobs', icon: BriefcaseBusiness },
      { to: '/employee/history', label: 'Task history', permission: 'task_history', icon: Activity },
    ] },
  ],
}

function SidebarContent({ close }: { close: () => void }) {
  const { user, hasPermission } = useAuth()
  const location = useLocation()
  if (!user) return null
  const groups = navigation[user.role]
  return (
    <>
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-blue-950/20"><Command className="h-5 w-5" strokeWidth={2.3} /></span>
        <div className="min-w-0"><div className="font-display text-[15px] font-extrabold tracking-tight text-white">northstar</div><div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.19em] text-slate-400">people operations</div></div>
        <button onClick={close} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>
      <div className="px-3 py-5">
        <div className="mb-3 rounded-xl border border-white/[0.08] bg-white/[0.045] px-3 py-2.5">
          <div className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.12)]" /><span className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-300">{user.role.toLowerCase()} workspace</span></div>
        </div>
        {groups.map((group) => {
          const items = group.items.filter((item) => hasPermission(item.permission, item.action || 'view'))
          if (!items.length) return null
          return (
            <div key={group.title} className="mb-5">
              <div className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[0.17em] text-slate-500">{group.title}</div>
              <div className="space-y-1">
                {items.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to || (to !== '/admin/dashboard' && to !== '/manager/dashboard' && to !== '/employee/dashboard' && location.pathname.startsWith(`${to}/`))
                  return (
                    <NavLink key={to} to={to} onClick={close} className={clsx('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition', active ? 'bg-brand-500 text-white shadow-md shadow-blue-950/20' : 'text-slate-400 hover:bg-white/[0.07] hover:text-white')}>
                      <Icon className={clsx('h-[17px] w-[17px]', active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} strokeWidth={1.9} />
                      <span>{label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90" />}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-auto px-3 pb-4">
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-3.5">
          <div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-brand-300" /><span className="text-xs font-semibold text-slate-200">Need a hand?</span></div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">Your administrator can help with access and account questions.</p>
        </div>
        <div className="mt-4 px-3 text-[10px] text-slate-600">Northstar EMS <span className="float-right">v1.0</span></div>
      </div>
    </>
  )
}

export function PortalShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  if (!user) return null
  const currentLabel = navigation[user.role].flatMap((group) => group.items).find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))?.label || 'Workspace'
  const onLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }
  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-[#101b32] lg:flex"><SidebarContent close={() => undefined} /></aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={clsx('fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col bg-[#101b32] shadow-2xl transition-transform lg:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full')}><SidebarContent close={() => setMobileOpen(false)} /></aside>
      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Northstar / {user.role.toLowerCase()}</div><div className="mt-0.5 truncate font-display text-sm font-bold text-ink">{currentLabel}</div></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 md:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />All systems operational</div>
            <button className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" aria-label="Notifications"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-white bg-brand-500" /></button>
            <div className="relative border-l border-slate-200 pl-3 sm:pl-4">
              <button onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-slate-50">
                <Avatar name={user.full_name} image={user.profile_image} size="sm" />
                <span className="hidden min-w-0 md:block"><span className="block max-w-36 truncate text-xs font-bold text-ink">{user.full_name}</span><span className="mt-0.5 block text-[10px] font-medium text-muted">{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</span></span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
              </button>
              {profileOpen && <><button className="fixed inset-0 z-30 cursor-default" onClick={() => setProfileOpen(false)} aria-label="Close account menu" /><div className="absolute right-0 top-[calc(100%+10px)] z-40 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2.5"><div className="text-xs font-bold text-ink">{user.full_name}</div><div className="mt-1 truncate text-[11px] text-muted">{user.email}</div></div>
                {user.role === 'EMPLOYEE' && <button onClick={() => { setProfileOpen(false); navigate('/employee/profile') }} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><UserRound className="h-4 w-4" />My profile</button>}
                <button onClick={onLogout} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />Sign out</button>
              </div></>}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-8 lg:px-9 lg:py-9"><Outlet /></main>
      </div>
    </div>
  )
}

