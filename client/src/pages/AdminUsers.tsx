import { useEffect, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { changeUserRole, clearAdminError, fetchAdminUsers, setUserFilters } from '../features/admin/adminSlice'
import { useT } from '../i18n'
import { formatDate } from '../lib/roles'
import type { UserRole } from '../types'

const roles: UserRole[] = ['user', 'technician', 'admin']

export function AdminUsers() {
  const dispatch = useDispatch<AppDispatch>()
  const { t, locale, errorMessage } = useT()
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
    if (!window.confirm(t('people.confirm', { name, role: t(`role.${role}`) }))) return
    dispatch(changeUserRole({ token, userId, role }))
  }

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">{t('people.title')}</span></h1>
          <p>{t('people.lead')}</p>
        </div>
      </div>

      {error && (
        <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}>
          <Icon name="alert" size={16} />
          <span>{errorMessage(error)}</span>
          <button type="button" className="close" onClick={() => dispatch(clearAdminError())} aria-label={t('common.dismiss')}><Icon name="x" size={14} /></button>
        </div>
      )}

      <form className="board-tray" onSubmit={submitSearch} aria-label={t('people.filter')}>
        <div className="search">
          <Icon name="search" size={16} />
          <input className="input input--sm" type="search" placeholder={t('people.searchPlaceholder')} aria-label={t('people.searchLabel')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select className="select select--sm" aria-label={t('people.role')} value={userFilters.role} onChange={(event) => dispatch(setUserFilters({ role: event.target.value as UserRole | '' }))}>
          <option value="">{t('people.anyRole')}</option>
          {roles.map((role) => <option key={role} value={role}>{t(`role.${role}`)}</option>)}
        </select>
        <button type="submit" className="btn btn--secondary btn--sm">{t('common.search')}</button>
        <span className="board-tray__count tabular">{users.length === 1 ? t('people.account', { count: 1 }) : t('people.accounts', { count: users.length })}</span>
      </form>

      <div className="sheet">
        {loadingUsers && users.length === 0 ? (
          <div className="empty"><p className="loading">{t('common.loading')}</p></div>
        ) : users.length === 0 ? (
          <div className="empty"><Icon name="users" size={36} /><h3>{t('people.nobody')}</h3><p>{t('people.nobodyText')}</p></div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('people.name')}</th>
                  <th>{t('people.email')}</th>
                  <th>{t('people.role')}</th>
                  <th>{t('people.joined')}</th>
                  <th>{t('people.changeRole')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isMe = user.id === me?.id
                  return (
                    <tr key={user.id} className={savingId === user.id ? 'is-saving' : undefined}>
                      <td className="cell-title" data-label={t('people.name')}><strong>{user.name}{isMe ? ` (${t('common.you')})` : ''}</strong></td>
                      <td data-label={t('people.email')}><span dir="ltr">{user.email}</span></td>
                      <td data-label={t('people.role')}><span className={`tag tag--${user.role}`}>{t(`role.${user.role}`)}</span></td>
                      <td data-label={t('people.joined')} className="tabular">{formatDate(user.createdAt, locale)}</td>
                      <td data-label={t('people.changeRole')}>
                        <select
                          className="select select--sm"
                          style={{ width: 'auto' }}
                          aria-label={t('people.roleFor', { name: user.name })}
                          value={user.role}
                          disabled={isMe || savingId === user.id}
                          onChange={(event) => handleRole(user.id, user.name, event.target.value as UserRole)}
                        >
                          {roles.map((role) => <option key={role} value={role}>{t(`role.${role}`)}</option>)}
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
