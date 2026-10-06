import { api, clearSessionTokens, getRefreshToken, setSessionTokens } from './api'
import type { LoginResponse, User } from '../types'

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    setSessionTokens(data.access_token, data.refresh_token)
    return data
  },
  async refresh(refreshToken: string) {
    const { data } = await api.post<LoginResponse>('/auth/refresh', { refresh_token: refreshToken })
    setSessionTokens(data.access_token, data.refresh_token)
    return data
  },
  async me() {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
  async logout() {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken })
    } finally {
      clearSessionTokens()
    }
  },
}
