import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { register } from '../features/auth/authApi'
import { useT } from '../i18n'
import { LanguageSwitch } from '../i18n/I18nProvider'
import { errorText, homeFor } from '../lib/roles'

export function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useT()
  const user = useSelector((state: RootState) => state.auth.user)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  const tooShort = password.length > 0 && password.length < 8

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (tooShort) return
    setBusy(true)
    setError(null)
    try {
      await register(name.trim(), email.trim(), password)
      navigate('/login', { replace: true, state: { notice: t('register.created') } })
    } catch (err) {
      setError(errorText(err, t('register.failed')))
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
          <h1>{t('register.headline')}</h1>
          <p style={{ marginTop: 12 }}>{t('register.lead')}</p>
        </div>
      </section>

      <form className="auth__form" onSubmit={submit} noValidate>
        <div>
          <h2>{t('register.title')}</h2>
          <p className="muted">{t('register.sub')}</p>
        </div>

        {error && <div className="notice notice--error" role="alert"><Icon name="alert" size={16} />{error}</div>}

        <div className="field">
          <label htmlFor="reg-name">{t('register.name')}</label>
          <input id="reg-name" className="input" autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="reg-email">{t('login.email')}</label>
          <input id="reg-email" className="input" type="email" autoComplete="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="reg-password">{t('login.password')}</label>
          <input id="reg-password" className="input" type="password" autoComplete="new-password" required minLength={8} dir="ltr" aria-invalid={tooShort} value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className={tooShort ? 'field__error' : 'field__hint'}>{t('register.passwordHint')}</span>
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={busy || !name || !email || password.length < 8}>
          {busy ? t('register.submitting') : t('register.submit')}
        </button>

        <p className="auth__switch">{t('register.haveOne')} <Link to="/login">{t('register.signInLink')}</Link></p>
      </form>
    </main>
  )
}
