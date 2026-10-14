
import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { issueRouter } from './issue.routes.js'
import { technicianRouter } from './technician.routes.js'
import { notificationRouter } from './notification.routes.js'

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) =>
    res.json({ status: 'ok', service: 'fixflow-api' }),
)

apiRouter.use('/auth', authRouter)
apiRouter.use('/issues', issueRouter)
apiRouter.use('/technician', technicianRouter)
apiRouter.use('/notifications', notificationRouter)