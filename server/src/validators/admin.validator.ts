import { z } from 'zod'
import { issueStatuses } from '../models/index.js'

const objectId = z.string().regex(/^[a-f\d]{24}$/i)
const roles = ['user', 'technician', 'admin'] as const

export const priorities = ['low', 'medium', 'high', 'urgent'] as const

export const issueListQuerySchema = z.object({
  status: z.enum(issueStatuses).optional(),
  priority: z.enum(priorities).optional(),
  categoryId: objectId.optional(),
  // "unassigned" lets the admin filter issues that have no technician yet
  technicianId: z.union([objectId, z.literal('unassigned')]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const assignTechnicianSchema = z.object({
  technicianId: objectId,
}).strict()

export const updatePrioritySchema = z.object({
  priority: z.enum(priorities),
}).strict()

export const userListQuerySchema = z.object({
  role: z.enum(roles).optional(),
  search: z.string().trim().max(100).optional(),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(roles),
}).strict()

export type IssueListQuery = z.infer<typeof issueListQuerySchema>
export type UserListQuery = z.infer<typeof userListQuerySchema>
