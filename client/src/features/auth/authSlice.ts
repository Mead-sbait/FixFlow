import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '../../types'

type AuthState = { user: AuthUser | null; token: string | null }
const initialState: AuthState = { user: null, token: null }

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) { state.user = action.payload.user; state.token = action.payload.token },
    logout(state) { state.user = null; state.token = null }
  }
})
export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

