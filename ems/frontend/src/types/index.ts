export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
export type PermissionAction = 'view' | 'create' | 'update' | 'delete'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface PermissionGrant {
  id: number
  permission_id: number
  name: string
  key: string
  can_view: boolean
  can_create: boolean
  can_update: boolean
  can_delete: boolean
}

export interface PermissionCatalogItem {
  id: number
  name: string
  key: string
  description: string | null
  is_system: boolean
}

export interface PermissionGrantInput {
  permission_id: number
  can_view: boolean
  can_create: boolean
  can_update: boolean
  can_delete: boolean
}

export interface UserSummary {
  id: number
  first_name: string
  last_name: string
  email: string
  role: Role
}

export interface User {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  role: Role
  manager_id: number | null
  manager: UserSummary | null
  is_active: boolean
  profile_image: string | null
  created_at: string
  updated_at: string
  permissions: PermissionGrant[]
}

export interface ManagedEmployee {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  manager_id: number | null
  is_active: boolean
  created_at: string
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  overdue_tasks: number
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface Task {
  id: number
  title: string
  description: string | null
  assigned_to: number
  assigned_by: number
  assigned_employee: UserSummary
  assigner: UserSummary
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  is_daily_job: boolean
  created_at: string
  updated_at: string
  completed_at: string | null
  employee_notes: string | null
  manager_notes: string | null
}

export interface TaskInput {
  title: string
  description?: string | null
  assigned_to: number
  priority: TaskPriority
  due_date?: string | null
  is_daily_job?: boolean
  manager_notes?: string | null
}

export interface TaskUpdateInput extends Partial<TaskInput> {
  status?: TaskStatus
}

export interface AttendanceEvent {
  id: number
  user_id: number
  user: UserSummary
  event_type: string
  note: string | null
  created_at: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface AdminDashboard {
  stats: {
    employees: number
    managers: number
    active_employees: number
    active_managers: number
    pending_tasks: number
    in_progress_tasks: number
    completed_tasks: number
    overdue_tasks: number
  }
  task_status: { key: string; label: string; value: number }[]
  monthly_tasks: { month: string; value: number }[]
  daily_tasks: { day: string; date: string; value: number }[]
  employee_performance: { name: string; completed: number }[]
}

export interface TeamDashboard {
  stats: Record<string, number>
  task_status: { key: string; label: string; value: number }[]
  recent_tasks: Task[]
}
