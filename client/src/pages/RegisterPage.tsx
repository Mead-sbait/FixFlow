import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { register } from '../features/auth/authApi'
import { errorText, homeFor } from '../lib/roles'

export function RegisterPage() {
  const navigate = useNavigate()
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
      navigate('/login', { replace: true, state: { notice: 'Account created. You can sign in now.' } })
    } catch (err) {
      setError(errorText(err, 'Could not create the account.'))
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
          <h1>Report it once. Then watch the board.</h1>
          <p style={{ marginTop: 12 }}>A reporter account lets you pin issues and follow them. Technician and admin accounts are handed out by an admin.</p>
        </div>
      </section>

      <form className="auth__form" onSubmit={submit} noValidate>
        <div>
          <h2>Create account</h2>
          <p className="muted">Reporters only. Ask an admin if you need more.</p>
        </div>

        {error && <div className="notice notice--error" role="alert"><Icon name="alert" size={16} />{error}</div>}

        <div className="field">
          <label htmlFor="reg-name">Name</label>
          <input id="reg-name" className="input" autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input id="reg-email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <input id="reg-password" className="input" type="password" autoComplete="new-password" required minLength={8} aria-invalid={tooShort} value={password} onChange={(e) => setPassword(e.target.value)} />
          {tooShort ? <span className="field__error">At least 8 characters.</span> : <span className="field__hint">At least 8 characters.</span>}
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={busy || !name || !email || password.length < 8}>
          {busy ? 'Creating…' : 'Create account'}
        </button>

        <p className="auth__switch">Already have one? <Link to="/login">Sign in</Link></p>
      </form>
    </main>
  )
}
