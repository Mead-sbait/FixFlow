import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../lib/api'
import type { RootState } from '../../app/store'
import type {
  AdminFilters,
  AdminIssue,
  AdminStats,
  CategorySummary,
  IssuePriority,
  Pagination,
  PersonSummary
} from '../../types'
import { logout } from '../auth/authSlice'
import { previewCategories, previewIssues, previewStats, previewTechnicians } from './previewData'

type AdminState = {
  issues: AdminIssue[]
  technicians: PersonSummary[]
  categories: CategorySummary[]
  stats: AdminStats
  filters: AdminFilters
  pagination: Pagination
  loadStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  changingIssueId: string | null
  error: string | null
  preview: boolean
  initialized: boolean
}

const emptyStats: AdminStats = { total: 0, open: 0, assigned: 0, inProgress: 0, completed: 0, urgent: 0, unassigned: 0 }
const defaultFilters: AdminFilters = { search: '', status: '', priority: '', categoryId: '', technicianId: '', page: 1, limit: 20 }

const initialState: AdminState = {
  issues: [],
  technicians: [],
  categories: [],
  stats: emptyStats,
  filters: defaultFilters,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  loadStatus: 'idle',
  changingIssueId: null,
  error: null,
  preview: false,
  initialized: false
}

function updateStatsAfterIssueChange(state: AdminState, previous: AdminIssue, next: AdminIssue) {
  const statusKeys = { open: 'open', assigned: 'assigned', in_progress: 'inProgress', completed: 'completed' } as const
  if (previous.status !== next.status) {
    const previousKey = statusKeys[previous.status as keyof typeof statusKeys]
    const nextKey = statusKeys[next.status as keyof typeof statusKeys]
    if (previousKey) state.stats[previousKey] = Math.max(0, state.stats[previousKey] - 1)
    if (nextKey) state.stats[nextKey] += 1
  }

  const wasActive = !['completed', 'cancelled'].includes(previous.status)
  const isActive = !['completed', 'cancelled'].includes(next.status)
  const wasUrgent = previous.priority === 'urgent' && wasActive
  const isUrgent = next.priority === 'urgent' && isActive
  const wasUnassigned = !previous.technician && wasActive
  const isUnassigned = !next.technician && isActive

  if (wasUrgent !== isUrgent) state.stats.urgent = Math.max(0, state.stats.urgent + (isUrgent ? 1 : -1))
  if (wasUnassigned !== isUnassigned) state.stats.unassigned = Math.max(0, state.stats.unassigned + (isUnassigned ? 1 : -1))
}

function removeIssueFromCurrentPage(state: AdminState, index: number) {
  state.issues.splice(index, 1)
  state.pagination.total = Math.max(0, state.pagination.total - 1)
  state.pagination.pages = state.pagination.total ? Math.ceil(state.pagination.total / state.pagination.limit) : 0
  if (state.pagination.page > state.pagination.pages) {
    const lastPage = Math.max(1, state.pagination.pages)
    state.pagination.page = lastPage
    state.filters.page = lastPage
  }
}

function getMessage(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response
    if (response?.data?.error) return response.data.error
  }
  return 'The admin queue could not be loaded. Please try again.'
}

function matchesFilters(issue: AdminIssue, filters: AdminFilters) {
  const search = filters.search.trim().toLowerCase()
  if (filters.status && issue.status !== filters.status) return false
  if (filters.priority && issue.priority !== filters.priority) return false
  if (filters.categoryId && issue.category?.id !== filters.categoryId) return false
  if (filters.technicianId === 'unassigned' && issue.technician) return false
  if (filters.technicianId && filters.technicianId !== 'unassigned' && issue.technician?.id !== filters.technicianId) return false
  return !search || `${issue.title} ${issue.description} ${issue.location}`.toLowerCase().includes(search)
}

function previewResult(filters: AdminFilters) {
  const items = previewIssues.filter((issue) => matchesFilters(issue, filters))

  return {
    issues: items,
    stats: previewStats,
    technicians: previewTechnicians,
    categories: previewCategories,
    pagination: { page: 1, limit: filters.limit, total: items.length, pages: items.length ? 1 : 0 }
  }
}

export const loadAdminDashboard = createAsyncThunk(
  'admin/loadDashboard',
  async ({ preview = false, refresh = false }: { preview?: boolean; refresh?: boolean }, { getState, rejectWithValue, signal }) => {
    const state = getState() as RootState
    if (preview) return { ...previewResult(state.admin.filters), preview: true }

    try {
      const token = state.auth.token
      if (!token) return rejectWithValue('Sign in with an administrator account to load this workspace.')
      const headers = { Authorization: `Bearer ${token}` }
      const params = Object.fromEntries(Object.entries(state.admin.filters).filter(([, value]) => value !== ''))
      const issues = await api.get<{ items: AdminIssue[]; pagination: Pagination }>('/admin/issues', { params, headers, signal })

      if (state.admin.initialized && !refresh) {
        return {
          issues: issues.data.items,
          pagination: issues.data.pagination,
          stats: state.admin.stats,
          technicians: state.admin.technicians,
          categories: state.admin.categories,
          preview: false
        }
      }

      const [stats, technicians, categories] = await Promise.all([
        api.get<AdminStats>('/admin/stats', { headers, signal }),
        api.get<{ items: PersonSummary[] }>('/admin/technicians', { headers, signal }),
        api.get<{ items: CategorySummary[] }>('/admin/categories', { headers, signal })
      ])
      return {
        issues: issues.data.items,
        pagination: issues.data.pagination,
        stats: stats.data,
        technicians: technicians.data.items,
        categories: categories.data.items,
        preview: false
      }
    } catch (error) {
      return rejectWithValue(getMessage(error))
    }
  }
)

