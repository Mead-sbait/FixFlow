import { isValidObjectId } from 'mongoose'
import { Category, Comment, Issue } from '../models/index.js'
import { createNotification } from './notification.service.js'
import { emitToUser, emitToAdmins } from '../sockets/emitter.js'

type CreateIssueInput = {
  title: string
  description: string
  location: string
  categoryId: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export async function createIssue(
  reporterId: string,
  input: CreateIssueInput
) {
  const category = await Category.findById(input.categoryId)
    .select('_id')

  if (!category) {
    return { type: 'invalid_category' } as const
  }

  const issue = await Issue.create({
    title: input.title,
    description: input.description,
    location: input.location,
    categoryId: category._id,
    priority: input.priority,
    reporterId,
    status: 'open',

  })

  // admins watching the queue get the new issue without refreshing
  emitToAdmins('issue:created', { issueId: issue._id.toString() })

  return { type: 'created', issue: issue.toJSON() } as const
}

export async function getUserIssues(reporterId: string) {
  const issues = await Issue.find({ reporterId })
    .sort({ createdAt: -1, _id: -1 })

  return issues.map((issue) => issue.toJSON())
}

export async function getUserIssueById(reporterId: string, issueId: string) {
  if (!isValidObjectId(issueId)) return null

  const issue = await Issue.findOne({ _id: issueId, reporterId })
  return issue ? issue.toJSON() : null
}

// Ownership and visibility are enforced in the database query, not just in the UI.
export async function getUserIssueComments(reporterId: string, issueId: string) {
  if (!isValidObjectId(issueId)) return null
  if (!await Issue.exists({ _id: issueId, reporterId })) return null
  const comments = await Comment.find({ issueId, isInternal: false })
    .populate('userId', 'name role')
    .sort({ createdAt: 1, _id: 1 })
  return comments.map(comment => {
    const data = comment.toJSON() as unknown as {
      id: string; userId: { id: string; name: string; role: string } | null;
      message: string; createdAt: Date
    }
    return { id: data.id, issueId, author: data.userId, message: data.message, isInternal: false, createdAt: data.createdAt }
  })
}

export async function createUserIssueComment(reporterId: string, issueId: string, message: string) {
  if (!isValidObjectId(issueId)) return null
  const issue = await Issue.findOne({ _id: issueId, reporterId }).select('technicianId')
  if (!issue) return null
  const comment = await Comment.create({ issueId, userId: reporterId, message, isInternal: false })
  const saved = await Comment.findById(comment._id).populate('userId', 'name role')
  if (!saved) throw new Error('Comment not found after creation')
  const data = saved.toJSON() as unknown as { id: string; userId: { id: string; name: string; role: string } | null; message: string; createdAt: Date }
  emitToUser(reporterId, 'comment:added', { issueId })
  emitToAdmins('comment:added', { issueId })
  if (issue.technicianId) {
    const technicianId = issue.technicianId.toString()
    emitToUser(technicianId, 'comment:added', { issueId })
    try {
      await createNotification({ userId: technicianId, issueId, type: 'comment_added', message: 'A new comment was added to your issue.' })
    } catch (error) { console.error('Comment saved, but notification creation failed:', error) }
  }
  return { id: data.id, issueId, author: data.userId, message: data.message, isInternal: false, createdAt: data.createdAt }
}
