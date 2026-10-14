import { useEffect, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { changeUserRole, clearAdminError, fetchAdminUsers, setUserFilters } from '../features/admin/adminSlice'
import { formatDate } from '../lib/roles'
import type { UserRole } from '../types'

const roles: UserRole[] = ['user', 'technician', 'admin']

export function AdminUsers() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.auth.token)
  const me = useSelector((state: RootState) => state.auth.user)
  const { users, userFilters, loadingUsers, savingId, error } = useSelector((state: RootState) => state.admin)
  const [search, setSearch] = useState(userFilters.search)

  useEffect(() => {
    if (token) dispatch(fetchAdminUsers(token))
  }, [dispatch, token, userFilters])

  if (!token) return null

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    dispatch(setUserFilters({ search: search.trim() }))
  }

  const handleRole = (userId: string, name: string, role: UserRole) => {
    if (!window.confirm(`Change ${name}'s role to ${role}?`)) return
    dispatch(changeUserRole({ token, userId, role }))
  }

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">People</span></h1>
          <p>Everyone with an account. New sign-ups start as reporters; make someone a technician to give them a column.</p>
        </div>
      </div>

      {error && (
        <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}>
          <Icon name="alert" size={16} />
          <span>{error}</span>
          <button type="button" className="close" onClick={() => dispatch(clearAdminError())} aria-label="Dismiss"><Icon name="x" size={14} /></button>
        </div>
      )}

      <form className="board-tray" onSubmit={submitSearch} aria-label="Filter people">
        <div className="search">
          <Icon name="search" size={16} />
          <input className="input input--sm" type="search" placeholder="Search by name or email" aria-label="Search people" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select className="select select--sm" aria-label="Role" value={userFilters.role} onChange={(event) => dispatch(setUserFilters({ role: event.target.value as UserRole | '' }))}>
          <option value="">Any role</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <button type="submit" className="btn btn--secondary btn--sm">Search</button>
        <span className="board-tray__count tabular">{users.length} {users.length === 1 ? 'account' : 'accounts'}</span>
      </form>

      <div className="sheet">
        {loadingUsers && users.length === 0 ? (
          <div className="empty"><p className="loading">Loading people…</p></div>
        ) : users.length === 0 ? (
          <div className="empty"><Icon name="users" size={36} /><h3>Nobody matches</h3><p>Try another name or role.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="table">
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
                      <td className="cell-title" data-label="Name"><strong>{user.name}{isMe ? ' (you)' : ''}</strong></td>
                      <td data-label="Email">{user.email}</td>
                      <td data-label="Role"><span className={`tag tag--${user.role}`}>{user.role}</span></td>
                      <td data-label="Joined" className="tabular">{formatDate(user.createdAt)}</td>
                      <td data-label="Change role">
                        <select
                          className="select select--sm"
                          style={{ width: 'auto' }}
                          aria-label={`Role for ${user.name}`}
                          value={user.role}
                          disabled={isMe || savingId === user.id}
                          onChange={(event) => handleRole(user.id, user.name, event.target.value as UserRole)}
                        >
                          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
