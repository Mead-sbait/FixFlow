import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { TechnicianIssue, TechnicianStatusUpdateResponse } from './technician.types'
import { getTechnicianIssue, getTechnicianIssues, updateTechnicianStatus } from './technicianApi'

type TechnicianState = {
    issues: TechnicianIssue[]
    selectedIssue: TechnicianIssue | null
    loading: boolean
    issueLoading: boolean
    statusUpdating: boolean
    error: string | null
}

const initialState: TechnicianState = {
    issues: [],
    selectedIssue: null,
    loading: false,
    issueLoading: false,
    statusUpdating: false,
    error: null,
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
        .addCase(fetchTechnicianIssues.pending, (state) => {
            state.loading = true
            state.error = null
        })

        .addCase(fetchTechnicianIssues.fulfilled, (state, action) => {
            state.loading = false
            state.issues = action.payload
        })

        .addCase(fetchTechnicianIssues.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload ?? 'Unable to load assigned issues'
        })

        .addCase(fetchTechnicianIssue.pending, (state) => {
            state.issueLoading = true
            state.error = null
        })

        .addCase(fetchTechnicianIssue.fulfilled, (state, action) => {
            state.issueLoading = false
            state.selectedIssue = action.payload
        })

        .addCase(fetchTechnicianIssue.rejected, (state, action) => {
            state.issueLoading = false
            state.error = action.payload ?? 'Unable to load issue'
        })

        .addCase(changeTechnicianIssueStatus.pending, (state) => {
            state.statusUpdating = true
            state.error = null
        })

        .addCase(changeTechnicianIssueStatus.fulfilled, (state, action) => {
            state.statusUpdating = false

            if (state.selectedIssue)
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
            state.statusUpdating = false
            state.error = action.payload ?? 'Unable to update issue status'
        })
    },
})

export default technicianSlice.reducer