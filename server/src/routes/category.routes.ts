import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { Category } from '../models/index.js'

export const categoryRouter = Router()

// any logged in user needs the category list (issue form, admin filters)
categoryRouter.get('/', requireAuth, async (_req, res) => {
  try {
    const categories = await Category.find().select('name').sort({ name: 1 })
    res.json(categories)
  } catch {
    res.status(500).json({
      error: 'Unable to load categories',
      code: 'INTERNAL_ERROR',
    })
  }
})
