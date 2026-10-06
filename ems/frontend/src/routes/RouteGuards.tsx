import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PermissionAction, Role } from '../types'
import { useAuth } from '../context/AuthContext'
import { getHomePath } from '../utils/format'
import { Button } from '../components/Button'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Opening your workspace…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RoleRoute({ roles, children }: { roles: Role[]; children?: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/403" replace />
  return children ?? <Outlet />
}

export function PermissionRoute({ permission, action = 'view', children }: { permission: string; action?: PermissionAction; children?: ReactNode }) {
  const { hasPermission } = useAuth()
  if (!hasPermission(permission, action)) return <AccessDeniedPage />
  return children ?? <Outlet />
}

export function AccessDeniedPage() {
  const { user } = useAuth()
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><ShieldAlert className="h-8 w-8" /></span>
        <div className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">403 · Access denied</div>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">This page is out of bounds.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">You don’t have permission to access this part of the workspace. If you need access, ask your administrator to update your page permissions.</p>
        {user && <Button className="mt-7" onClick={() => window.location.assign(getHomePath(user))}>Back to my workspace</Button>}
      </div>
    </main>
  )
}
