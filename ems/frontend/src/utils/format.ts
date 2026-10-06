import type { TaskPriority, TaskStatus, User } from '../types'

export function initials(name?: string | null) {
  return (name || 'Northstar')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export function formatDate(value?: string | null, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, options).format(date)
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

export function formatShortDate(value?: string | null) {
  return formatDate(value, { month: 'short', day: 'numeric' })
}

export function taskIsOverdue(status: TaskStatus, dueDate?: string | null) {
  return Boolean(dueDate && status !== 'COMPLETED' && status !== 'CANCELLED' && new Date(dueDate).getTime() < Date.now())
}

export function getPriorityTone(priority: TaskPriority) {
  return {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-amber-50 text-amber-700',
    URGENT: 'bg-rose-50 text-rose-700',
  }[priority]
}

export function getStatusTone(status: TaskStatus) {
  return {
    PENDING: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-violet-50 text-violet-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-rose-50 text-rose-700',
  }[status]
}

export function getHomePath(user: User) {
  if (user.role === 'ADMIN') return '/admin/dashboard'
  const permissions = new Set(user.permissions.filter((item) => item.can_view).map((item) => item.key))
  if (permissions.has('dashboard')) return `/${user.role.toLowerCase()}/dashboard`
  if (user.role === 'MANAGER') {
    if (permissions.has('employees')) return '/manager/employees'
    if (permissions.has('tasks')) return '/manager/tasks'
    if (permissions.has('daily_jobs')) return '/manager/daily-jobs'
  } else {
    if (permissions.has('my_tasks')) return '/employee/tasks'
    if (permissions.has('daily_jobs')) return '/employee/daily-jobs'
    if (permissions.has('profile')) return '/employee/profile'
    if (permissions.has('task_history')) return '/employee/history'
  }
  return '/403'
}
