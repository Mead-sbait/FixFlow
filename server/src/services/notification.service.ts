
import { isValidObjectId } from 'mongoose'
import { Notification } from '../models/index.js'
import { emitToUser } from '../sockets/emitter.js'

type NotificationType =
    | 'issue_assigned'
    | 'issue_updated'
    | 'comment_added'

type CreateNotificationData = {
    userId: string
    issueId?: string
    type: NotificationType
    message: string
}

// Create and send notification
export async function createNotification(data: CreateNotificationData)
{
    const notification = await Notification.create({
        userId: data.userId,
        issueId: data.issueId,
        type: data.type,
        message: data.message,
        isRead: false,
    })

    // Send notification after saving to MongoDB
    emitToUser(data.userId, 'notification:new', {
        notificationId: notification._id.toString(),
    })

    return notification.toJSON()
}

// Get notifications for a user
export async function getUserNotifications(userId: string)
{
    const notifications = await Notification.find({
        userId,
    })
        .sort({ createdAt: -1 })
        .limit(50)

    return notifications.map((notification) => notification.toJSON())
}

// Mark notification as read
export async function markNotificationAsRead(
    userId: string,
    notificationId: string
)
{
    if (!isValidObjectId(notificationId))
    {
        return null
    }

    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            userId,
        },
        {
            $set: { isRead: true },
        },
        {
            returnDocument: 'after',
        }
    )

    return notification ? notification.toJSON() : null
}
