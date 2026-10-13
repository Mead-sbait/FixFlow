import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useSelector } from 'react-redux'
import { Link, Navigate } from 'react-router-dom'
import type { RootState } from '../app/store'
import { api } from '../lib/api'

export function RegisterPage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [created, setCreated] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError('')
    if (!name.trim()) {
      setError('أدخل اسمك.')
      return
    }
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل ولا تتجاوز 72 بايت؛ الأحرف العربية قد تستهلك أكثر من بايت.')
      return
    }
    if (password !== confirmation) {
      setError('كلمة المرور وتأكيدها غير متطابقين.')
      return
    }

    setPending(true)
    try {
      await api.post('/auth/register', {
        name: name.trim(), email: email.trim().toLowerCase(), password,
      }, { timeout: 15000 })
      setPassword('')
      setConfirmation('')
      setCreated(true)
    } catch (cause: unknown) {
      if (isAxiosError(cause)) {
        setError(cause.response?.status === 409
          ? 'هذا البريد الإلكتروني مسجل مسبقًا. سجل الدخول أو استخدم بريدًا آخر.'
          : cause.response?.status === 400
            ? 'تأكد من الاسم والبريد الإلكتروني وشروط كلمة المرور.'
            : !cause.response
              ? 'تعذر تأكيد إنشاء الحساب. تحقق من اتصال السيرفر؛ إذا كان الحساب قد أُنشئ، جرّب تسجيل الدخول.'
              : 'تعذر إنشاء الحساب. حاول مجددًا لاحقًا.')
      } else {
        setError('حدث خطأ غير متوقع. حاول مجددًا.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-page" dir="rtl" lang="ar">
      <Link className="auth-brand" to="/">FixFlow</Link>
      <section className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title">إنشاء حساب</h1>
        {created ? <>
          <p role="status">تم إنشاء حسابك بنجاح. سجل الدخول باستخدام بريدك وكلمة المرور التي اخترتها.</p>
          <Link to="/login">الانتقال لتسجيل الدخول</Link>
        </> : <>
          <p>أنشئ حسابك للإبلاغ عن مشاكل الصيانة ومتابعتها.</p>
          <form onSubmit={handleSubmit} aria-busy={pending}>
            <label htmlFor="name">الاسم</label>
            <input id="name" name="name" autoComplete="name" required maxLength={100}
              value={name} disabled={pending} onChange={(event) => setName(event.target.value)} />
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" name="email" type="email" dir="ltr" autoComplete="username" required
              value={email} disabled={pending} onChange={(event) => setEmail(event.target.value)} />
            <label htmlFor="password">كلمة المرور (8 أحرف على الأقل)</label>
            <input id="password" name="password" type="password" dir="ltr" autoComplete="new-password"
              required minLength={8} value={password} disabled={pending}
              onChange={(event) => setPassword(event.target.value)} />
            <label htmlFor="confirmation">تأكيد كلمة المرور</label>
            <input id="confirmation" name="confirmation" type="password" dir="ltr" autoComplete="new-password"
              required minLength={8} value={confirmation} disabled={pending}
              onChange={(event) => setConfirmation(event.target.value)} />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="primary" type="submit" disabled={pending}>
              {pending ? 'جاري إنشاء الحساب…' : 'إنشاء حساب'}
            </button>
          </form>
          <p>عندك حساب؟ <Link to="/login">تسجيل الدخول</Link></p>
        </>}
      </section>
    </main>
  )
}
