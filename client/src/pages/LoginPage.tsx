import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { IssueStrip } from '../components/IssueStrip'
import { login } from '../features/auth/authApi'
import { setCredentials } from '../features/auth/authSlice'
import { errorText, homeFor } from '../lib/roles'

// a couple of strips on the side panel so the login page already looks like the board
const sample = [
  { id: 'a', title: 'Projector in room 204 does not turn on', location: 'Building A · Room 204', status: 'assigned' as const, priority: 'high' as const, createdAt: new Date().toISOString(), technicianName: 'Nora' },
  { id: 'b', title: 'Water leaking below kitchen sink', location: 'Building B · Kitchen', status: 'in_progress' as const, priority: 'urgent' as const, createdAt: new Date().toISOString(), technicianName: 'Omar' },
  { id: 'c', title: 'Broken chair in the staff room', location: 'Staff room', status: 'completed' as const, priority: 'low' as const, createdAt: new Date().toISOString(), technicianName: 'Nora' }
]

export function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state: RootState) => state.auth.user)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const notice = (location.state as { notice?: string } | null)?.notice

  if (user) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await login(email.trim(), password)
      dispatch(setCredentials({ token: result.accessToken, user: result.user }))
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : homeFor(result.user.role), { replace: true })
    } catch (err) {
      setError(errorText(err, 'Could not sign in. Check your email and password.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <section className="auth__side" aria-label="About FixFlow">
        <Link className="frame__brand" to="/login" aria-label="FixFlow">
          <span className="frame__brand-mark"><Icon name="pin" size={16} /></span>
          <span>FixFlow</span>
        </Link>
        <div>
          <h1>Every maintenance request, pinned on one board.</h1>
          <p style={{ marginTop: 12 }}>Report a problem, watch it get assigned, and see it move to done. Admins drag strips to technicians; technicians work them off the board.</p>
        </div>
        <div className="auth__demo" aria-hidden="true">
          {sample.map((issue) => <IssueStrip key={issue.id} issue={issue} />)}
        </div>
      </section>

      <form className="auth__form" onSubmit={submit} noValidate>
        <div>
          <h2>Sign in</h2>
          <p className="muted">Use the account your admin set up, or register as a reporter.</p>
        </div>

        {notice && <div className="notice notice--success"><Icon name="check" size={16} />{notice}</div>}
        {error && <div className="notice notice--error" role="alert"><Icon name="alert" size={16} />{error}</div>}

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={busy || !email || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="auth__switch">New here? <Link to="/register">Create a reporter account</Link></p>
      </form>
    </main>
  )
}
