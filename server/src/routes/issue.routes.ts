import { Router } from 'express'
import { createUserIssue } from '../controllers/issue.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireUser } from '../middleware/user.middleware.js'

export const issueRouter = Router()

issueRouter.use(requireAuth)
issueRouter.use(requireUser)

issueRouter.post('/', createUserIssue)