import { Category, Issue } from '../models/index.js'
import { isValidObjectId } from 'mongoose'

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
