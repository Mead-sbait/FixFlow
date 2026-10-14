import { useEffect, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { AdminNav } from '../features/admin/components/AdminNav'
import { changeUserRole, clearAdminError, fetchAdminUsers, setUserFilters } from '../features/admin/adminSlice'
import type { UserRole } from '../types'
import '../features/admin/admin.css'

const roles: UserRole[] = ['user', 'technician', 'admin']

export function AdminUsers() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.auth.token)
  const me = useSelector((state: RootState) => state.auth.user)
  const { users, userFilters, loadingUsers, savingId, error } = useSelector((state: RootState) => state.admin)
  const [search, setSearch] = useState(userFilters.search)

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminUsers(token))
    }
  }, [dispatch, token, userFilters])

  if (!token) {
    return <main className="admin-page"><p>Authentication required.</p></main>
  }

  if (me && me.role !== 'admin') {
    return <main className="admin-page"><p>Admin access required.</p></main>
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    dispatch(setUserFilters({ search: search.trim() }))
  }

  const handleRole = (userId: string, name: string, role: UserRole) => {
    if (!window.confirm(`Change ${name}'s role to ${role}?`)) return
    dispatch(changeUserRole({ token, userId, role }))
  }

  return (
    <main className="admin-page">
      <h1>Users</h1>
      <p>Promote accounts to technician or admin. New registrations always start as normal users.</p>

      <AdminNav />

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => dispatch(clearAdminError())} aria-label="Dismiss">×</button>
        </div>
      )}

      <form className="issue-filters" onSubmit={submitSearch}>
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          value={userFilters.role}
          onChange={(event) => dispatch(setUserFilters({ role: event.target.value as UserRole | '' }))}
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <button type="submit">Search</button>
      </form>

      {loadingUsers && users.length === 0 ? (
        <p>Loading users...</p>
      ) : (
        <div className="admin-table-wrap">
          {users.length === 0 ? (
            <div className="admin-empty">No users found.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Change role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isMe = user.id === me?.id

                  return (
                    <tr key={user.id} className={savingId === user.id ? 'is-saving' : undefined}>
                      <td>{user.name}{isMe ? ' (you)' : ''}</td>
                      <td>{user.email}</td>
                      <td><span className={`badge badge--${user.role}`}>{user.role}</span></td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <select
                          value={user.role}
                          disabled={isMe || savingId === user.id}
                          onChange={(event) => handleRole(user.id, user.name, event.target.value as UserRole)}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  )
}
