import { api } from '../../lib/api'
import type { TechnicianIssue, TechnicianStatusUpdateResponse } from './technician.types'

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