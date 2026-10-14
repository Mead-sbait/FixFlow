import type { UserRole } from '../types'

// where each role lands after login
export function homeFor(role: UserRole | undefined) {
  if (role === 'admin') return '/admin'
  if (role === 'technician') return '/technician'
  return '/dashboard'
}

export const statusLabel: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

export function formatDate(value: string, withTime = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, withTime
    ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short' })
}

export function errorText(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const data = (error as { response?: { data?: { error?: string } } }).response?.data
    if (data?.error) return data.error
  }
  return fallback
}
