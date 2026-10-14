import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '../../types'

type AuthState = { user: AuthUser | null; token: string | null }

const STORAGE_KEY = 'fixflow.session'

// keep the session across reloads, otherwise every refresh logs you out
function loadSession(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AuthState
      if (parsed.token && parsed.user) return parsed
    }
  } catch {
    // ignore, start logged out
  }
  return { user: null, token: null }
}

function saveSession(state: AuthState) {
  try {
    if (state.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage can be blocked, the session then only lives in memory
  }
}

const initialState: AuthState = loadSession()

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      saveSession(state)
    },
    logout(state) {
      state.user = null
      state.token = null
      saveSession(state)
    }
  }
})
export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
