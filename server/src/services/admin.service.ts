import mongoose, { isValidObjectId } from 'mongoose'
import { Category, Issue, IssueStatusHistory, Notification, User } from '../models/index.js'
import { emitIssueAssigned, emitIssueUpdated } from '../sockets/index.js'
import type { IssueListQuery, UserListQuery } from '../validators/admin.validator.js'

type PersonRef = {
  id: string
  name: string
  email: string
} | null

type AdminIssueData = {
  id: string
  title: string
  description: string
  location: string
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reporterId: PersonRef
  technicianId: PersonRef
  categoryId: { id: string; name: string } | null
  createdAt: Date
  updatedAt: Date
}

const closedStatuses: AdminIssueData['status'][] = ['completed', 'cancelled']

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toAdminIssue(issue: InstanceType<typeof Issue>) {
  const data = issue.toJSON() as unknown as AdminIssueData

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    location: data.location,
    status: data.status,
    priority: data.priority,
    reporter: data.reporterId,
    technician: data.technicianId,
    category: data.categoryId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function buildIssueFilter(query: IssueListQuery) {
  const filter: Record<string, unknown> = {}

  if (query.status) filter.status = query.status
  if (query.priority) filter.priority = query.priority
  if (query.categoryId) filter.categoryId = query.categoryId

  if (query.technicianId === 'unassigned') {
    filter.technicianId = null
  } else if (query.technicianId) {
    filter.technicianId = query.technicianId
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i')
    filter.$or = [{ title: regex }, { description: regex }, { location: regex }]
  }

  return filter
}

export async function listIssues(query: IssueListQuery) {
  const filter = buildIssueFilter(query)
  const skip = (query.page - 1) * query.limit

  const [issues, total] = await Promise.all([
    Issue.find(filter)
      .populate('reporterId', 'name email')
      .populate('technicianId', 'name email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    Issue.countDocuments(filter),
  ])

  return {
    items: issues.map(toAdminIssue),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  }
}

export async function listTechnicians() {
  const technicians = await User.find({ role: 'technician' })
    .select('name email')
    .sort({ name: 1 })

  return technicians.map((technician) => technician.toJSON())
}

export async function getStats() {
  const active = { status: { $nin: closedStatuses } }

  const [statusGroups, urgent, unassigned, categoryGroups, technicianGroups] = await Promise.all([
    Issue.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Issue.countDocuments({ priority: 'urgent', ...active }),
    Issue.countDocuments({ technicianId: null, ...active }),
    Issue.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]),
    Issue.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { technicianId: { $ne: null }, ...active } },
      { $group: { _id: '$technicianId', count: { $sum: 1 } } },
    ]),
  ])

  const byStatus: Record<string, number> = {}
  for (const group of statusGroups) {
    byStatus[group._id] = group.count
  }

  // look the names up separately, simpler than a $lookup pipeline
  const [categories, technicians] = await Promise.all([
    Category.find({ _id: { $in: categoryGroups.map((group) => group._id) } }).select('name'),
    User.find({ _id: { $in: technicianGroups.map((group) => group._id) } }).select('name'),
  ])

  const byCategory = categoryGroups
    .map((group) => ({
      id: group._id.toString(),
      name: categories.find((category) => category._id.equals(group._id))?.name ?? 'Unknown',
      count: group.count,
    }))
    .sort((a, b) => b.count - a.count)

  const byTechnician = technicianGroups
    .map((group) => ({
      id: group._id.toString(),
      name: technicians.find((technician) => technician._id.equals(group._id))?.name ?? 'Unknown',
      count: group.count,
    }))
    .sort((a, b) => b.count - a.count)

  const total = statusGroups.reduce((sum, group) => sum + group.count, 0)

  return {
    total,
    open: byStatus.open ?? 0,
    assigned: byStatus.assigned ?? 0,
    inProgress: byStatus.in_progress ?? 0,
    completed: byStatus.completed ?? 0,
    cancelled: byStatus.cancelled ?? 0,
    urgent,
    unassigned,
    byCategory,
    byTechnician,
  }
}

export async function assignTechnician(adminId: string, issueId: string, technicianId: string) {
  if (!isValidObjectId(issueId)) {
    return { type: 'not_found' } as const
  }

  const technician = await User.findOne({ _id: technicianId, role: 'technician' }).select('name')

  if (!technician) {
    return { type: 'invalid_technician' } as const
  }

  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    const issue = await Issue.findById(issueId).session(session)

    if (!issue) {
      await session.abortTransaction()
      return { type: 'not_found' } as const
    }

    if (closedStatuses.includes(issue.status)) {
      await session.abortTransaction()
      return { type: 'closed', status: issue.status } as const
    }

    const previousStatus = issue.status

    issue.technicianId = technician._id
    if (issue.status === 'open') {
      issue.status = 'assigned'
    }

    await issue.save({ session })

    if (previousStatus !== issue.status) {
      await IssueStatusHistory.create(
        [
          {
            issueId: issue._id,
            changedBy: adminId,
            fromStatus: previousStatus,
            toStatus: issue.status,
          },
        ],
        { session }
      )
    }

    await Notification.create(
      [
        {
          userId: technician._id,
          issueId: issue._id,
          type: 'issue_assigned',
          message: `You have been assigned to "${issue.title}"`,
        },
      ],
      { session }
    )

    await session.commitTransaction()
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction()
    }
    throw error
  } finally {
    await session.endSession()
  }

  const updated = await Issue.findById(issueId)
    .populate('reporterId', 'name email')
    .populate('technicianId', 'name email')
    .populate('categoryId', 'name')

  if (!updated) {
    return { type: 'not_found' } as const
  }

  const result = toAdminIssue(updated)

  // only emit after the transaction is committed
  emitIssueAssigned(result)

  return { type: 'assigned', issue: result } as const
}

export async function updatePriority(issueId: string, priority: AdminIssueData['priority']) {
  if (!isValidObjectId(issueId)) {
    return null
  }

  const issue = await Issue.findByIdAndUpdate(
    issueId,
    { priority },
    { new: true, runValidators: true }
  )
    .populate('reporterId', 'name email')
    .populate('technicianId', 'name email')
    .populate('categoryId', 'name')

  if (!issue) {
    return null
  }

  const result = toAdminIssue(issue)
  emitIssueUpdated(result)

  return result
}

export async function listUsers(query: UserListQuery) {
  const filter: Record<string, unknown> = {}

  if (query.role) filter.role = query.role

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i')
    filter.$or = [{ name: regex }, { email: regex }]
  }

  const users = await User.find(filter)
    .select('name email role createdAt')
    .sort({ createdAt: -1 })

  return users.map((user) => user.toJSON())
}

export async function updateUserRole(adminId: string, userId: string, role: 'user' | 'technician' | 'admin') {
  if (!isValidObjectId(userId)) {
    return { type: 'not_found' } as const
  }

  if (userId === adminId) {
    return { type: 'own_account' } as const
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  ).select('name email role createdAt')

  if (!user) {
    return { type: 'not_found' } as const
  }

  return { type: 'updated', user: user.toJSON() } as const
}
