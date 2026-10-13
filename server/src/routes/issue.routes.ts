import { Router } from 'express'
import { createUserIssue, listUserIssues, getUserIssue, listIssueCategories } from '../controllers/issue.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireUser } from '../middleware/user.middleware.js'

export const issueRouter = Router()

issueRouter.use(requireAuth)
issueRouter.use(requireUser)

issueRouter.post('/', createUserIssue)
issueRouter.get('/', listUserIssues)
issueRouter.get('/categories', listIssueCategories)
issueRouter.get('/:id', getUserIssue)