export const assignTechnician = createAsyncThunk(
  'admin/assignTechnician',
  async ({ issueId, technicianId }: { issueId: string; technicianId: string }, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    if (state.admin.preview) {
      const issue = state.admin.issues.find((item) => item.id === issueId)
      const technician = state.admin.technicians.find((item) => item.id === technicianId)
      if (!issue || !technician) return rejectWithValue('The issue or technician is no longer available.')
      return { ...issue, technician, status: issue.status === 'open' ? 'assigned' as const : issue.status }
    }

    try {
      const headers = state.auth.token ? { Authorization: `Bearer ${state.auth.token}` } : undefined
      const response = await api.patch<{ issue: AdminIssue }>(`/admin/issues/${issueId}/assign`, { technicianId }, { headers })
      return response.data.issue
    } catch (error) {
      return rejectWithValue(getMessage(error))
    }
  }
)

export const updateIssuePriority = createAsyncThunk(
  'admin/updatePriority',
  async ({ issueId, priority }: { issueId: string; priority: IssuePriority }, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const issue = state.admin.issues.find((item) => item.id === issueId)
    if (state.admin.preview) {
      if (!issue) return rejectWithValue('The issue is no longer available.')
      return { ...issue, priority }
    }

    try {
      const headers = state.auth.token ? { Authorization: `Bearer ${state.auth.token}` } : undefined
      const response = await api.patch<{ issue: AdminIssue }>(`/admin/issues/${issueId}/priority`, { priority }, { headers })
      return response.data.issue
    } catch (error) {
      return rejectWithValue(getMessage(error))
    }
  }
)

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    updateFilters(state, action: PayloadAction<Partial<AdminFilters>>) {
      Object.assign(state.filters, action.payload)
    },
    clearAdminError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => initialState)
      .addCase(loadAdminDashboard.pending, (state) => {
        state.loadStatus = 'loading'
        state.error = null
      })
      .addCase(loadAdminDashboard.fulfilled, (state, action) => {
        state.loadStatus = 'succeeded'
        state.issues = action.payload.issues
        state.stats = action.payload.stats
        state.technicians = action.payload.technicians
        state.categories = action.payload.categories
        state.pagination = action.payload.pagination
        state.preview = action.payload.preview
        state.initialized = true
      })
      .addCase(loadAdminDashboard.rejected, (state, action) => {
        if (action.meta.aborted) return
        state.loadStatus = 'failed'
        state.error = typeof action.payload === 'string' ? action.payload : 'The admin queue could not be loaded.'
      })
      .addCase(assignTechnician.pending, (state, action) => {
        state.changingIssueId = action.meta.arg.issueId
        state.error = null
      })
      .addCase(assignTechnician.fulfilled, (state, action) => {
        state.changingIssueId = null
        const index = state.issues.findIndex((issue) => issue.id === action.payload.id)
        if (index !== -1) {
          updateStatsAfterIssueChange(state, state.issues[index], action.payload)
          if (matchesFilters(action.payload, state.filters)) {
            state.issues[index] = action.payload
          } else {
            removeIssueFromCurrentPage(state, index)
          }
        }
      })
      .addCase(assignTechnician.rejected, (state, action) => {
        state.changingIssueId = null
        state.error = typeof action.payload === 'string' ? action.payload : 'The technician could not be assigned.'
      })
      .addCase(updateIssuePriority.pending, (state, action) => {
        state.changingIssueId = action.meta.arg.issueId
        state.error = null
      })
      .addCase(updateIssuePriority.fulfilled, (state, action) => {
        state.changingIssueId = null
        const index = state.issues.findIndex((issue) => issue.id === action.payload.id)
        if (index !== -1) {
          updateStatsAfterIssueChange(state, state.issues[index], action.payload)
          if (matchesFilters(action.payload, state.filters)) {
            state.issues[index] = action.payload
          } else {
            removeIssueFromCurrentPage(state, index)
          }
        }
      })
      .addCase(updateIssuePriority.rejected, (state, action) => {
        state.changingIssueId = null
        state.error = typeof action.payload === 'string' ? action.payload : 'The priority could not be updated.'
      })
  }
})

export const { updateFilters, clearAdminError } = adminSlice.actions
export default adminSlice.reducer
