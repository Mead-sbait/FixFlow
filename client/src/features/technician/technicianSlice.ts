import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { TechnicianIssue, TechnicianStatusUpdateResponse } from './technician.types'
import { getTechnicianIssue, getTechnicianIssues, updateTechnicianStatus } from './technicianApi'
import { logout, setCredentials } from '../auth/authSlice'

type TechnicianState = {
    issues: TechnicianIssue[]
    selectedIssue: TechnicianIssue | null
    loading: boolean
    issueLoading: boolean
    statusUpdating: boolean
    error: string | null

    issuesRequestId: string | null
    issueRequestId: string | null
    statusRequestId: string | null
}

const initialState: TechnicianState = {
    issues: [],
    selectedIssue: null,
    loading: false,
    issueLoading: false,
    statusUpdating: false,
    error: null,

    issuesRequestId: null,
    issueRequestId: null,
    statusRequestId: null,
}

export const fetchTechnicianIssues = createAsyncThunk<TechnicianIssue[], string, { rejectValue: string }>(
    'technician/fetchIssues',
    async (token, { rejectWithValue }) => {
        try {
            return await getTechnicianIssues(token)
        } catch {
            return rejectWithValue('Unable to load assigned issues')
        }
    },
)

export const fetchTechnicianIssue = createAsyncThunk<TechnicianIssue, { token: string; issueId: string }, { rejectValue: string }>(
    'technician/fetchIssue',
    async ({ token, issueId }, { rejectWithValue }) => {
        try
        {
            return await getTechnicianIssue(token, issueId)
        }
        catch
        {
            return rejectWithValue('Unable to load issue')
        }
    },
)

export const changeTechnicianIssueStatus = createAsyncThunk<TechnicianStatusUpdateResponse, { token: string; issueId: string; status: 'in_progress' | 'completed' }, { rejectValue: string }>(
    'technician/changeStatus',
    async ({ token, issueId, status }, { rejectWithValue }) => {
        try
        {
            return await updateTechnicianStatus(token, issueId, status)
        }
        catch
        {
            return rejectWithValue('Unable to update issue status')
        }
    },
)

const technicianSlice = createSlice({ name: 'technician', initialState, reducers: {}, extraReducers: (builder) => {
    builder
        .addCase(fetchTechnicianIssues.pending, (state, action) => {
            state.loading = true
            state.error = null
            state.issuesRequestId = action.meta.requestId
        })

        .addCase(fetchTechnicianIssues.fulfilled, (state, action) => {
            if (state.issuesRequestId !== action.meta.requestId)
            {
                return
            }

            state.loading = false
            state.issuesRequestId = null
            state.issues = action.payload
        })

        .addCase(fetchTechnicianIssues.rejected, (state, action) => {
            if (state.issuesRequestId !== action.meta.requestId)
            {
                return
            }

            state.loading = false
            state.issuesRequestId = null
            state.error = action.payload ?? 'Unable to load assigned issues'
        })

        .addCase(fetchTechnicianIssue.pending, (state, action) => {
            state.issueLoading = true
            state.error = null
            state.selectedIssue = null
            state.issueRequestId = action.meta.requestId
        })

        .addCase(fetchTechnicianIssue.fulfilled, (state, action) => {
            if (state.issueRequestId !== action.meta.requestId)
            {
                return
            }

            state.issueLoading = false
            state.issueRequestId = null
            state.selectedIssue = action.payload
        })

        .addCase(fetchTechnicianIssue.rejected, (state, action) => {
            if (state.issueRequestId !== action.meta.requestId)
            {
                return
            }

            state.issueLoading = false
            state.issueRequestId = null
            state.error = action.payload ?? 'Unable to load issue'
        })

        .addCase(changeTechnicianIssueStatus.pending, (state, action) => {
            state.statusUpdating = true
            state.error = null
            state.statusRequestId = action.meta.requestId
        })

        .addCase(changeTechnicianIssueStatus.fulfilled, (state, action) => {
            if (state.statusRequestId !== action.meta.requestId)
            {
                return
            }

            state.statusUpdating = false
            state.statusRequestId = null

            if (state.selectedIssue && state.selectedIssue.id === action.payload.id)
            {
                state.selectedIssue.status = action.payload.status
                state.selectedIssue.updatedAt = action.payload.updatedAt
            }

            const issue = state.issues.find(
                (item) => item.id === action.payload.id
            )

            if (issue)
            {
                issue.status = action.payload.status
                issue.updatedAt = action.payload.updatedAt
            }
        })

        .addCase(changeTechnicianIssueStatus.rejected, (state, action) => {
            if (state.statusRequestId !== action.meta.requestId)
            {
                return
            }

            state.statusUpdating = false
            state.statusRequestId = null
            state.error = action.payload ?? 'Unable to update issue status'
        })

        .addCase(logout, () => {
            return initialState
        })

        .addCase(setCredentials, () => {
            return initialState
        })
    },
})

export default technicianSlice.reducer