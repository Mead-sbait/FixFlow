import type { Request, Response, NextFunction } from 'express'
import { User } from '../models/index.js'

export async function requireUser(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = res.locals.auth?.userId

  if (!userId) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    })
    return
  }

  try {
    const user = await User.findById(userId).select('role')

    if (!user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      })
      return
    }

    if (user.role !== 'user') {
      res.status(403).json({
        error: 'User access required',
        code: 'FORBIDDEN',
      })
      return
    }
  } catch {
    res.status(500).json({
      error: 'Unable to verify account',
      code: 'INTERNAL_ERROR',
    })
    return
  }

  next()
}