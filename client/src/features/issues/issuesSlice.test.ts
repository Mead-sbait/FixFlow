import { describe, expect, it } from 'vitest'
import { logout, setCredentials } from '../auth/authSlice'
import reducer, { reportIssue } from './issuesSlice'
import type { NewIssue, UserIssue } from './issue.types'

const token = 'token-a'
const data: NewIssue = { title: 'Leak', description: 'Under the sink', location: 'Kitchen', categoryId: 'c1', priority: 'medium' }
const created: UserIssue = {
  id: 'i1', title: 'Leak', description: 'Under the sink', location: 'Kitchen', status: 'open', priority: 'medium',
  reporterId: 'u1', technicianId: null, categoryId: 'c1', createdAt: '2026-10-14T10:00:00.000Z', updatedAt: '2026-10-14T10:00:00.000Z'
}

describe('reporting an issue and the session', () => {
  it('a report that finishes after logout does not land in the new session', () => {
    let state = reducer(undefined, reportIssue.pending('req-1', { token, data }))
    expect(state.saving).toBe(true)
    state = reducer(state, logout())
    state = reducer(state, reportIssue.fulfilled(created, 'req-1', { token, data }))
    expect(state.items).toEqual([])
    expect(state.selected).toBeNull()
    expect(state.saving).toBe(false)
  })

  it('a report that finishes after switching account is dropped too', () => {
    let state = reducer(undefined, reportIssue.pending('req-1', { token, data }))
    state = reducer(state, setCredentials({ token: 'token-b', user: { id: 'u2', name: 'B', email: 'b@x', role: 'user' } }))
    state = reducer(state, reportIssue.fulfilled(created, 'req-1', { token, data }))
    expect(state.items).toEqual([])
  })

  it('a report for the current session is kept', () => {
    let state = reducer(undefined, reportIssue.pending('req-2', { token, data }))
    state = reducer(state, reportIssue.fulfilled(created, 'req-2', { token, data }))
    expect(state.items.map((issue) => issue.id)).toEqual(['i1'])
    expect(state.selected?.id).toBe('i1')
    expect(state.saving).toBe(false)
  })
})
