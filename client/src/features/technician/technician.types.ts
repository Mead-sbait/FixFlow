import type { IssuePriority, IssueStatus } from '../../types'

export interface IssueReporter 
{
    id: string
    name: string
    email: string
}

export interface IssueCategory 
{
    id: string
    name: string
}

export interface TechnicianIssue 
{
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

export interface TechnicianStatusUpdateResponse
{
    id: string
    status: IssueStatus
    updatedAt: string
}

export interface TechnicianComment
{
    id: string
    issueId: string
    author: {
        id: string
        name: string
        role: 'user' | 'technician' | 'admin'
    } | null
    message: string
    isInternal: boolean
    createdAt: string
}

export interface CreateTechnicianCommentData
{
    message: string
    isInternal: boolean
}