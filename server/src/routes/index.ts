import { Router } from 'express'
import { adminRouter } from './admin.routes.js'
import { authRouter } from './auth.routes.js'
import { categoryRouter } from './category.routes.js'

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'fixflow-api' }),
)

apiRouter.use('/auth', authRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/categories', categoryRouter)
