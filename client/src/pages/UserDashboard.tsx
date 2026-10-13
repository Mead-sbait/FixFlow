import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { api } from '../lib/api'
import { priorityLabels, statusLabels } from '../lib/issueLabels'
import type { IssueStatus, UserIssue } from '../types'

const statuses: IssueStatus[] = ['open', 'assigned', 'in_progress', 'completed', 'cancelled']

export function UserDashboard({ name }: { name: string }) {
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
    async function loadDashboard() {
      try {
        const { data } = await api.get<UserIssue[]>('/issues', {
          signal: controller.signal, timeout: 15000,
        })
        if (!controller.signal.aborted) setIssues(data)
      } catch (cause: unknown) {
        if (controller.signal.aborted) return
        const status = isAxiosError(cause) ? cause.response?.status : undefined
        setExpired(status === 401)
        setError(status === 401 ? 'انتهت الجلسة أو لم تعد صالحة. سجل الدخول من جديد.'
          : status === 403 ? 'ليس لديك صلاحية لعرض لوحة المستخدم.'
            : 'تعذر تحميل ملخص البلاغات. تأكد من الاتصال بالسيرفر وحاول مجددًا.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadDashboard()
    return () => controller.abort()
  }, [attempt])

  return (
    <main dir="rtl" lang="ar">
      <div className="issues-heading">
        <div><p>FixFlow</p><h1>لوحة المستخدم</h1></div>
        <button type="button" onClick={() => dispatch(logout())}>تسجيل الخروج</button>
      </div>
      <p className="dashboard-welcome">أهلًا {name}، تابع بلاغات الصيانة الخاصة بك من هنا.</p>
      <nav className="dashboard-actions" aria-label="إجراءات البلاغات">
        <Link className="dashboard-primary" to="/issues/new">إنشاء بلاغ جديد</Link>
        <Link to="/issues">عرض جميع بلاغاتي</Link>
        <button type="button" disabled={loading} onClick={() => setAttempt((value) => value + 1)}>تحديث الملخص</button>
      </nav>
      {loading && <p role="status">جاري تحميل ملخص بلاغاتك…</p>}
      {!loading && error && <section>
        <p className="auth-error" role="alert">{error}</p>
        {expired
          ? <button type="button" onClick={() => dispatch(logout())}>تسجيل الدخول مجددًا</button>
          : <button type="button" onClick={() => setAttempt((value) => value + 1)}>إعادة المحاولة</button>}
      </section>}
      {!loading && !error && <>
        <section aria-labelledby="summary-title">
          <h2 id="summary-title">ملخص بلاغاتي</h2>
          <dl className="dashboard-stats">
            <div><dt>إجمالي البلاغات</dt><dd>{issues.length}</dd></div>
            {statuses.map((status) => <div key={status}>
              <dt>{statusLabels[status]}</dt>
              <dd>{issues.filter((issue) => issue.status === status).length}</dd>
            </div>)}
          </dl>
        </section>
        <section aria-labelledby="recent-title">
          <h2 id="recent-title">آخر البلاغات</h2>
          {issues.length === 0
            ? <p className="issues-empty" role="status">ليس لديك بلاغات حتى الآن. يمكنك البدء من زر «إنشاء بلاغ جديد».</p>
            : <ul className="issues-list">
              {issues.slice(0, 5).map((issue) => <li className="issue-card" key={issue.id}>
                <h3><Link to={`/issues/${encodeURIComponent(issue.id)}`}>{issue.title}</Link></h3>
                <dl>
                  <div><dt>الحالة</dt><dd>{statusLabels[issue.status] ?? issue.status}</dd></div>
                  <div><dt>الأولوية</dt><dd>{priorityLabels[issue.priority] ?? issue.priority}</dd></div>
                  <div><dt>الموقع</dt><dd>{issue.location}</dd></div>
                  <div><dt>تاريخ الإنشاء</dt><dd><time dateTime={issue.createdAt}>
                    {new Date(issue.createdAt).toLocaleDateString('ar')}
                  </time></dd></div>
                </dl>
              </li>)}
            </ul>}
        </section>
      </>}
    </main>
  )
}
