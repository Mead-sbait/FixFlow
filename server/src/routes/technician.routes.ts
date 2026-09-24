import { Router } from 'express'
import { getTechnicianIssue, getTechnicianIssues, updateTechnicianStatus } from '../controllers/technician.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireTechnician } from '../middleware/technician.middleware.js'

export const technicianRouter = Router()

technicianRouter.use(requireAuth)
technicianRouter.use(requireTechnician)

technicianRouter.get('/issues', getTechnicianIssues)
technicianRouter.get('/issues/:id', getTechnicianIssue)
technicianRouter.patch('/issues/:id/status', updateTechnicianStatus)