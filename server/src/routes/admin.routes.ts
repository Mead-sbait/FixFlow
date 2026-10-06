import { Router } from 'express'
import {
  assignIssue,
  changeIssuePriority,
  changeUserRole,
  getIssues,
  getStats,
  getTechnicians,
  getUsers,
} from '../controllers/admin.controller.js'
import { requireAdmin } from '../middleware/admin.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'

export const adminRouter = Router()

adminRouter.use(requireAuth)
adminRouter.use(requireAdmin)

adminRouter.get('/issues', getIssues)
adminRouter.patch('/issues/:id/assign', assignIssue)
adminRouter.patch('/issues/:id/priority', changeIssuePriority)
adminRouter.get('/technicians', getTechnicians)
adminRouter.get('/stats', getStats)
adminRouter.get('/users', getUsers)
adminRouter.patch('/users/:id/role', changeUserRole)
