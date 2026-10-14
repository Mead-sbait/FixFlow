import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { errorText } from '../../lib/roles'
import { logout, setCredentials } from '../auth/authSlice'
import type { Category, NewIssue, UserIssue } from './issue.types'
import { createIssue, getCategories, getMyIssue, getMyIssues } from './issuesApi'

type IssuesState = {
  items: UserIssue[]
  selected: UserIssue | null
  categories: Category[]
  loading: boolean
  loadingOne: boolean
  saving: boolean
  error: string | null
  listRequestId: string | null
  oneRequestId: string | null
  reportRequestId: string | null
}

const initialState: IssuesState = {
  items: [],
  selected: null,
  categories: [],
  loading: false,
  loadingOne: false,
  saving: false,
  error: null,
  listRequestId: null,
  oneRequestId: null,
  reportRequestId: null
}

export const fetchMyIssues = createAsyncThunk<UserIssue[], string, { rejectValue: string }>(
  'issues/fetchMine',
  async (token, { rejectWithValue }) => {
    try {
      return await getMyIssues(token)
    } catch (error) {
      return rejectWithValue(errorText(error, 'Unable to load your issues'))
    }
  }
)

export const fetchMyIssue = createAsyncThunk<UserIssue, { token: string; issueId: string }, { rejectValue: string }>(
  'issues/fetchOne',
  async ({ token, issueId }, { rejectWithValue }) => {
    try {
      return await getMyIssue(token, issueId)
    } catch (error) {
      return rejectWithValue(errorText(error, 'Unable to load this issue'))
    }
  }
)

export const fetchCategories = createAsyncThunk<Category[], string, { rejectValue: string }>(
  'issues/fetchCategories',
  async (token, { rejectWithValue }) => {
    try {
      return await getCategories(token)
    } catch (error) {
      return rejectWithValue(errorText(error, 'Unable to load categories'))
    }
  }
)

export const reportIssue = createAsyncThunk<UserIssue, { token: string; data: NewIssue }, { rejectValue: string }>(
  'issues/report',
  async ({ token, data }, { rejectWithValue }) => {
    try {
      return await createIssue(token, data)
    } catch (error) {
      return rejectWithValue(errorText(error, 'Unable to report the issue'))
    }
  }
)

const issuesSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    clearIssuesError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyIssues.pending, (state, action) => {
        state.loading = true
        state.error = null
        state.listRequestId = action.meta.requestId
      })
      .addCase(fetchMyIssues.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) return
        state.loading = false
        state.listRequestId = null
        state.items = action.payload
      })
      .addCase(fetchMyIssues.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) return
        state.loading = false
        state.listRequestId = null
        state.error = action.payload ?? 'Unable to load your issues'
      })

      .addCase(fetchMyIssue.pending, (state, action) => {
        state.loadingOne = true
        state.error = null
        state.oneRequestId = action.meta.requestId
      })
      .addCase(fetchMyIssue.fulfilled, (state, action) => {
        if (state.oneRequestId !== action.meta.requestId) return
        state.loadingOne = false
        state.oneRequestId = null
        state.selected = action.payload
      })
      .addCase(fetchMyIssue.rejected, (state, action) => {
        if (state.oneRequestId !== action.meta.requestId) return
        state.loadingOne = false
        state.oneRequestId = null
        state.selected = null
        state.error = action.payload ?? 'Unable to load this issue'
      })

      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })

      // same guard as the reads: logout and setCredentials reset the slice, so a report that was
      // still in flight for the previous account no longer matches and is dropped
      .addCase(reportIssue.pending, (state, action) => {
        state.saving = true
        state.error = null
        state.reportRequestId = action.meta.requestId
      })
      .addCase(reportIssue.fulfilled, (state, action) => {
        if (state.reportRequestId !== action.meta.requestId) return
        state.saving = false
        state.reportRequestId = null
        state.items = [action.payload, ...state.items]
        state.selected = action.payload
      })
      .addCase(reportIssue.rejected, (state, action) => {
        if (state.reportRequestId !== action.meta.requestId) return
        state.saving = false
        state.reportRequestId = null
        state.error = action.payload ?? 'Unable to report the issue'
      })

      .addCase(logout, () => initialState)
      .addCase(setCredentials, () => initialState)
  }
})

export const { clearIssuesError } = issuesSlice.actions
export default issuesSlice.reducer
