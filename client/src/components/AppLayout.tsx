import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { logout } from '../features/auth/authSlice'
import { NotificationsCenter } from '../features/notifications/components/NotificationsCenter'
import { homeFor } from '../lib/roles'
import { Icon } from './Icon'

const navByRole = {
  user: [
    { to: '/dashboard', label: 'My issues', icon: 'board' as const },
    { to: '/issues/new', label: 'Report', icon: 'plus' as const }
  ],
  technician: [
    { to: '/technician', label: 'My work', icon: 'wrench' as const }
  ],
  admin: [
    { to: '/admin', label: 'Board', icon: 'board' as const, end: true },
    { to: '/admin/issues', label: 'List', icon: 'list' as const },
    { to: '/admin/users', label: 'Users', icon: 'users' as const },
    { to: '/admin/statistics', label: 'Statistics', icon: 'chart' as const }
  ]
}

// the aluminium frame around the board: brand, role tabs, bell, who is signed in
export function AppLayout() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)
  const links = user ? navByRole[user.role] : []

  const signOut = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <>
      <header className="frame">
        <Link className="frame__brand" to={homeFor(user?.role)} aria-label="FixFlow home">
          <span className="frame__brand-mark"><Icon name="pin" size={16} /></span>
          <span>FixFlow</span>
        </Link>

        <nav className="frame__nav" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={'end' in link && link.end}>
              <Icon name={link.icon} size={16} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="frame__spacer" />

        <NotificationsCenter />

        {user && (
          <div className="frame__user">
            <Icon name="user" size={16} />
            <strong>{user.name}</strong>
            <span className="role">{user.role}</span>
            <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out">
              <Icon name="logout" size={16} />
            </button>
          </div>
        )}
      </header>

      <Outlet />
    </>
  )
}
