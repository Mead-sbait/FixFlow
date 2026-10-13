import { useEffect, useRef, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate } from 'react-router-dom'
import type { RootState } from '../app/store'
import { setCredentials } from '../features/auth/authSlice'
import { api } from '../lib/api'
import type { AuthUser } from '../types'

export function LoginPage() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const submission = useRef<AbortController | null>(null)

  useEffect(() => () => submission.current?.abort(), [])

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submission.current) return
    const controller = new AbortController()
    submission.current = controller
    setError('')
    setPending(true)
    try {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
        '/auth/login', { email: email.trim().toLowerCase(), password },
        { timeout: 15000, signal: controller.signal },
      )
      if (controller.signal.aborted) return
      dispatch(setCredentials({ user: data.user, token: data.accessToken }))
    } catch (cause: unknown) {
      if (controller.signal.aborted) return
      if (isAxiosError(cause)) {
        setError(cause.response?.status === 401
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
          : cause.response?.status === 400
            ? 'تأكد من صيغة البريد الإلكتروني وكلمة المرور.'
            : !cause.response
              ? 'تعذر الاتصال بالسيرفر. تأكد من تشغيله وحاول مجددًا.'
              : 'تعذر تسجيل الدخول. حاول مجددًا لاحقًا.')
      } else {
        setError('حدث خطأ غير متوقع. حاول مجددًا.')
      }
    } finally {
      submission.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }

  return (
    <main className="auth-page" dir="rtl" lang="ar">
      <Link className="auth-brand" to="/">FixFlow</Link>
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">تسجيل الدخول</h1>
        <p>ادخل إلى حسابك لمتابعة بلاغات الصيانة.</p>
        <form onSubmit={handleSubmit} aria-busy={pending}>
          <label htmlFor="email">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" dir="ltr" autoComplete="username"
            required value={email} disabled={pending} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="password">كلمة المرور</label>
          <input id="password" name="password" type="password" dir="ltr" autoComplete="current-password"
            required minLength={8} value={password} disabled={pending}
            onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary" type="submit" disabled={pending}>
            {pending ? 'جاري تسجيل الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
        <p>ما عندك حساب؟ <Link to="/register">إنشاء حساب</Link></p>
      </section>
    </main>
  )
}
