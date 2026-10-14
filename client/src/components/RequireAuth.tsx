import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { homeFor } from '../lib/roles'
import type { UserRole } from '../types'

type Props = { roles?: UserRole[] }

// wraps a group of routes: no session -> login, wrong role -> that role's own home
export function RequireAuth({ roles }: Props) {
  const location = useLocation()
  const { token, user } = useSelector((state: RootState) => state.auth)

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  return <Outlet />
}
