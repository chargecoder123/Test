import { api } from './api'
import type { PermissionCatalogItem, PermissionGrant, PermissionGrantInput } from '../types'

export const permissionApi = {
  async catalog() {
    const { data } = await api.get<PermissionCatalogItem[]>('/permissions')
    return data
  },
  async create(input: { name: string; key: string; description?: string }) {
    const { data } = await api.post<PermissionCatalogItem>('/permissions', input)
    return data
  },
  async update(id: number, input: { name?: string; key?: string; description?: string | null }) {
    const { data } = await api.put<PermissionCatalogItem>(`/permissions/${id}`, input)
    return data
  },
  async remove(id: number) {
    await api.delete(`/permissions/${id}`)
  },
  async forUser(id: number) {
    const { data } = await api.get<PermissionGrant[]>(`/permissions/user/${id}`)
    return data
  },
  async saveForUser(id: number, permissions: PermissionGrantInput[]) {
    const { data } = await api.put<PermissionGrant[]>(`/permissions/user/${id}`, { permissions })
    return data
  },
}
