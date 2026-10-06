import { api } from './api'
import type { AttendanceEvent, PageResult, Task, TeamDashboard, User } from '../types'

export const employeeApi = {
  async dashboard() {
    const { data } = await api.get<TeamDashboard>('/employee/dashboard')
    return data
  },
  async profile() {
    const { data } = await api.get<User>('/employee/profile')
    return data
  },
  async tasks() {
    const { data } = await api.get<PageResult<Task>>('/employee/tasks')
    return data
  },
  async dailyJobs() {
    const { data } = await api.get<PageResult<Task>>('/employee/daily-jobs')
    return data
  },
  async history(status?: string) {
    const { data } = await api.get<PageResult<Task>>('/employee/tasks/history', { params: status ? { status } : {} })
    return data
  },
  async activity() {
    const { data } = await api.get<AttendanceEvent[]>('/employee/activity')
    return data
  },
  async startTask(id: number) {
    const { data } = await api.put<Task>(`/employee/tasks/${id}/start`)
    return data
  },
  async completeTask(id: number) {
    const { data } = await api.put<Task>(`/employee/tasks/${id}/complete`)
    return data
  },
  async setTaskStatus(id: number, status: Task['status']) {
    const { data } = await api.put<Task>(`/employee/tasks/${id}/status`, { status })
    return data
  },
  async addTaskNote(id: number, note: string) {
    const { data } = await api.post<Task>(`/employee/tasks/${id}/notes`, { note })
    return data
  },
}
