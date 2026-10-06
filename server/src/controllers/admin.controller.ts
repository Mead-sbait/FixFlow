import type { Request, Response } from 'express'
import {
  assignTechnician,
  getStats as loadStats,
  listIssues,
  listTechnicians,
  listUsers,
  updatePriority,
  updateStatus,
  updateUserRole,
} from '../services/admin.service.js'
import {
  assignTechnicianSchema,
  issueListQuerySchema,
  updatePrioritySchema,
  updateStatusSchema,
  updateUserRoleSchema,
  userListQuerySchema,
} from '../validators/admin.validator.js'

export async function getIssues(req: Request, res: Response) {
  const validation = issueListQuerySchema.safeParse(req.query)

  if (!validation.success) {
    res.status(400).json({
      error: 'Invalid issue filters',
      code: 'VALIDATION_ERROR',
    })
    return
  }

  try {
    const result = await listIssues(validation.data)
    res.status(200).json(result)
  } catch {
    res.status(500).json({
      error: 'Unable to load issues',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function getTechnicians(_req: Request, res: Response) {
  try {
    const technicians = await listTechnicians()
    res.status(200).json(technicians)
  } catch {
    res.status(500).json({
      error: 'Unable to load technicians',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await loadStats()
    res.status(200).json(stats)
  } catch {
    res.status(500).json({
      error: 'Unable to load statistics',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function assignIssue(req: Request<{ id: string }>, res: Response) {
  const validation = assignTechnicianSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: 'A valid technician id is required',
      code: 'VALIDATION_ERROR',
    })
    return
  }

  try {
    const adminId = res.locals.auth.userId
    const result = await assignTechnician(adminId, req.params.id, validation.data.technicianId)

    if (result.type === 'not_found') {
      res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' })
      return
    }

    if (result.type === 'invalid_technician') {
      res.status(400).json({
        error: 'Selected user is not a technician',
        code: 'INVALID_TECHNICIAN',
      })
      return
    }

    if (result.type === 'closed') {
      res.status(409).json({
        error: `Cannot assign an issue that is ${result.status}`,
        code: 'CONFLICT',
      })
      return
    }

    res.status(200).json(result.issue)
  } catch {
    res.status(500).json({
      error: 'Unable to assign technician',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function changeIssuePriority(req: Request<{ id: string }>, res: Response) {
  const validation = updatePrioritySchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: 'Invalid priority',
      code: 'VALIDATION_ERROR',
    })
    return
  }

  try {
    const issue = await updatePriority(req.params.id, validation.data.priority)

    if (!issue) {
      res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' })
      return
    }

    res.status(200).json(issue)
  } catch {
    res.status(500).json({
      error: 'Unable to update priority',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function changeIssueStatus(req: Request<{ id: string }>, res: Response) {
  const validation = updateStatusSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: 'Invalid status',
      code: 'VALIDATION_ERROR',
    })
    return
  }

  try {
    const adminId = res.locals.auth.userId
    const result = await updateStatus(adminId, req.params.id, validation.data.status)

    if (result.type === 'not_found') {
      res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' })
      return
    }

    if (result.type === 'invalid_transition') {
      res.status(409).json({
        error: `Cannot change status from ${result.currentStatus} to ${validation.data.status}`,
        code: 'CONFLICT',
      })
      return
    }

    res.status(200).json(result.issue)
  } catch {
    res.status(500).json({
      error: 'Unable to update status',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function getUsers(req: Request, res: Response) {
  const validation = userListQuerySchema.safeParse(req.query)

  if (!validation.success) {
    res.status(400).json({
      error: 'Invalid user filters',
      code: 'VALIDATION_ERROR',
    })
    return
  }

  try {
    const users = await listUsers(validation.data)
    res.status(200).json(users)
  } catch {
    res.status(500).json({
      error: 'Unable to load users',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function changeUserRole(req: Request<{ id: string }>, res: Response) {
  const validation = updateUserRoleSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: 'Invalid role',
      code: 'VALIDATION_ERROR',
    })
    return
  }

  try {
    const adminId = res.locals.auth.userId
    const result = await updateUserRole(adminId, req.params.id, validation.data.role)

    if (result.type === 'not_found') {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' })
      return
    }

    if (result.type === 'own_account') {
      res.status(400).json({
        error: 'You cannot change your own role',
        code: 'OWN_ACCOUNT',
      })
      return
    }

    res.status(200).json(result.user)
  } catch {
    res.status(500).json({
      error: 'Unable to update role',
      code: 'INTERNAL_ERROR',
    })
  }
}
