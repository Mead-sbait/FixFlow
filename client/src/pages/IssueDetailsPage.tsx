import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { RootState } from '../app/store'
import { logout } from '../features/auth/authSlice'
import { api } from '../lib/api'
import { priorityLabels, statusLabels } from '../lib/issueLabels'
import type { UserIssue } from '../types'

export function IssueDetailsPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { user, token } = useSelector((state: RootState) => state.auth)
  if (!user || !token) return <Navigate to="/login" replace />
  if (user.role !== 'user') return (
    <main dir="rtl" lang="ar"><h1>تفاصيل البلاغ</h1>
      <p role="alert">هذه الصفحة مخصصة لحسابات المستخدمين.</p>
      <Link to="/">العودة للرئيسية</Link>
    </main>
  )
  // Discard old data and requests when either the account or issue changes.
  return <IssueDetails key={`${user.id}:${token}:${id}`} issueId={id} />
}

function IssueDetails({ issueId }: { issueId: string }) {
  const dispatch = useDispatch()
  const [issue, setIssue] = useState<UserIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorStatus, setErrorStatus] = useState<number | undefined>()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setIssue(null)
    setError('')
    setErrorStatus(undefined)
    async function loadIssue() {
      if (!/^[a-f\d]{24}$/i.test(issueId)) {
        setErrorStatus(404)
        setError('البلاغ غير موجود أو غير متاح لحسابك.')
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get<UserIssue>(`/issues/${encodeURIComponent(issueId)}`, {
          signal: controller.signal, timeout: 15000,
        })
        if (!controller.signal.aborted) setIssue(data)
      } catch (cause: unknown) {
        if (controller.signal.aborted) return
        const status = isAxiosError(cause) ? cause.response?.status : undefined
        setErrorStatus(status)
        setError(status === 401
          ? 'انتهت الجلسة أو لم تعد صالحة. سجل الدخول من جديد.'
          : status === 404
            ? 'البلاغ غير موجود أو غير متاح لحسابك.'
            : status === 403
              ? 'ليس لديك صلاحية لعرض هذه الصفحة.'
              : 'تعذر تحميل تفاصيل البلاغ. تأكد من الاتصال بالسيرفر وحاول مجددًا.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadIssue()
    return () => controller.abort()
  }, [issueId, attempt])

  return (
    <main dir="rtl" lang="ar">
      <Link to="/issues">العودة إلى بلاغاتي</Link>
      <div className="issues-heading">
        <h1>تفاصيل البلاغ</h1>
        <button type="button" onClick={() => dispatch(logout())}>تسجيل الخروج</button>
      </div>
      {loading && <p role="status">جاري تحميل تفاصيل البلاغ…</p>}
      {!loading && error && <section>
        <p className="auth-error" role="alert">{error}</p>
        {errorStatus === 401
          ? <button type="button" onClick={() => dispatch(logout())}>الانتقال لتسجيل الدخول</button>
          : errorStatus !== 403 && errorStatus !== 404 &&
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>إعادة المحاولة</button>}
      </section>}
      {!loading && !error && issue && <article className="issue-card" aria-labelledby="issue-title">
        <h2 id="issue-title">{issue.title}</h2>
        <dl>
          <div><dt>الحالة</dt><dd>{statusLabels[issue.status] ?? issue.status}</dd></div>
          <div><dt>الأولوية</dt><dd>{priorityLabels[issue.priority] ?? issue.priority}</dd></div>
          <div><dt>الموقع</dt><dd>{issue.location}</dd></div>
          <div><dt>تاريخ الإنشاء</dt><dd><time dateTime={issue.createdAt}>
            {new Date(issue.createdAt).toLocaleString('ar')}
          </time></dd></div>
        </dl>
        <h3>وصف المشكلة</h3>
        <p className="issue-description">{issue.description}</p>
      </article>}
    </main>
  )
}
