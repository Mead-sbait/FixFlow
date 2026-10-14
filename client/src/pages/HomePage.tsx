import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { homeFor } from '../lib/roles'

// nothing to see here, send people to their own board
export function HomePage() {
  const user = useSelector((state: RootState) => state.auth.user)
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />
}
