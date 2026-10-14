import type { IssuePriority, IssueStatus, UserRole } from '../../types'

export interface PersonRef {
  id: string
  name: string
  email: string
}

export interface Category {
  id: string
  name: string
}

export interface AdminIssue {
  id: string
  title: string
  description: string
  location: string
  status: IssueStatus
  priority: IssuePriority
  reporter: PersonRef | null
  technician: PersonRef | null
  category: Category | null
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface IssueListResponse {
  items: AdminIssue[]
  pagination: Pagination
}

export interface IssueFilters {
  search: string
  status: IssueStatus | ''
  priority: IssuePriority | ''
  categoryId: string
  // empty = all, 'unassigned' = no technician yet, otherwise a technician id
  technicianId: string
  page: number
  limit: number
}

export interface CountByName {
  id: string
  name: string
  count: number
}

export interface AdminStats {
  total: number
  open: number
  assigned: number
  inProgress: number
  completed: number
  cancelled: number
  urgent: number
  unassigned: number
  byCategory: CountByName[]
  byTechnician: CountByName[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface UserFilters {
  role: UserRole | ''
  search: string
}
