import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import type { RootState } from '../app/store'
import { logout } from '../features/auth/authSlice'
import { UserDashboard } from './UserDashboard'

export function HomePage() {
  const { user, token } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()

  if (user?.role === 'user' && token) {
    return <UserDashboard key={`${user.id}:${token}`} name={user.name} />
  }

  return (
    <main dir="rtl" lang="ar">
      <h1>FixFlow</h1>
      <p>إدارة بلاغات الصيانة ومتابعة حالتها.</p>
      {user ? <>
        <p role="status">أهلًا {user.name}، تم تسجيل الدخول بنجاح.</p>
        <button type="button" onClick={() => dispatch(logout())}>تسجيل الخروج</button>
      </> : <nav className="dashboard-actions" aria-label="الحساب">
        <Link to="/login">تسجيل الدخول</Link>
        <Link to="/register">إنشاء حساب</Link>
      </nav>}
    </main>
  )
}
