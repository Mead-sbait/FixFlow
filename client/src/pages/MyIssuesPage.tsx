import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate } from 'react-router-dom'
import type { RootState } from '../app/store'
import { logout } from '../features/auth/authSlice'
import { api } from '../lib/api'
import type { UserIssue } from '../types'
import { priorityLabels, statusLabels } from '../lib/issueLabels'

export function MyIssuesPage() {
  const { user, token } = useSelector((state: RootState) => state.auth)
  if (!user || !token) return <Navigate to="/login" replace />
  if (user.role !== 'user') return (
    <main dir="rtl" lang="ar"><h1>بلاغاتي</h1>
      <p role="alert">هذه الصفحة مخصصة لحسابات المستخدمين.</p>
      <Link to="/">العودة للرئيسية</Link>
    </main>
  )
  // Remount when the session changes so another account never sees cached issues.
  return <IssuesList key={`${user.id}:${token}`} />
}

function IssuesList() {
  const dispatch = useDispatch()
  const [issues, setIssues] = useState<UserIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setExpired(false)
    setIssues([])
    async function loadIssues() {
      try {
        const { data } = await api.get<UserIssue[]>('/issues', {
          signal: controller.signal, timeout: 15000,
        })
        if (!controller.signal.aborted) setIssues(data)
      } catch (cause: unknown) {
        if (controller.signal.aborted) return
        const status = isAxiosError(cause) ? cause.response?.status : undefined
        setExpired(status === 401)
        setError(status === 401
          ? 'انتهت الجلسة أو لم تعد صالحة. سجل الدخول من جديد.'
          : status === 403
            ? 'ليس لديك صلاحية لعرض هذه الصفحة.'
            : 'تعذر تحميل البلاغات. تأكد من الاتصال بالسيرفر وحاول مجددًا.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadIssues()
    return () => controller.abort()
  }, [attempt])

  return (
    <main dir="rtl" lang="ar">
      <Link to="/">العودة للرئيسية</Link>
      <div className="issues-heading">
        <h1>بلاغاتي</h1>
        <button type="button" onClick={() => dispatch(logout())}>تسجيل الخروج</button>
      </div>
      <p>بلاغات الصيانة الخاصة بك، من الأحدث إلى الأقدم.</p>
      <p><Link to="/issues/new">إنشاء بلاغ جديد</Link></p>
      {loading && <p role="status">جاري تحميل البلاغات…</p>}
      {!loading && error && <section>
        <p className="auth-error" role="alert">{error}</p>
        {expired
          ? <button type="button" onClick={() => dispatch(logout())}>الانتقال لتسجيل الدخول</button>
          : <button type="button" onClick={() => setAttempt((value) => value + 1)}>إعادة المحاولة</button>}
      </section>}
      {!loading && !error && (issues.length === 0
        ? <p className="issues-empty" role="status">ليس لديك بلاغات حتى الآن.</p>
        : <ul className="issues-list">
          {issues.map((issue) => <li key={issue.id} className="issue-card">
            <h2><Link to={`/issues/${encodeURIComponent(issue.id)}`}>{issue.title}</Link></h2>
            <dl>
              <div><dt>الحالة</dt><dd>{statusLabels[issue.status] ?? issue.status}</dd></div>
              <div><dt>الأولوية</dt><dd>{priorityLabels[issue.priority] ?? issue.priority}</dd></div>
              <div><dt>الموقع</dt><dd>{issue.location}</dd></div>
              <div><dt>تاريخ الإنشاء</dt><dd><time dateTime={issue.createdAt}>
                {new Date(issue.createdAt).toLocaleDateString('ar')}
              </time></dd></div>
            </dl>
          </li>)}
        </ul>)}
    </main>
  )
}
