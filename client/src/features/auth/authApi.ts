import { api } from '../../lib/api'
import type { AuthUser } from '../../types'

// signal lets the login page drop a response that comes back after it left the screen
export async function login(email: string, password: string, signal?: AbortSignal) {
  const response = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', { email, password }, { signal })
  return response.data
}

export async function register(name: string, email: string, password: string, signal?: AbortSignal) {
  const response = await api.post<AuthUser>('/auth/register', { name, email, password }, { signal })
  return response.data
}
