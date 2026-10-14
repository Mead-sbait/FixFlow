
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { NotificationItem } from './notification.types'

import {
    getNotifications,
    markNotificationRead,
} from './notificationApi'

import { logout, setCredentials } from '../auth/authSlice'

type NotificationState = {
    items: NotificationItem[]
    loading: boolean
    error: string | null
    fetchRequestId: string | null
    markingRequests: Record<string, string>
}

const initialState: NotificationState = {
    items: [],
    loading: false,
    error: null,
    fetchRequestId: null,
    markingRequests: {},
}

// Fetch notifications
export const fetchNotifications = createAsyncThunk<
    NotificationItem[],
    string,
    { rejectValue: string }
>(
    'notifications/fetch',
    async (token, { rejectWithValue }) => {
        try
        {
            return await getNotifications(token)
        }
        catch
        {
            return rejectWithValue('Unable to load notifications')
        }
    }
)

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk<
    NotificationItem,
    { token: string; notificationId: string },
    { rejectValue: string }
>(
    'notifications/markRead',
    async ({ token, notificationId }, { rejectWithValue }) => {
        try
        {
            return await markNotificationRead(token, notificationId)
        }
        catch
        {
            return rejectWithValue('Unable to update notification')
        }
    }
)

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch - Pending
            .addCase(fetchNotifications.pending, (state, action) => {
                state.loading = true
                state.error = null
                state.fetchRequestId = action.meta.requestId
            })

            // Fetch - Success
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                if (state.fetchRequestId !== action.meta.requestId)
                {
                    return
                }

                // Preserve notifications already marked as read
                const readIds = new Set(
                    state.items
                        .filter((item) => item.isRead)
                        .map((item) => item.id)
                )

                state.loading = false
                state.fetchRequestId = null

                state.items = action.payload.map((item) => ({
                    ...item,
                    isRead: item.isRead || readIds.has(item.id),
                }))
            })

            // Fetch - Error
            .addCase(fetchNotifications.rejected, (state, action) => {
                if (state.fetchRequestId !== action.meta.requestId)
                {
                    return
                }

                state.loading = false
                state.fetchRequestId = null
                state.error = action.payload ?? 'Unable to load notifications'
            })

            // Mark Read - Pending
            .addCase(markNotificationAsRead.pending, (state, action) => {
                const id = action.meta.arg.notificationId

                state.markingRequests[id] = action.meta.requestId
                state.error = null
            })

            // Mark Read - Success
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const id = action.meta.arg.notificationId

                if (state.markingRequests[id] !== action.meta.requestId)
                {
                    return
                }

                delete state.markingRequests[id]

                const notification = state.items.find(
                    (item) => item.id === action.payload.id
                )

                if (notification)
                {
                    notification.isRead = action.payload.isRead
                }
            })

            // Mark Read - Error
            .addCase(markNotificationAsRead.rejected, (state, action) => {
                const id = action.meta.arg.notificationId

                if (state.markingRequests[id] !== action.meta.requestId)
                {
                    return
                }

                delete state.markingRequests[id]
                state.error = action.payload ?? 'Unable to update notification'
            })

            // Clear notifications on logout or session change
            .addCase(logout, () => initialState)
            .addCase(setCredentials, () => initialState)
    },
})

export default notificationSlice.reducer
