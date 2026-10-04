import { Category, Issue } from '../models/index.js'

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