export type UserRole = 'user' | 'technician' | 'admin'
export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface UserIssue {
  id: string
  title: string
  description: string
  location: string
  status: IssueStatus
  priority: IssuePriority
  createdAt: string
}
