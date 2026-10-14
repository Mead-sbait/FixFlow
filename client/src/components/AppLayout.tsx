import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { logout } from '../features/auth/authSlice'
import { NotificationsCenter } from '../features/notifications/components/NotificationsCenter'
import { useT } from '../i18n'
import { LanguageSwitch } from '../i18n/I18nProvider'
import type { TranslationKey } from '../i18n/en'
import { homeFor } from '../lib/roles'
import { Icon } from './Icon'

type NavItem = { to: string; label: TranslationKey; icon: 'board' | 'plus' | 'wrench' | 'list' | 'users' | 'chart'; end?: boolean }

const navByRole: Record<'user' | 'technician' | 'admin', NavItem[]> = {
  user: [
    { to: '/dashboard', label: 'nav.myIssues', icon: 'board' },
    { to: '/issues/new', label: 'nav.report', icon: 'plus' }
  ],
  technician: [
    { to: '/technician', label: 'nav.myWork', icon: 'wrench' }
  ],
  admin: [
    { to: '/admin', label: 'nav.board', icon: 'board', end: true },
    { to: '/admin/issues', label: 'nav.list', icon: 'list' },
    { to: '/admin/users', label: 'nav.users', icon: 'users' },
    { to: '/admin/statistics', label: 'nav.statistics', icon: 'chart' }
  ]
}

// the aluminium frame around the board: brand, role tabs, bell, who is signed in
export function AppLayout() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { t } = useT()
  const user = useSelector((state: RootState) => state.auth.user)
  const links = user ? navByRole[user.role] : []

  const signOut = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <>
      <header className="frame">
        <Link className="frame__brand" to={homeFor(user?.role)} aria-label={t('nav.home')}>
          <span className="frame__brand-mark"><Icon name="pin" size={16} /></span>
          <span>{t('app.name')}</span>
        </Link>

        <nav className="frame__nav" aria-label={t('nav.main')}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              <Icon name={link.icon} size={16} />
              <span>{t(link.label)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="frame__spacer" />

        <LanguageSwitch />

        <NotificationsCenter />

        {user && (
          <div className="frame__user">
            <Icon name="user" size={16} />
            <strong>{user.name}</strong>
            <span className="role">{t(`role.${user.role}`)}</span>
            <button type="button" onClick={signOut} aria-label={t('common.signOut')} title={t('common.signOut')}>
              <Icon name="logout" size={16} className="flip-rtl" />
            </button>
          </div>
        )}
      </header>

      <Outlet />
    </>
  )
}
