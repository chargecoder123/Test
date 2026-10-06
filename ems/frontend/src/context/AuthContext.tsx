import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authApi } from '../services/authApi'
import { clearSessionTokens, getRefreshToken } from '../services/api'
import type { PermissionAction, User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  refreshUser: () => Promise<User | null>
  setCurrentUser: (user: User) => void
  hasPermission: (key: string, action?: PermissionAction) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  const setCurrentUser = useCallback((nextUser: User) => setUser(nextUser), [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const onExpired = () => {
      clearSessionTokens()
      setUser(null)
      setLoading(false)
    }
    const onRefreshed = (event: Event) => {
      const nextUser = (event as CustomEvent<User>).detail
      if (nextUser) setUser(nextUser)
    }
    window.addEventListener('ems:session-expired', onExpired)
    window.addEventListener('ems:session-refreshed', onRefreshed)
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      setLoading(false)
    } else {
      authApi.refresh(refreshToken)
        .then((response) => setUser(response.user))
        .catch(() => {
          clearSessionTokens()
          setUser(null)
        })
        .finally(() => setLoading(false))
    }
    return () => {
      window.removeEventListener('ems:session-expired', onExpired)
      window.removeEventListener('ems:session-refreshed', onRefreshed)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    let lastCheck = 0
    const revalidate = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck < 30_000) return
      lastCheck = Date.now()
      authApi.me().then(setUser).catch(() => undefined)
    }
    document.addEventListener('visibilitychange', revalidate)
    const timer = window.setInterval(revalidate, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', revalidate)
      window.clearInterval(timer)
    }
  }, [user?.id])

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    setUser(response.user)
    return response.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSessionTokens()
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const current = await authApi.me()
      setUser(current)
      return current
    } catch {
      return null
    }
  }, [])

  const hasPermission = useCallback((key: string, action: PermissionAction = 'view') => {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    const grant = user.permissions.find((item) => item.key === key)
    if (!grant || (action !== 'view' && !grant.can_view)) return false
    return {
      view: grant.can_view,
      create: grant.can_create,
      update: grant.can_update,
      delete: grant.can_delete,
    }[action]
  }, [user])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signOut,
    refreshUser,
    setCurrentUser,
    hasPermission,
  }), [user, loading, signIn, signOut, refreshUser, setCurrentUser, hasPermission])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
