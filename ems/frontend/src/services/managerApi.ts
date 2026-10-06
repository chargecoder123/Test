import { api } from './api'
import type { ManagedEmployee, PageResult, Task, TaskInput, TaskUpdateInput, TeamDashboard } from '../types'

export const managerApi = {
  async dashboard() {
    const { data } = await api.get<TeamDashboard>('/manager/dashboard')
    return data
  },
  async employees(params: { page?: number; page_size?: number; search?: string } = {}) {
    const { data } = await api.get<PageResult<ManagedEmployee>>('/manager/employees', { params })
    return data
  },
  async employee(id: number) {
    const { data } = await api.get<ManagedEmployee>(`/manager/employees/${id}`)
    return data
  },
  async employeeTasks(id: number) {
    const { data } = await api.get<PageResult<Task>>(`/manager/employees/${id}/tasks`, { params: { page_size: 100 } })
    return data
  },
  async tasks(params: { page?: number; page_size?: number; status?: string; search?: string; daily_only?: boolean } = {}) {
    const { data } = await api.get<PageResult<Task>>('/manager/tasks', { params })
    return data
  },
  async dailyJobs() {
    const { data } = await api.get<PageResult<Task>>('/manager/daily-jobs')
    return data
  },
  async createTask(input: TaskInput) {
    const { data } = await api.post<Task>('/manager/tasks', input)
    return data
  },
  async createDailyJob(input: TaskInput) {
    const { data } = await api.post<Task>('/manager/daily-jobs', input)
    return data
  },
  async updateTask(id: number, input: TaskUpdateInput) {
    const { data } = await api.put<Task>(`/manager/tasks/${id}`, input)
    return data
  },
  async deleteTask(id: number) {
    await api.delete(`/manager/tasks/${id}`)
  },
  async reviewTask(id: number, manager_notes: string) {
    const { data } = await api.post<Task>(`/manager/tasks/${id}/review`, { manager_notes })
    return data
  },
}
