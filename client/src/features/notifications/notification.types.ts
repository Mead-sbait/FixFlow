
export interface NotificationItem
{
    id: string
    userId: string
    issueId?: string | null
    type: string
    message: string
    isRead: boolean
    createdAt: string
    updatedAt: string
}
