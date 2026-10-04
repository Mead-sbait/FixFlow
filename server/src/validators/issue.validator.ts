import { z } from 'zod'

export const createIssueSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  location: z.string().trim().min(1).max(200),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
}).strict()