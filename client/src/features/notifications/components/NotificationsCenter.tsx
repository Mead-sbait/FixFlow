import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '../../../app/store'
import { Icon } from '../../../components/Icon'
import { useT } from '../../../i18n'
import { formatDate } from '../../../lib/roles'

import {
    fetchNotifications,
    markNotificationAsRead,
} from '../notificationSlice'

export function NotificationsCenter()
{
    const dispatch = useDispatch<AppDispatch>()
    const { t, locale, errorMessage, notification: notificationText } = useT()
    const [isOpen, setIsOpen] = useState(false)
    const root = useRef<HTMLDivElement>(null)

    const token = useSelector((state: RootState) => state.auth.token)
    const role = useSelector((state: RootState) => state.auth.user?.role)
    const { items, loading, error, markingRequests } = useSelector((state: RootState) => state.notifications)

    const unreadCount = items.filter((notification) => !notification.isRead).length

    useEffect(() => {
        if (token)
        {
            void dispatch(fetchNotifications(token))
        }
    }, [dispatch, token])

    // close when clicking outside or pressing escape
    useEffect(() => {
        if (!isOpen) return
        const onClick = (event: MouseEvent) => {
            if (root.current && !root.current.contains(event.target as Node)) setIsOpen(false)
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [isOpen])

    const handleMarkAsRead = (notificationId: string) => {
        if (!token) return
        void dispatch(markNotificationAsRead({ token, notificationId }))
    }

    // where "view issue" should go depends on who is looking
    const issueLink = (issueId: string) => {
        if (role === 'technician') return `/technician/issues/${issueId}`
        if (role === 'admin') return '/admin'
        return `/issues/${issueId}`
    }

    if (!token)
    {
        return null
    }

    return (
        <div className="notif" ref={root}>
            <button
                type="button"
                className="icon-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('notif.label', { count: unreadCount })}
                aria-expanded={isOpen}
                aria-controls="notifications-panel"
            >
                <Icon name="bell" size={18} />
                {unreadCount > 0 && <span className="icon-button__count">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div id="notifications-panel" className="notif__panel" role="dialog" aria-label={t('notif.title')}>
                    <div className="notif__head">
                        <h2>{t('notif.title')}</h2>
                        <button type="button" className="icon-button" onClick={() => setIsOpen(false)} aria-label={t('common.close')}>
                            <Icon name="x" size={16} />
                        </button>
                    </div>

                    {error && (
                        <div className="notice notice--error" role="alert" style={{ margin: 12 }}>
                            <Icon name="alert" size={16} />{errorMessage(error)}
                        </div>
                    )}

                    {loading && items.length === 0 && <p className="notif__empty">{t('common.loading')}</p>}

                    {!loading && items.length === 0 && (
                        <p className="notif__empty">{t('notif.empty')}</p>
                    )}

                    {items.length > 0 && (
                        <div className="notif__list">
                            {items.map((notification) => (
                                <article
                                    key={notification.id}
                                    className={notification.isRead ? 'notif__item' : 'notif__item notif__item--unread'}
                                >
                                    <div className="row">
                                        <Icon name={notification.type.includes('cancel') ? 'ban' : notification.type.includes('comment') ? 'note' : 'pin'} size={16} />
                                        <time dateTime={notification.createdAt}>{formatDate(notification.createdAt, locale, true)}</time>
                                        {!notification.isRead && <span className="tag tag--assigned">{t('notif.new')}</span>}
                                    </div>

                                    <p>{notificationText(notification)}</p>

                                    <div className="row">
                                        {notification.issueId && (
                                            <Link to={issueLink(notification.issueId)} onClick={() => setIsOpen(false)} className="notif__link">
                                                {t('notif.view')}
                                            </Link>
                                        )}

                                        {!notification.isRead && (
                                            <button
                                                type="button"
                                                className="btn btn--ghost btn--sm notif__mark"
                                                disabled={Boolean(markingRequests[notification.id])}
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                {markingRequests[notification.id] ? t('notif.updating') : t('notif.markRead')}
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
