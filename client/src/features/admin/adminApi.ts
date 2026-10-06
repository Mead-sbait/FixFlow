import { api } from '../../lib/api'
import type { IssuePriority, UserRole } from '../../types'
import type {
  AdminIssue,
  AdminStats,
  AdminUser,
  Category,
  IssueFilters,
  IssueListResponse,
  PersonRef,
  UserFilters
} from './admin.types'

function withToken(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

// the API rejects empty strings, so only send the filters that are actually set
function cleanParams(filters: IssueFilters | UserFilters) {
  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '') params[key] = value
  }
  return params
}

export async function getAdminIssues(token: string, filters: IssueFilters) {
  const response = await api.get<IssueListResponse>('/admin/issues', {
    params: cleanParams(filters),
    ...withToken(token)
  })
  return response.data
}

export async function getTechnicians(token: string) {
  const response = await api.get<PersonRef[]>('/admin/technicians', withToken(token))
  return response.data
}

export async function getCategories(token: string) {
  const response = await api.get<Category[]>('/categories', withToken(token))
  return response.data
}

export async function getAdminStats(token: string) {
  const response = await api.get<AdminStats>('/admin/stats', withToken(token))
  return response.data
}

export async function assignTechnician(token: string, issueId: string, technicianId: string) {
  const response = await api.patch<AdminIssue>(
    `/admin/issues/${issueId}/assign`,
    { technicianId },
    withToken(token)
  )
  return response.data
}

export async function updateIssuePriority(token: string, issueId: string, priority: IssuePriority) {
  const response = await api.patch<AdminIssue>(
    `/admin/issues/${issueId}/priority`,
    { priority },
    withToken(token)
  )
  return response.data
}

// admins can only cancel an active issue or reopen a closed one
export async function updateIssueStatus(token: string, issueId: string, status: 'open' | 'cancelled') {
  const response = await api.patch<AdminIssue>(
    `/admin/issues/${issueId}/status`,
    { status },
    withToken(token)
  )
  return response.data
}

export async function getUsers(token: string, filters: UserFilters) {
  const response = await api.get<AdminUser[]>('/admin/users', {
    params: cleanParams(filters),
    ...withToken(token)
  })
  return response.data
}

export async function updateUserRole(token: string, userId: string, role: UserRole) {
  const response = await api.patch<AdminUser>(`/admin/users/${userId}/role`, { role }, withToken(token))
  return response.data
}
