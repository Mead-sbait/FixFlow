
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '../../app/store'

import { fetchNotifications } from './notificationSlice'

import {
    commentEventReceived,
    fetchTechnicianIssue,
    fetchTechnicianIssues,
} from '../technician/technicianSlice'

type IssueEvent = {
    issueId?: string
    id?: string
}

type CommentEvent = {
    issueId: string
}

export function useRealtimeSocket()
{
    const dispatch = useDispatch<AppDispatch>()

    const token = useSelector(
        (state: RootState) => state.auth.token
    )

    const role = useSelector(
        (state: RootState) => state.auth.user?.role
    )

    const selectedIssueId = useSelector(
        (state: RootState) => state.technician.selectedIssue?.id
    )

    const selectedIssueIdRef = useRef(selectedIssueId)

    selectedIssueIdRef.current = selectedIssueId

    useEffect(() => {
        if (!token)
        {
            return
        }

        const socket = io(
            import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000',
            {
                auth: {
                    token,
                },
            }
        )

        // Refresh notifications from the API
        const refreshNotifications = () => {
            void dispatch(fetchNotifications(token))
        }

        // Refresh technician issues
        const refreshIssues = (payload?: IssueEvent) => {
            if (role !== 'technician')
            {
                return
            }

            void dispatch(fetchTechnicianIssues(token))

            const changedIssueId = payload?.issueId ?? payload?.id
            const currentIssueId = selectedIssueIdRef.current

            if (
                currentIssueId &&
                (!changedIssueId || currentIssueId === changedIssueId)
            )
            {
                void dispatch(
                    fetchTechnicianIssue({
                        token,
                        issueId: currentIssueId,
                    })
                )
            }
        }

        // Reload comments for the affected issue
        const onCommentAdded = (payload: CommentEvent) => {
            if (typeof payload?.issueId === 'string')
            {
                dispatch(commentEventReceived(payload.issueId))
            }
        }

        // Restore data after connecting or reconnecting
        const onConnect = () => {
            refreshNotifications()
            refreshIssues()
        }

        // Socket listeners
        socket.on('connect', onConnect)
        socket.on('notification:new', refreshNotifications)
        socket.on('issue:assigned', refreshIssues)
        socket.on('issue:updated', refreshIssues)
        socket.on('comment:added', onCommentAdded)

        // Disconnect when the session changes or the app unmounts
        return () => {
            socket.off('connect', onConnect)
            socket.off('notification:new', refreshNotifications)
            socket.off('issue:assigned', refreshIssues)
            socket.off('issue:updated', refreshIssues)
            socket.off('comment:added', onCommentAdded)

            socket.disconnect()
        }
    }, [token, role, dispatch])
}
