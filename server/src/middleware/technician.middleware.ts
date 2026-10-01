import type { Request, Response, NextFunction } from 'express'
import { User } from '../models/index.js'

export async function requireTechnician(_req: Request, res: Response, next: NextFunction)
{
    try {
        const userId = res.locals.auth?.userId

        if (!userId)
        {
            res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' })
            return
        }

        const user = await User.findById(userId).select('role')

        if (!user || user.role !== 'technician')
        {
            res.status(403).json({ error: 'Technician access required', code: 'FORBIDDEN' })
            return
        }

    next()
    } catch (error) {
        next(error)
    }
}