
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '../../../app/store'

import {
    fetchNotifications,
    markNotificationAsRead,
} from '../notificationSlice'

import '../notifications.css'

export function NotificationsCenter()
{
    const dispatch = useDispatch<AppDispatch>()
    const [isOpen, setIsOpen] = useState(false)

    const token = useSelector(
        (state: RootState) => state.auth.token
    )

    const role = useSelector(
        (state: RootState) => state.auth.user?.role
    )

    const {
        items,
        loading,
        error,
        markingRequests,
    } = useSelector(
        (state: RootState) => state.notifications
    )

    const unreadCount = items.filter(
        (notification) => !notification.isRead
    ).length

    useEffect(() => {
        if (token)
        {
            void dispatch(fetchNotifications(token))
        }
    }, [dispatch, token])

    const handleMarkAsRead = (notificationId: string) => {
        if (!token)
        {
            return
        }

        void dispatch(
            markNotificationAsRead({
                token,
                notificationId,
            })
        )
    }

    if (!token)
    {
        return null
    }

    return (
        <div className="notifications-center">
            <button
                type="button"
                className="notifications-center__trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={isOpen}
                aria-controls="notifications-panel"
            >
                <span aria-hidden="true">🔔</span>

                {unreadCount > 0 && (
                    <span className="notifications-center__count">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    id="notifications-panel"
                    className="notifications-center__panel"
                >
                    <div className="notifications-center__header">
                        <h2>Notifications</h2>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close notifications"
                        >
                            ✕
                        </button>
                    </div>

                    {error && (
                        <p
                            className="notifications-center__error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    {loading && (
                        <p>Loading notifications...</p>
                    )}

                    {!loading && items.length === 0 && (
                        <p className="notifications-center__empty">
                            No notifications yet.
                        </p>
                    )}

                    {!loading && items.length > 0 && (
                        <div className="notifications-center__list">
                            {items.map((notification) => (
                                <article
                                    key={notification.id}
                                    className={
                                        notification.isRead
                                            ? 'notifications-center__item'
                                            : 'notifications-center__item notifications-center__item--unread'
                                    }
                                >
                                    <div className="notifications-center__item-header">
                                        <strong>
                                            {notification.type.replace(/_/g, ' ')}
                                        </strong>

                                        {!notification.isRead && (
                                            <span className="notifications-center__unread">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    <p>{notification.message}</p>

                                    <small>
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </small>

                                    <div className="notifications-center__actions">
                                        {notification.issueId && role === 'technician' && (
                                            <Link
                                                to={`/technician/issues/${notification.issueId}`}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                View Issue
                                            </Link>
                                        )}

                                        {!notification.isRead && (
                                            <button
                                                type="button"
                                                disabled={
                                                    Boolean(
                                                        markingRequests[notification.id]
                                                    )
                                                }
                                                onClick={() =>
                                                    handleMarkAsRead(notification.id)
                                                }
                                            >
                                                {markingRequests[notification.id]
                                                    ? 'Updating...'
                                                    : 'Mark as Read'}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}