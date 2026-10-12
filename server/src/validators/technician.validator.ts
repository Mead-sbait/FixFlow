import { z } from 'zod'

export const updateTechnicianStatusSchema = z.object({
    status: z.enum(['in_progress', 'completed']),
}).strict()

export const createTechnicianCommentSchema = z.object({
    message: z.string().trim().min(1).max(2000),
    isInternal: z.boolean().default(false),
}).strict()