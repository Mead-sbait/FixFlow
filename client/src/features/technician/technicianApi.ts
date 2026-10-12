import { api } from '../../lib/api'
import type { TechnicianIssue, TechnicianStatusUpdateResponse, TechnicianComment, CreateTechnicianCommentData } from './technician.types'

export async function getTechnicianIssues(token: string) {
    const response = await api.get<TechnicianIssue[]>(
        '/technician/issues',
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    return response.data
}

export async function getTechnicianIssue(token: string, issueId: string)
{
    const response = await api.get<TechnicianIssue>(
        `/technician/issues/${issueId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    return response.data
}

export async function updateTechnicianStatus(token: string, issueId: string, status: 'in_progress' | 'completed')
{
    const response = await api.patch<TechnicianStatusUpdateResponse>(
        `/technician/issues/${issueId}/status`,
        { status },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    return response.data
}

// Get issue comments
export async function getTechnicianComments(token: string, issueId: string) 
{
    const response = await api.get<TechnicianComment[]>(
        `/technician/issues/${issueId}/comments`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

    return response.data
}

// Add comment or internal note
export async function createTechnicianComment(token: string, issueId: string, data: CreateTechnicianCommentData) 
{
    const response = await api.post<TechnicianComment>(
        `/technician/issues/${issueId}/comments`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

    return response.data
}