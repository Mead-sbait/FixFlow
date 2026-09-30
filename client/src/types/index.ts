export type UserRole = 'user' | 'technician' | 'admin'
export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface PersonSummary {
  id: string
  name: string
  email: string
}

export interface CategorySummary {
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
  reporter: PersonSummary | null
  technician: PersonSummary | null
  category: CategorySummary | null
  createdAt: string
  updatedAt: string
}

export interface AdminStats {
  total: number
  open: number
  assigned: number
  inProgress: number
  completed: number
  urgent: number
  unassigned: number
}

export interface AdminFilters {
  search: string
  status: IssueStatus | ''
  priority: IssuePriority | ''
  categoryId: string
  technicianId: string
  page: number
  limit: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}
