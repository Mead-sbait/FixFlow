import type { IssuePriority, IssueStatus } from '../../types'

// what GET /api/issues returns for the reporter: plain ids, no populated names
export interface UserIssue {
  id: string
  title: string
  description: string
  location: string
  status: IssueStatus
  priority: IssuePriority
  reporterId: string
  technicianId: string | null
  categoryId: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
}

export interface NewIssue {
  title: string
  description: string
  location: string
  categoryId: string
  priority: IssuePriority
}
