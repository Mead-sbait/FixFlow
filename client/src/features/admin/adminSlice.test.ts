import { describe, expect, it } from 'vitest'
import { logout, setCredentials } from '../auth/authSlice'
import reducer, { fetchAdminIssues, fetchAdminLookups } from './adminSlice'

const token = 'token-a'
const lookups = {
  technicians: [{ id: 't1', name: 'Nora', email: 'nora@fixflow.local' }],
  categories: [{ id: 'c1', name: 'Plumbing' }]
}
const issues = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 }
}

describe('admin slice and stale responses', () => {
  it('ignores a lookups response that was started before logout', () => {
    let state = reducer(undefined, fetchAdminLookups.pending('req-1', token))
    state = reducer(state, logout())
    state = reducer(state, fetchAdminLookups.fulfilled(lookups, 'req-1', token))

    expect(state.technicians).toEqual([])
    expect(state.categories).toEqual([])
  })

  it('ignores a lookups response from the previous account after switching', () => {
    let state = reducer(undefined, fetchAdminLookups.pending('req-1', token))
    state = reducer(state, setCredentials({ token: 'token-b', user: { id: 'u2', name: 'B', email: 'b@x', role: 'admin' } }))
    state = reducer(state, fetchAdminLookups.pending('req-2', 'token-b'))
    state = reducer(state, fetchAdminLookups.fulfilled(lookups, 'req-1', token))

    expect(state.technicians).toEqual([])

    state = reducer(state, fetchAdminLookups.fulfilled(lookups, 'req-2', 'token-b'))
    expect(state.technicians).toEqual(lookups.technicians)
  })

  it('keeps the newest issue list when an older request finishes last', () => {
    const older = { ...issues, items: [{ id: 'old' } as never] }
    const newer = { ...issues, items: [{ id: 'new' } as never] }

    let state = reducer(undefined, fetchAdminIssues.pending('req-1', token))
    state = reducer(state, fetchAdminIssues.pending('req-2', token))
    state = reducer(state, fetchAdminIssues.fulfilled(newer, 'req-2', token))
    state = reducer(state, fetchAdminIssues.fulfilled(older, 'req-1', token))

    expect(state.issues.map((issue) => issue.id)).toEqual(['new'])
    expect(state.loadingIssues).toBe(false)
  })
})
