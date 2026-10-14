import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import adminReducer from '../features/admin/adminSlice'
import issuesReducer from '../features/issues/issuesSlice'
import technicianReducer from '../features/technician/technicianSlice'
import notificationReducer from '../features/notifications/notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    issues: issuesReducer,
    admin: adminReducer,
    technician: technicianReducer,
    notifications: notificationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
