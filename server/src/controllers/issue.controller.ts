import type { Request, Response } from 'express'
import { createIssueSchema } from '../validators/issue.validator.js'
import { createIssue, getUserIssues, getUserIssueById } from '../services/issue.service.js'

export async function createUserIssue(req: Request, res: Response) {
  const reporterId = res.locals.auth?.userId

  if (!reporterId) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    })
    return
  }

  const validation = createIssueSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: 'Invalid issue data',
      code: 'VALIDATION_ERROR',
    })
    return
  }

  try {
    const result = await createIssue(reporterId, validation.data)

    if (result.type === 'invalid_category') {
      res.status(400).json({
        error: 'Category does not exist',
        code: 'INVALID_CATEGORY',
      })
      return
    }

    res.status(201).json(result.issue)
  } catch {
    res.status(500).json({
      error: 'Unable to create issue',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function listUserIssues(_req: Request, res: Response) {
  const reporterId = res.locals.auth?.userId

  if (!reporterId) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const issues = await getUserIssues(reporterId)
    res.status(200).json(issues)
  } catch {
    res.status(500).json({ error: 'Unable to load issues', code: 'INTERNAL_ERROR' })
  }
}

export async function getUserIssue(req: Request<{ id: string }>, res: Response) {
  const reporterId = res.locals.auth?.userId

  if (!reporterId) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const issue = await getUserIssueById(reporterId, req.params.id)

    if (!issue) {
      res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' })
      return
    }

    res.status(200).json(issue)
  } catch {
    res.status(500).json({ error: 'Unable to load issue', code: 'INTERNAL_ERROR' })
  }
}
