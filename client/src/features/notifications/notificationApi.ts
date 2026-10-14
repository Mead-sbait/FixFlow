
import { api } from '../../lib/api'
import type { NotificationItem } from './notification.types'

// Get notifications
export async function getNotifications(token: string)
{
    const response = await api.get<NotificationItem[]>(
        '/notifications',
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

    return response.data
}

// Mark notification as read
export async function markNotificationRead(
    token: string,
    notificationId: string
)
{
    const response = await api.patch<NotificationItem>(
        `/notifications/${notificationId}/read`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

    return response.data
}
