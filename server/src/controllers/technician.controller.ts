import type { Request, Response } from 'express'
import { getAssignedIssues } from '../services/technician.service.js'

export async function getTechnicianIssues(_req: Request, res: Response)
{
    try {
        const technicianId = res.locals.auth.userId

        const issues = await getAssignedIssues(technicianId)

        res.status(200).json(issues)
    } catch {
        res.status(500).json({ error: 'Unable to load assigned issues', code: 'INTERNAL_ERROR' })
    }
}