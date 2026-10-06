import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'
import { getHomePath } from '../utils/format'
import { ProtectedRoute, PermissionRoute, RoleRoute } from './RouteGuards'
import { LoginPage } from '../pages/auth/LoginPage'
import { AdminLayout } from '../layouts/AdminLayout'
import { ManagerLayout } from '../layouts/ManagerLayout'
import { EmployeeLayout } from '../layouts/EmployeeLayout'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { PeoplePage } from '../pages/admin/PeoplePage'
import { AdminUserDetailPage } from '../pages/admin/AdminUserDetailPage'
import { PermissionsPage } from '../pages/admin/PermissionsPage'
import { ReportsPage } from '../pages/admin/ReportsPage'
import { AttendancePage } from '../pages/admin/AttendancePage'
import { SettingsPage } from '../pages/admin/SettingsPage'
import { TaskWorkspacePage } from '../pages/tasks/TaskWorkspacePage'
import { ManagerDashboardPage } from '../pages/manager/ManagerDashboardPage'
import { ManagerEmployeesPage } from '../pages/manager/ManagerEmployeesPage'
import { ManagerEmployeeDetailPage } from '../pages/manager/ManagerEmployeeDetailPage'
import { EmployeeDashboardPage } from '../pages/employee/EmployeeDashboardPage'
import { EmployeeTasksPage } from '../pages/employee/EmployeeTasksPage'
import { EmployeeProfilePage } from '../pages/employee/EmployeeProfilePage'
import { AccessDeniedPage } from './RouteGuards'

function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Opening your workspace…</div>
  return user ? <Navigate to={getHomePath(user)} replace /> : <Navigate to="/login" replace />
}

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Checking your session…</div>
  return user ? <Navigate to={getHomePath(user)} replace /> : <LoginPage />
}

function MissingPage() {
  const { user } = useAuth()
  return <main className="flex min-h-screen items-center justify-center bg-canvas px-6"><div className="text-center"><div className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">404 · Not found</div><h1 className="mt-2 font-display text-3xl font-extrabold text-ink">We can’t find that page.</h1><p className="mt-2 text-sm text-muted">The address may have changed or the page may not exist.</p><a href={user ? getHomePath(user) : '/login'} className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">Back to my workspace</a></div></main>
}

function OnlyRole({ role, children }: { role: Role; children: ReactNode }) {
  return <RoleRoute roles={[role]}>{children}</RoleRoute>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<HomeRoute />} />
        <Route path="403" element={<AccessDeniedPage />} />
        <Route path="admin" element={<OnlyRole role="ADMIN"><AdminLayout /></OnlyRole>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PermissionRoute permission="dashboard"><AdminDashboardPage /></PermissionRoute>} />
          <Route path="users" element={<PermissionRoute permission="users"><PeoplePage scope="ALL" /></PermissionRoute>} />
          <Route path="employees" element={<PermissionRoute permission="employees"><PeoplePage scope="EMPLOYEE" /></PermissionRoute>} />
          <Route path="employees/:id" element={<PermissionRoute permission="employee_details"><AdminUserDetailPage role="EMPLOYEE" /></PermissionRoute>} />
          <Route path="managers" element={<PermissionRoute permission="managers"><PeoplePage scope="MANAGER" /></PermissionRoute>} />
          <Route path="managers/:id" element={<PermissionRoute permission="manager_details"><AdminUserDetailPage role="MANAGER" /></PermissionRoute>} />
          <Route path="tasks" element={<PermissionRoute permission="tasks"><TaskWorkspacePage role="ADMIN" /></PermissionRoute>} />
          <Route path="permissions" element={<PermissionRoute permission="settings"><PermissionsPage /></PermissionRoute>} />
          <Route path="reports" element={<PermissionRoute permission="reports"><ReportsPage /></PermissionRoute>} />
          <Route path="attendance" element={<PermissionRoute permission="attendance"><AttendancePage /></PermissionRoute>} />
          <Route path="settings" element={<PermissionRoute permission="settings"><SettingsPage /></PermissionRoute>} />
        </Route>
        <Route path="manager" element={<OnlyRole role="MANAGER"><ManagerLayout /></OnlyRole>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PermissionRoute permission="dashboard"><ManagerDashboardPage /></PermissionRoute>} />
          <Route path="employees" element={<PermissionRoute permission="employees"><ManagerEmployeesPage /></PermissionRoute>} />
          <Route path="employees/:id" element={<PermissionRoute permission="employee_details"><ManagerEmployeeDetailPage /></PermissionRoute>} />
          <Route path="tasks" element={<PermissionRoute permission="tasks"><TaskWorkspacePage role="MANAGER" /></PermissionRoute>} />
          <Route path="daily-jobs" element={<PermissionRoute permission="daily_jobs"><TaskWorkspacePage role="MANAGER" dailyOnly /></PermissionRoute>} />
        </Route>
        <Route path="employee" element={<OnlyRole role="EMPLOYEE"><EmployeeLayout /></OnlyRole>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PermissionRoute permission="dashboard"><EmployeeDashboardPage /></PermissionRoute>} />
          <Route path="profile" element={<PermissionRoute permission="profile"><EmployeeProfilePage /></PermissionRoute>} />
          <Route path="tasks" element={<PermissionRoute permission="my_tasks"><EmployeeTasksPage view="tasks" /></PermissionRoute>} />
          <Route path="daily-jobs" element={<PermissionRoute permission="daily_jobs"><EmployeeTasksPage view="daily" /></PermissionRoute>} />
          <Route path="history" element={<PermissionRoute permission="task_history"><EmployeeTasksPage view="history" /></PermissionRoute>} />
        </Route>
      </Route>
      <Route path="*" element={<MissingPage />} />
    </Routes>
  )
}
