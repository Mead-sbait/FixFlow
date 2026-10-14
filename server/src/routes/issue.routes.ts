import { Router } from 'express'
import { addUserIssueComment, createUserIssue, listUserIssues, getUserIssue, listUserIssueComments } from '../controllers/issue.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireUser } from '../middleware/user.middleware.js'

export const issueRouter = Router()

issueRouter.use(requireAuth)
issueRouter.use(requireUser)

issueRouter.post('/', createUserIssue)
issueRouter.get('/', listUserIssues)
issueRouter.get('/:id', getUserIssue)

issueRouter.get('/:id/comments', listUserIssueComments)

issueRouter.post('/:id/comments', addUserIssueComment)
