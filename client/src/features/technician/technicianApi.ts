import { api } from '../../lib/api'
import type { TechnicianIssue } from './technician.types'

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