import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { TechnicianIssue } from './technician.types'
import { getTechnicianIssues } from './technicianApi'

type TechnicianState = {
    issues: TechnicianIssue[]
    loading: boolean
    error: string | null
}

const initialState: TechnicianState = {
    issues: [],
    loading: false,
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
    },
})

export default technicianSlice.reducer