import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { LoginResponse } from '../types'

const baseURL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')
const REFRESH_KEY = 'northstar_ems_refresh'

let accessToken: string | null = null
let refreshInFlight: Promise<string> | null = null

export const api = axios.create({
  baseURL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY)
}

export function setSessionTokens(access: string, refresh: string) {
  accessToken = access
  sessionStorage.setItem(REFRESH_KEY, refresh)
}

export function clearSessionTokens() {
  accessToken = null
  sessionStorage.removeItem(REFRESH_KEY)
}

function publish(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    config.headers = headers
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const url = request?.url || ''
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
    if (error.response?.status !== 401 || !request || request._retry || isAuthRequest) {
      return Promise.reject(error)
    }
    request._retry = true
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearSessionTokens()
      publish('ems:session-expired')
      return Promise.reject(error)
    }
    try {
      if (!refreshInFlight) {
        refreshInFlight = axios
          .post<LoginResponse>(`${baseURL}/auth/refresh`, { refresh_token: refreshToken })
          .then(({ data }) => {
            setSessionTokens(data.access_token, data.refresh_token)
            publish('ems:session-refreshed', data.user)
            return data.access_token
          })
          .catch((refreshError) => {
            clearSessionTokens()
            publish('ems:session-expired')
            throw refreshError
          })
          .finally(() => {
            refreshInFlight = null
          })
      }
      const freshAccess = await refreshInFlight
      const headers = AxiosHeaders.from(request.headers)
      headers.set('Authorization', `Bearer ${freshAccess}`)
      request.headers = headers
      return api(request)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)

export function getApiError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown; message?: string } | undefined
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail)) {
      return data.detail.map((item) => (typeof item === 'object' && item && 'msg' in item ? String(item.msg) : 'Invalid input')).join(' · ')
    }
    if (typeof data?.message === 'string') return data.message
    if (!error.response) return 'The API could not be reached. Check that the backend is running.'
  }
  return fallback
}
