import { api } from './api'
import type { PageResult, Task, TaskInput, TaskUpdateInput } from '../types'

export const taskApi = {
  async all(params: { page?: number; page_size?: number; status?: string; search?: string; daily_only?: boolean } = {}) {
    const { data } = await api.get<PageResult<Task>>('/admin/tasks', { params })
    return data
  },
  async create(input: TaskInput) {
    const { data } = await api.post<Task>('/admin/tasks', input)
    return data
  },
  async update(id: number, input: TaskUpdateInput) {
    const { data } = await api.put<Task>(`/admin/tasks/${id}`, input)
    return data
  },
  async remove(id: number) {
    await api.delete(`/admin/tasks/${id}`)
  },
}
