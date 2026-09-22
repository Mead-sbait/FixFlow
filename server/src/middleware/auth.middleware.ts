import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.get('Authorization')
  const match = authorization?.match(/^Bearer (\S+)$/i)

  if (!match) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    })
    return
  }

  if (!env.jwtSecret) {
    res.status(500).json({
      error: 'Authentication is unavailable',
      code: 'INTERNAL_ERROR',
    })
    return
  }

  try {
    const payload = jwt.verify(match[1], env.jwtSecret, {
      algorithms: ['HS256'],
    })

    if (
      typeof payload === 'string' ||
      typeof payload.sub !== 'string' ||
      !/^[a-f\d]{24}$/i.test(payload.sub) ||
      typeof payload.exp !== 'number'
    ) {
      throw new Error('Invalid token')
    }

    res.locals.auth = { userId: payload.sub }
  } catch {
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    })
    return
  }

  next()
}