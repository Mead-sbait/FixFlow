import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { AuthDemo } from '../components/IssueStrip'
import { login } from '../features/auth/authApi'
import { setCredentials } from '../features/auth/authSlice'
import { useT } from '../i18n'
import { LanguageSwitch } from '../i18n/I18nProvider'
import { errorText, homeFor } from '../lib/roles'

export function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, errorMessage } = useT()
  const user = useSelector((state: RootState) => state.auth.user)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const notice = (location.state as { notice?: string } | null)?.notice

  // the request in flight, so a slow answer cannot sign someone in after the page is gone
  // or after a second attempt was started
  const inFlight = useRef<AbortController | null>(null)
  useEffect(() => () => inFlight.current?.abort(), [])

  if (user) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    setBusy(true)
    setError(null)
    try {
      const result = await login(email.trim(), password, controller.signal)
      if (controller.signal.aborted) return
      dispatch(setCredentials({ token: result.accessToken, user: result.user }))
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : homeFor(result.user.role), { replace: true })
    } catch (err) {
      if (controller.signal.aborted) return
      setError(errorText(err, t('login.failed')))
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null
        if (!controller.signal.aborted) setBusy(false)
      }
    }
  }

  return (
    <main className="auth">
      <div className="ambient" aria-hidden="true"><i /><i /><Icon name="wrench" size={72} /><Icon name="board" size={52} /><Icon name="clock" size={60} /><Icon name="check" size={48} /></div>
      <section className="auth__side" aria-label={t('auth.about')}>
        <div className="auth__top">
          <Link className="frame__brand" to="/login" aria-label={t('app.name')}>
            <span className="frame__brand-mark"><Icon name="wrench" size={20} /></span>
            <span>{t('app.name')}</span>
          </Link>
          <LanguageSwitch />
        </div>
        <div>
          <h1>{t('login.headline')}</h1>
          <p style={{ marginTop: 12 }}>{t('login.lead')}</p>
        </div>
        <AuthDemo />
      </section>

      <form className="auth__form" onSubmit={submit}>
        <div>
          <h2>{t('login.title')}</h2>
          <p className="muted">{t('login.sub')}</p>
        </div>

        {notice && <div className="notice notice--success"><Icon name="check" size={16} />{errorMessage(notice)}</div>}
        {error && <div className="notice notice--error" role="alert"><Icon name="alert" size={16} />{errorMessage(error)}</div>}

        <div className="field">
          <label htmlFor="login-email">{t('login.email')}</label>
          <input id="login-email" className="input" type="email" autoComplete="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="login-password">{t('login.password')}</label>
          <div className="password-control">
            <input id="login-password" className="input" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword}>{showPassword ? t('auth.hidePassword') : t('auth.showPassword')}</button>
          </div>
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={busy || !email || !password}>
          {busy ? t('login.submitting') : t('login.submit')}
        </button>

        <p className="auth__switch">{t('login.newHere')} <Link to="/register">{t('login.createLink')}</Link></p>
      </form>
    </main>
  )
}
