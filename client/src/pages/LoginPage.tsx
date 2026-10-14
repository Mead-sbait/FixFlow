import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { IssueStrip } from '../components/IssueStrip'
import { login } from '../features/auth/authApi'
import { setCredentials } from '../features/auth/authSlice'
import { useT } from '../i18n'
import { LanguageSwitch } from '../i18n/I18nProvider'
import { errorText, homeFor } from '../lib/roles'

export function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useT()
  const user = useSelector((state: RootState) => state.auth.user)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const notice = (location.state as { notice?: string } | null)?.notice

  if (user) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  // a couple of strips on the side panel so the login page already looks like the board
  const now = new Date().toISOString()
  const sample = [
    { id: 'a', title: t('sample.1.title'), location: t('sample.1.location'), status: 'assigned' as const, priority: 'high' as const, createdAt: now, technicianName: 'Nora' },
    { id: 'b', title: t('sample.2.title'), location: t('sample.2.location'), status: 'in_progress' as const, priority: 'urgent' as const, createdAt: now, technicianName: 'Omar' },
    { id: 'c', title: t('sample.3.title'), location: t('sample.3.location'), status: 'completed' as const, priority: 'low' as const, createdAt: now, technicianName: 'Nora' }
  ]

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
      setError(errorText(err, t('login.failed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <section className="auth__side" aria-label={t('auth.about')}>
        <div className="auth__top">
          <Link className="frame__brand" to="/login" aria-label={t('app.name')}>
            <span className="frame__brand-mark"><Icon name="pin" size={16} /></span>
            <span>{t('app.name')}</span>
          </Link>
          <LanguageSwitch />
        </div>
        <div>
          <h1>{t('login.headline')}</h1>
          <p style={{ marginTop: 12 }}>{t('login.lead')}</p>
        </div>
        <div className="auth__demo" aria-hidden="true">
          {sample.map((issue) => <IssueStrip key={issue.id} issue={issue} />)}
        </div>
      </section>

      <form className="auth__form" onSubmit={submit} noValidate>
        <div>
          <h2>{t('login.title')}</h2>
          <p className="muted">{t('login.sub')}</p>
        </div>

        {notice && <div className="notice notice--success"><Icon name="check" size={16} />{notice}</div>}
        {error && <div className="notice notice--error" role="alert"><Icon name="alert" size={16} />{error}</div>}

        <div className="field">
          <label htmlFor="login-email">{t('login.email')}</label>
          <input id="login-email" className="input" type="email" autoComplete="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="login-password">{t('login.password')}</label>
          <input id="login-password" className="input" type="password" autoComplete="current-password" required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={busy || !email || !password}>
          {busy ? t('login.submitting') : t('login.submit')}
        </button>

        <p className="auth__switch">{t('login.newHere')} <Link to="/register">{t('login.createLink')}</Link></p>
      </form>
    </main>
  )
}
