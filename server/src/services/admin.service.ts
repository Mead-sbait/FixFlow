import mongoose, { isValidObjectId } from 'mongoose'
import { Category, Issue, IssueStatusHistory, Notification, User } from '../models/index.js'
import { emitToAdmins, emitToUser, syncRoleRooms } from '../sockets/emitter.js'
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

type AdminIssue = ReturnType<typeof toAdminIssue>

type PendingNotification = {
  userId: mongoose.Types.ObjectId
  issueId: mongoose.Types.ObjectId
  type: string
  message: string
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

function findIssueWithRefs(issueId: string) {
  return Issue.findById(issueId)
    .populate('reporterId', 'name email')
    .populate('technicianId', 'name email')
    .populate('categoryId', 'name')
}

// admins, the reporter and the technician (plus anyone extra, e.g. a technician who was just removed)
function emitIssueEvent(event: 'issue:assigned' | 'issue:updated', issue: AdminIssue, extraUserIds: string[] = []) {
  const payload = { issueId: issue.id }
  emitToAdmins(event, payload)

  const userIds = new Set(extraUserIds)
  if (issue.reporter) userIds.add(issue.reporter.id)
  if (issue.technician) userIds.add(issue.technician.id)

  for (const userId of userIds) {
    emitToUser(userId, event, payload)
  }
}

// notifications are written inside the transaction and only announced once it is committed
async function saveNotifications(pending: PendingNotification[], session: mongoose.ClientSession) {
  if (pending.length === 0) return []
  // mongoose needs ordered: true to insert more than one document inside a session
  const created = await Notification.create(pending.map((item) => ({ ...item, isRead: false })), { session, ordered: true })
  return created.map((notification) => ({
    userId: notification.userId.toString(),
    notificationId: notification._id.toString(),
  }))
}

function announceNotifications(saved: { userId: string; notificationId: string }[]) {
  for (const item of saved) {
    emitToUser(item.userId, 'notification:new', { notificationId: item.notificationId })
  }
}

// what status an admin request ends up in, or null if the change is not allowed
export function resolveAdminStatus(
  current: AdminIssueData['status'],
  requested: 'open' | 'cancelled',
  hasTechnician: boolean
): AdminIssueData['status'] | null {
  if (requested === 'cancelled') {
    return closedStatuses.includes(current) ? null : 'cancelled'
  }

  // reopen: only from a closed state, and keep the technician if there was one
  if (!closedStatuses.includes(current)) return null
  return hasTechnician ? 'assigned' : 'open'
}

export function buildIssueFilter(query: IssueListQuery) {
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
  let saved: { userId: string; notificationId: string }[] = []
  let previousTechnicianId: string | null = null
  let changed = false

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

    if (issue.technicianId && issue.technicianId.equals(technician._id)) {
      // already assigned to this technician, nothing to do
      await session.abortTransaction()
    } else {
      changed = true
      const previousStatus = issue.status
      const previous = issue.technicianId
      previousTechnicianId = previous ? previous.toString() : null

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

      const pending: PendingNotification[] = [
        {
          userId: technician._id,
          issueId: issue._id,
          type: 'issue_assigned',
          message: `You have been assigned to "${issue.title}"`,
        },
      ]

      // the technician who had it before should know it moved
      if (previous) {
        pending.push({
          userId: previous,
          issueId: issue._id,
          type: 'issue_unassigned',
          message: `"${issue.title}" was reassigned to ${technician.name}`,
        })
      }

      saved = await saveNotifications(pending, session)
      await session.commitTransaction()
    }
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction()
    }
    throw error
  } finally {
    await session.endSession()
  }

  const updated = await findIssueWithRefs(issueId)

  if (!updated) {
    return { type: 'not_found' } as const
  }

  const result = toAdminIssue(updated)

  // only emit after the transaction is committed
  if (changed) {
    emitIssueEvent('issue:assigned', result, previousTechnicianId ? [previousTechnicianId] : [])
    announceNotifications(saved)
  }

  return { type: 'assigned', issue: result } as const
}

export async function updatePriority(issueId: string, priority: AdminIssueData['priority']) {
  if (!isValidObjectId(issueId)) {
    return { type: 'not_found' } as const
  }

  const issue = await findIssueWithRefs(issueId)

  if (!issue) {
    return { type: 'not_found' } as const
  }

  // the frontend disables this for closed issues, the backend has to refuse it too
  if (closedStatuses.includes(issue.status)) {
    return { type: 'closed', status: issue.status } as const
  }

  if (issue.priority !== priority) {
    issue.priority = priority
    await issue.save()
  }

  const result = toAdminIssue(issue)
  emitIssueEvent('issue:updated', result)

  return { type: 'updated', issue: result } as const
}

export async function updateStatus(adminId: string, issueId: string, requested: 'open' | 'cancelled') {
  if (!isValidObjectId(issueId)) {
    return { type: 'not_found' } as const
  }

  const session = await mongoose.startSession()
  let saved: { userId: string; notificationId: string }[] = []

  try {
    session.startTransaction()

    const issue = await Issue.findById(issueId).session(session)

    if (!issue) {
      await session.abortTransaction()
      return { type: 'not_found' } as const
    }

    const nextStatus = resolveAdminStatus(issue.status, requested, Boolean(issue.technicianId))

    if (!nextStatus) {
      await session.abortTransaction()
      return { type: 'invalid_transition', currentStatus: issue.status } as const
    }

    const previousStatus = issue.status
    issue.status = nextStatus
    await issue.save({ session })

    await IssueStatusHistory.create(
      [
        {
          issueId: issue._id,
          changedBy: adminId,
          fromStatus: previousStatus,
          toStatus: nextStatus,
        },
      ],
      { session }
    )

    const word = requested === 'cancelled' ? 'cancelled' : 'reopened'
    const pending: PendingNotification[] = [
      {
        userId: issue.reporterId,
        issueId: issue._id,
        type: `issue_${word}`,
        message: `Your issue "${issue.title}" was ${word}`,
      },
    ]

    if (issue.technicianId) {
      pending.push({
        userId: issue.technicianId,
        issueId: issue._id,
        type: `issue_${word}`,
        message: `"${issue.title}" was ${word} by an admin`,
      })
    }

    saved = await saveNotifications(pending, session)
    await session.commitTransaction()
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction()
    }
    throw error
  } finally {
    await session.endSession()
  }

  const updated = await findIssueWithRefs(issueId)

  if (!updated) {
    return { type: 'not_found' } as const
  }

  const result = toAdminIssue(updated)
  emitIssueEvent('issue:updated', result)
  announceNotifications(saved)

  return { type: 'updated', issue: result } as const
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

  // if they are connected right now, move them in or out of the admins room immediately
  syncRoleRooms(userId, role)

  return { type: 'updated', user: user.toJSON() } as const
}
