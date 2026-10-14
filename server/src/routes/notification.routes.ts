
import { Router } from 'express'

import {
    getNotifications,
    readNotification,
} from '../controllers/notification.controller.js'

import { requireAuth } from '../middleware/auth.middleware.js'

export const notificationRouter = Router()

// Require authentication for all notification routes
notificationRouter.use(requireAuth)

// Get user's notifications
notificationRouter.get('/', getNotifications)

// Mark a notification as read
notificationRouter.patch('/:id/read', readNotification)
