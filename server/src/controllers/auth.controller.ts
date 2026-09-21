import type { Request, Response } from 'express'
import { registerSchema } from '../validators/auth.validator.js'
import { registerUser } from '../services/auth.service.js'

export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      error: 'Invalid registration data',
      code: 'VALIDATION_ERROR',
    })
    return
  }

  try {
    const user = await registerUser(result.data)
    res.status(201).json(user)
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        error: 'Email is already registered',
        code: 'EMAIL_ALREADY_EXISTS',
      })
      return
    }

    res.status(500).json({
      error: 'Unable to create account',
      code: 'INTERNAL_ERROR',
    })
  }
}