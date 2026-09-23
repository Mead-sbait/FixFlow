import { Router } from 'express'
import { getTechnicianIssues } from '../controllers/technician.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireTechnician } from '../middleware/technician.middleware.js'

export const technicianRouter = Router()

technicianRouter.use(requireAuth)
technicianRouter.use(requireTechnician)

technicianRouter.get('/issues', getTechnicianIssues)