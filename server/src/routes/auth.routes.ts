import { Router } from 'express'
import { login, register } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { User } from '../models/index.js'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)

authRouter.get('/me', requireAuth, async (_req, res) => {
  try {
    const user = await User.findById(res.locals.auth.userId)
      .select('name email role')

    if (!user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      })
      return
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch {
    res.status(500).json({
      error: 'Unable to fetch user',
      code: 'INTERNAL_ERROR',
    })
  }
})