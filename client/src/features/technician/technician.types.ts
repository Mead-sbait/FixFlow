import type { IssuePriority, IssueStatus } from '../../types'

export interface IssueReporter {
    id: string
    name: string
    email: string
}

export interface IssueCategory {
    id: string
    name: string
}

export interface TechnicianIssue {
    id: string
    title: string
    description: string
    location: string
    status: IssueStatus
    priority: IssuePriority
    reporter: IssueReporter | null
    category: IssueCategory | null
    createdAt: string
    updatedAt: string
}