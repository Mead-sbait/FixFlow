import { Router } from 'express'
import mongoose, { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { ApiError } from '../lib/errors.js'
import { requireAdmin, type AuthenticatedRequest } from '../middleware/auth.js'
import { Category, Issue, IssueStatusHistory, User, issueStatuses } from '../models/index.js'

export const adminRouter = Router()
adminRouter.use(requireAdmin)

const priorities = ['low', 'medium', 'high', 'urgent'] as const
const issueQuerySchema = z.object({
  status: z.enum(issueStatuses).optional(),
  priority: z.enum(priorities).optional(),
  categoryId: z.string().optional(),
  technicianId: z.string().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

const assignmentSchema = z.object({ technicianId: z.string().min(1) })
const prioritySchema = z.object({ priority: z.enum(priorities) })

type AdminIssueQuery = z.infer<typeof issueQuerySchema>

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseAdminIssueQuery(query: unknown): AdminIssueQuery {
  const result = issueQuerySchema.safeParse(query)
  if (!result.success) {
    throw new ApiError(400, 'Some issue filters are invalid', 'VALIDATION_ERROR', result.error.flatten())
  }
  return result.data
}

export function buildIssueFilter(query: AdminIssueQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {}

  if (query.status) filter.status = query.status
  if (query.priority) filter.priority = query.priority

  if (query.categoryId) {
    if (!isValidObjectId(query.categoryId)) throw new ApiError(400, 'Category filter is invalid', 'VALIDATION_ERROR')
    filter.categoryId = query.categoryId
  }

  if (query.technicianId === 'unassigned') {
    filter.technicianId = null
  } else if (query.technicianId) {
    if (!isValidObjectId(query.technicianId)) throw new ApiError(400, 'Technician filter is invalid', 'VALIDATION_ERROR')
    filter.technicianId = query.technicianId
  }

  if (query.search) {
    const text = new RegExp(escapeRegExp(query.search), 'i')
    filter.$or = [{ title: text }, { description: text }, { location: text }]
  }

  return filter
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function summarizeReference(value: unknown, fields: string[]) {
  const record = asRecord(value)
  if (!record) return null

  const summary: Record<string, unknown> = { id: String(record.id ?? record._id ?? '') }
  for (const field of fields) if (record[field] !== undefined) summary[field] = record[field]
  return summary
}

function serializeIssue(document: InstanceType<typeof Issue>) {
  const issue = document.toJSON() as Record<string, unknown>
  return {
    id: String(issue.id),
    title: issue.title,
    description: issue.description,
    location: issue.location,
    status: issue.status,
    priority: issue.priority,
    reporter: summarizeReference(issue.reporterId, ['name', 'email']),
    technician: summarizeReference(issue.technicianId, ['name', 'email']),
    category: summarizeReference(issue.categoryId, ['name']),
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt
  }
}

function requireObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) throw new ApiError(400, `${label} is invalid`, 'VALIDATION_ERROR')
}

adminRouter.get('/issues', async (req, res, next) => {
  try {
    const query = parseAdminIssueQuery(req.query)
    const filter = buildIssueFilter(query)
    const skip = (query.page - 1) * query.limit

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate('reporterId', 'name email')
        .populate('technicianId', 'name email')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(query.limit),
      Issue.countDocuments(filter)
    ])

    res.json({
      items: issues.map(serializeIssue),
      pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) }
    })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/technicians', async (_req, res, next) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('name email').sort({ name: 1 })
    res.json({ items: technicians.map((technician) => technician.toJSON()) })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await Category.find().select('name').sort({ name: 1 })
    res.json({ items: categories.map((category) => category.toJSON()) })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const [total, open, assigned, inProgress, completed, urgent, unassigned] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'open' }),
      Issue.countDocuments({ status: 'assigned' }),
      Issue.countDocuments({ status: 'in_progress' }),
      Issue.countDocuments({ status: 'completed' }),
      Issue.countDocuments({ priority: 'urgent', status: { $nin: ['completed', 'cancelled'] } }),
      Issue.countDocuments({ technicianId: null, status: { $nin: ['completed', 'cancelled'] } })
    ])

    res.json({ total, open, assigned, inProgress, completed, urgent, unassigned })
  } catch (error) {
    next(error)
  }
})

adminRouter.patch('/issues/:id/assign', async (req, res, next) => {
  try {
    requireObjectId(req.params.id, 'Issue id')
    const parsed = assignmentSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new ApiError(400, 'A valid technician is required', 'VALIDATION_ERROR')
    }
    requireObjectId(parsed.data.technicianId, 'Technician id')
    const adminId = (req as AuthenticatedRequest).auth?.userId
    if (!adminId) throw new ApiError(401, 'Authentication is required', 'UNAUTHORIZED')

    const session = await mongoose.startSession()
    let updatedIssueId: string | null = null
    try {
      await session.withTransaction(async () => {
        const [issue, technician] = await Promise.all([
          Issue.findById(req.params.id).session(session),
          User.findOne({ _id: parsed.data.technicianId, role: 'technician' }).session(session)
        ])

        if (!issue) throw new ApiError(404, 'Issue not found', 'NOT_FOUND')
        if (!technician) throw new ApiError(400, 'The selected account is not a technician', 'VALIDATION_ERROR')

        const previousStatus = issue.status
        issue.technicianId = technician._id
        if (issue.status === 'open') issue.status = 'assigned'
        await issue.save({ session })

        if (previousStatus !== issue.status) {
          await IssueStatusHistory.create([{
            issueId: issue._id,
            changedBy: adminId,
            fromStatus: previousStatus,
            toStatus: issue.status
          }], { session })
        }
        updatedIssueId = String(issue._id)
      })
    } finally {
      await session.endSession()
    }

    if (!updatedIssueId) throw new ApiError(500, 'The assignment could not be completed', 'ASSIGNMENT_FAILED')
    const populated = await Issue.findById(updatedIssueId)
      .populate('reporterId', 'name email')
      .populate('technicianId', 'name email')
      .populate('categoryId', 'name')

    if (!populated) throw new ApiError(404, 'Issue not found after assignment', 'NOT_FOUND')
    res.json({ issue: serializeIssue(populated) })
  } catch (error) {
    next(error)
  }
})

adminRouter.patch('/issues/:id/priority', async (req, res, next) => {
  try {
    requireObjectId(req.params.id, 'Issue id')
    const parsed = prioritySchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'Priority is invalid', 'VALIDATION_ERROR', parsed.error.flatten())

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { priority: parsed.data.priority },
      { new: true, runValidators: true }
    )
      .populate('reporterId', 'name email')
      .populate('technicianId', 'name email')
      .populate('categoryId', 'name')

    if (!issue) throw new ApiError(404, 'Issue not found', 'NOT_FOUND')
    res.json({ issue: serializeIssue(issue) })
  } catch (error) {
    next(error)
  }
})
