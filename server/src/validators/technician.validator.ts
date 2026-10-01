import { z } from 'zod'

export const updateTechnicianStatusSchema = z.object({
    status: z.enum(['in_progress', 'completed']),
}).strict()