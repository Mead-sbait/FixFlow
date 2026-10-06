import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { isAxiosError } from 'axios'
import type { RootState } from '../../app/store'
import type { IssuePriority, UserRole } from '../../types'
import { logout, setCredentials } from '../auth/authSlice'
import {
  assignTechnician,
  getAdminIssues,
  getAdminStats,
  getCategories,
  getTechnicians,
  getUsers,
  updateIssuePriority,
  updateUserRole
} from './adminApi'
import type {
  AdminIssue,
  AdminStats,
  AdminUser,
  Category,
  IssueFilters,
  Pagination,
  PersonRef,
  UserFilters
} from './admin.types'

type AdminState = {
  issues: AdminIssue[]
  pagination: Pagination
  filters: IssueFilters
  technicians: PersonRef[]
  categories: Category[]
  stats: AdminStats | null
  users: AdminUser[]
  userFilters: UserFilters
  loadingIssues: boolean
  loadingStats: boolean
  loadingUsers: boolean
  // id of the issue or user currently being saved, so only that row is disabled
  savingId: string | null
  error: string | null
}

export const defaultFilters: IssueFilters = {
  search: '',
  status: '',
  priority: '',
  categoryId: '',
  technicianId: '',
  page: 1,
  limit: 20
}

const initialState: AdminState = {
  issues: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  filters: defaultFilters,
  technicians: [],
  categories: [],
  stats: null,
  users: [],
  userFilters: { role: '', search: '' },
  loadingIssues: false,
  loadingStats: false,
  loadingUsers: false,
  savingId: null,
  error: null
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error as string
  }
  return fallback
}

export const fetchAdminIssues = createAsyncThunk<
  Awaited<ReturnType<typeof getAdminIssues>>,
  string,
  { state: RootState; rejectValue: string }
>('admin/fetchIssues', async (token, { getState, rejectWithValue }) => {
  try {
    return await getAdminIssues(token, getState().admin.filters)
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to load issues'))
  }
})

export const fetchAdminLookups = createAsyncThunk<
  { technicians: PersonRef[]; categories: Category[] },
  string,
  { rejectValue: string }
>('admin/fetchLookups', async (token, { rejectWithValue }) => {
  try {
    const [technicians, categories] = await Promise.all([getTechnicians(token), getCategories(token)])
    return { technicians, categories }
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to load technicians and categories'))
  }
})

export const fetchAdminStats = createAsyncThunk<AdminStats, string, { rejectValue: string }>(
  'admin/fetchStats',
  async (token, { rejectWithValue }) => {
    try {
      return await getAdminStats(token)
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to load statistics'))
    }
  }
)

export const assignIssueTechnician = createAsyncThunk<
  AdminIssue,
  { token: string; issueId: string; technicianId: string },
  { rejectValue: string }
>('admin/assignTechnician', async ({ token, issueId, technicianId }, { rejectWithValue }) => {
  try {
    return await assignTechnician(token, issueId, technicianId)
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to assign technician'))
  }
})

export const changeIssuePriority = createAsyncThunk<
  AdminIssue,
  { token: string; issueId: string; priority: IssuePriority },
  { rejectValue: string }
>('admin/changePriority', async ({ token, issueId, priority }, { rejectWithValue }) => {
  try {
    return await updateIssuePriority(token, issueId, priority)
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to update priority'))
  }
})

export const fetchAdminUsers = createAsyncThunk<AdminUser[], string, { state: RootState; rejectValue: string }>(
  'admin/fetchUsers',
  async (token, { getState, rejectWithValue }) => {
    try {
      return await getUsers(token, getState().admin.userFilters)
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to load users'))
    }
  }
)

export const changeUserRole = createAsyncThunk<
  AdminUser,
  { token: string; userId: string; role: UserRole },
  { rejectValue: string }
>('admin/changeUserRole', async ({ token, userId, role }, { rejectWithValue }) => {
  try {
    return await updateUserRole(token, userId, role)
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to update role'))
  }
})

function replaceIssue(state: AdminState, issue: AdminIssue) {
  const index = state.issues.findIndex((item) => item.id === issue.id)
  if (index !== -1) state.issues[index] = issue
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<IssueFilters>>) {
      // changing any filter goes back to the first page unless the page itself changed
      state.filters = { ...state.filters, page: 1, ...action.payload }
    },
    resetFilters(state) {
      state.filters = defaultFilters
    },
    setUserFilters(state, action: PayloadAction<Partial<UserFilters>>) {
      state.userFilters = { ...state.userFilters, ...action.payload }
    },
    clearAdminError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminIssues.pending, (state) => {
        state.loadingIssues = true
        state.error = null
      })
      .addCase(fetchAdminIssues.fulfilled, (state, action) => {
        state.loadingIssues = false
        state.issues = action.payload.items
        state.pagination = action.payload.pagination
      })
      .addCase(fetchAdminIssues.rejected, (state, action) => {
        state.loadingIssues = false
        state.error = action.payload ?? 'Unable to load issues'
      })

      .addCase(fetchAdminLookups.fulfilled, (state, action) => {
        state.technicians = action.payload.technicians
        state.categories = action.payload.categories
      })
      .addCase(fetchAdminLookups.rejected, (state, action) => {
        state.error = action.payload ?? 'Unable to load technicians and categories'
      })

      .addCase(fetchAdminStats.pending, (state) => {
        state.loadingStats = true
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loadingStats = false
        state.stats = action.payload
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loadingStats = false
        state.error = action.payload ?? 'Unable to load statistics'
      })

      .addCase(assignIssueTechnician.pending, (state, action) => {
        state.savingId = action.meta.arg.issueId
        state.error = null
      })
      .addCase(assignIssueTechnician.fulfilled, (state, action) => {
        state.savingId = null
        replaceIssue(state, action.payload)
      })
      .addCase(assignIssueTechnician.rejected, (state, action) => {
        state.savingId = null
        state.error = action.payload ?? 'Unable to assign technician'
      })

      .addCase(changeIssuePriority.pending, (state, action) => {
        state.savingId = action.meta.arg.issueId
        state.error = null
      })
      .addCase(changeIssuePriority.fulfilled, (state, action) => {
        state.savingId = null
        replaceIssue(state, action.payload)
      })
      .addCase(changeIssuePriority.rejected, (state, action) => {
        state.savingId = null
        state.error = action.payload ?? 'Unable to update priority'
      })

      .addCase(fetchAdminUsers.pending, (state) => {
        state.loadingUsers = true
        state.error = null
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loadingUsers = false
        state.users = action.payload
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loadingUsers = false
        state.error = action.payload ?? 'Unable to load users'
      })

      .addCase(changeUserRole.pending, (state, action) => {
        state.savingId = action.meta.arg.userId
        state.error = null
      })
      .addCase(changeUserRole.fulfilled, (state, action) => {
        state.savingId = null
        const index = state.users.findIndex((user) => user.id === action.payload.id)
        if (index !== -1) state.users[index] = action.payload
      })
      .addCase(changeUserRole.rejected, (state, action) => {
        state.savingId = null
        state.error = action.payload ?? 'Unable to update role'
      })

      // wipe everything when the account changes so the next admin does not see old data
      .addCase(logout, () => initialState)
      .addCase(setCredentials, () => initialState)
  }
})

export const { setFilters, resetFilters, setUserFilters, clearAdminError } = adminSlice.actions
export default adminSlice.reducer
