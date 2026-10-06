import { useAuth } from '../context/AuthContext'
import type { PermissionAction } from '../types'

export function usePermission(key: string, action: PermissionAction = 'view') {
  const { hasPermission } = useAuth()
  return hasPermission(key, action)
}

export function usePageAccess() {
  const { user, hasPermission } = useAuth()
  return {
    role: user?.role ?? null,
    canView: (key: string) => hasPermission(key, 'view'),
    canCreate: (key: string) => hasPermission(key, 'create'),
    canUpdate: (key: string) => hasPermission(key, 'update'),
    canDelete: (key: string) => hasPermission(key, 'delete'),
  }
}
