import { api } from './api'
import type { AdminDashboard, AttendanceEvent, PageResult, PermissionGrantInput, Role, Task, User } from '../types'

export interface UserQuery {
  search?: string
  role?: Role
  is_active?: boolean
  page?: number
  page_size?: number
}

export interface CreateUserInput {
  first_name: string
  last_name: string
  email: string
  phone?: string
  password: string
  manager_id?: number | null
  is_active: boolean
  permissions: PermissionGrantInput[]
}

export interface UpdateUserInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string | null
  manager_id?: number | null
  role?: 'MANAGER' | 'EMPLOYEE'
  is_active?: boolean
  password?: string
}

export const adminApi = {
  async dashboard() {
    const { data } = await api.get<AdminDashboard>('/admin/dashboard')
    return data
  },
  async users(params: UserQuery = {}) {
    const { data } = await api.get<PageResult<User>>('/admin/users', { params })
    return data
  },
  async employees(params: Omit<UserQuery, 'role'> = {}) {
    const { data } = await api.get<PageResult<User>>('/admin/employees', { params })
    return data
  },
  async managers(params: Omit<UserQuery, 'role'> = {}) {
    const { data } = await api.get<PageResult<User>>('/admin/managers', { params })
    return data
  },
  async getUser(id: number) {
    const { data } = await api.get<User>(`/admin/users/${id}`)
    return data
  },
  async getEmployee(id: number) {
    const { data } = await api.get<User>(`/admin/employees/${id}`)
    return data
  },
  async getManager(id: number) {
    const { data } = await api.get<User>(`/admin/managers/${id}`)
    return data
  },
  async createEmployee(input: CreateUserInput) {
    const { data } = await api.post<User>('/admin/employees', input)
    return data
  },
  async createManager(input: CreateUserInput) {
    const { data } = await api.post<User>('/admin/managers', input)
    return data
  },
  async updateEmployee(id: number, input: UpdateUserInput) {
    const { data } = await api.put<User>(`/admin/employees/${id}`, input)
    return data
  },
  async updateManager(id: number, input: UpdateUserInput) {
    const { data } = await api.put<User>(`/admin/managers/${id}`, input)
    return data
  },
  async updateUser(id: number, input: UpdateUserInput) {
    const { data } = await api.put<User>(`/admin/users/${id}`, input)
    return data
  },
  async setStatus(id: number, is_active: boolean) {
    const { data } = await api.put<User>(`/admin/users/${id}/status`, { is_active })
    return data
  },
  async assignManager(id: number, manager_id: number | null) {
    const { data } = await api.put<User>(`/admin/users/${id}/manager`, { manager_id })
    return data
  },
  async attendance(params: { page?: number; page_size?: number; user_id?: number } = {}) {
    const { data } = await api.get<AttendanceEvent[]>('/admin/attendance', { params })
    return data
  },
  async roles() {
    const { data } = await api.get<{ id: number; name: Role; description: string | null }[]>('/admin/roles')
    return data
  },
  async tasks(params: { page?: number; page_size?: number; status?: string; search?: string; daily_only?: boolean; assigned_to?: number } = {}) {
    const { data } = await api.get<PageResult<Task>>('/admin/tasks', { params })
    return data
  },
}
