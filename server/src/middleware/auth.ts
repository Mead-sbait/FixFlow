import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { isValidObjectId } from 'mongoose'
import { env } from '../config/env.js'
import { ApiError } from '../lib/errors.js'

export type AuthSession = {
  userId: string
  role: 'user' | 'technician' | 'admin'
}

export type AuthenticatedRequest = Request & { auth?: AuthSession }

const isRole = (value: unknown): value is AuthSession['role'] =>
  value === 'user' || value === 'technician' || value === 'admin'

export function decodeAdminSession(authorization: string | undefined, secret = env.jwtSecret): AuthSession {
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication is required', 'UNAUTHORIZED')
  }

  if (!secret) throw new ApiError(500, 'Authentication is not configured', 'AUTH_NOT_CONFIGURED')

  const token = authorization.slice('Bearer '.length).trim()
  let payload: string | JwtPayload

  try {
    payload = jwt.verify(token, secret)
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired', 'UNAUTHORIZED')
  }

  if (typeof payload === 'string' || typeof payload.sub !== 'string' || !isValidObjectId(payload.sub) || !isRole(payload.role)) {
    throw new ApiError(401, 'Your session does not contain a valid account', 'UNAUTHORIZED')
  }

  if (payload.role !== 'admin') {
    throw new ApiError(403, 'Administrator access is required', 'FORBIDDEN')
  }

  return { userId: payload.sub, role: payload.role }
}

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    req.auth = decodeAdminSession(req.header('authorization'))
    next()
  } catch (error) {
    next(error)
  }
}
