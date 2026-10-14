import { api } from '../../lib/api'
import type { AuthUser } from '../../types'

export async function login(email: string, password: string) {
  const response = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', { email, password })
  return response.data
}

export async function register(name: string, email: string, password: string) {
  const response = await api.post<AuthUser>('/auth/register', { name, email, password })
  return response.data
}
