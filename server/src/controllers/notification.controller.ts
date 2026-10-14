
import type { Request, Response } from 'express'

import {
    getUserNotifications,
    markNotificationAsRead,
} from '../services/notification.service.js'

// Get notifications for the logged-in user
export async function getNotifications(
    _req: Request,
    res: Response
)
{
    try
    {
        const userId = res.locals.auth.userId

        const notifications = await getUserNotifications(userId)

        res.status(200).json(notifications)
    }
    catch
    {
        res.status(500).json({
            error: 'Unable to load notifications',
            code: 'INTERNAL_ERROR',
        })
    }
}

// Mark a notification as read
export async function readNotification(
    req: Request<{ id: string }>,
    res: Response
)
{
    try
    {
        const userId = res.locals.auth.userId
        const notificationId = req.params.id

        const notification = await markNotificationAsRead(
            userId,
            notificationId
        )

        if (!notification)
        {
            res.status(404).json({
                error: 'Notification not found',
                code: 'NOT_FOUND',
            })

            return
        }

        res.status(200).json(notification)
    }
    catch
    {
        res.status(500).json({
            error: 'Unable to update notification',
            code: 'INTERNAL_ERROR',
        })
    }
}
