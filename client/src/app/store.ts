import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import technicianReducer from '../features/technician/technicianSlice'

export const store = configureStore({ reducer: { auth: authReducer, technician: technicianReducer } })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

