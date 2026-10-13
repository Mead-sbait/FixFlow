import { useEffect, useRef, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate } from 'react-router-dom'
import type { RootState } from '../app/store'
import { logout } from '../features/auth/authSlice'
import { api } from '../lib/api'
import type { IssuePriority } from '../types'

type Category = { id: string; name: string }

export function CreateIssuePage() {
  const { user, token } = useSelector((state: RootState) => state.auth)
  if (!user || !token) return <Navigate to="/login" replace />
  if (user.role !== 'user') return (
    <main dir="rtl" lang="ar"><h1>إنشاء بلاغ</h1>
      <p role="alert">إنشاء البلاغات متاح لحسابات المستخدمين فقط.</p>
      <Link to="/">العودة للرئيسية</Link>
    </main>
  )
  return <CreateIssueForm key={`${user.id}:${token}`} />
}

function CreateIssueForm() {
  const dispatch = useDispatch()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [pending, setPending] = useState(false)
  const [created, setCreated] = useState(false)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const submission = useRef<AbortController | null>(null)

  useEffect(() => () => submission.current?.abort(), [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    setCategoryId('')
    async function loadCategories() {
      try {
        const { data } = await api.get<Category[]>('/issues/categories', {
          signal: controller.signal, timeout: 15000,
        })
        if (!controller.signal.aborted) setCategories(data)
      } catch (cause: unknown) {
        if (controller.signal.aborted) return
        const status = isAxiosError(cause) ? cause.response?.status : undefined
        setExpired(status === 401)
        setLoadError(status === 401 ? 'انتهت الجلسة أو لم تعد صالحة. سجل الدخول مجددًا.'
          : status === 403 ? 'ليس لديك صلاحية لإنشاء البلاغات.'
            : 'تعذر تحميل التصنيفات. تأكد من اتصال السيرفر وحاول مجددًا.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadCategories()
    return () => controller.abort()
  }, [attempt])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submission.current || loading || loadError || expired) return
    setError('')
    if (!title.trim() || !description.trim() || !location.trim() || !categoryId) {
      setError('أكمل جميع الحقول واختر التصنيف.')
      return
    }
    const controller = new AbortController()
    submission.current = controller
    setPending(true)
    try {
      await api.post('/issues', {
        title: title.trim(), description: description.trim(), location: location.trim(),
        categoryId, priority,
      }, { signal: controller.signal, timeout: 15000 })
      if (!controller.signal.aborted) setCreated(true)
    } catch (cause: unknown) {
      if (controller.signal.aborted) return
      const status = isAxiosError(cause) ? cause.response?.status : undefined
      setExpired(status === 401)
      setError(status === 401 ? 'انتهت الجلسة أو لم تعد صالحة. سجل الدخول مجددًا.'
        : status === 403 ? 'ليس لديك صلاحية لإنشاء البلاغات.'
          : status === 400 ? 'تأكد من الحقول والتصنيف. إذا حُذف التصنيف، أعد فتح الصفحة لتحميل القائمة الجديدة.'
            : 'تعذر تأكيد حفظ البلاغ. راجع «بلاغاتي» قبل إعادة الإرسال لتجنب إنشاء نسخة مكررة.')
    } finally {
      submission.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }

  if (created) return <Navigate to="/issues" replace />

  return (
    <main className="create-issue-page" dir="rtl" lang="ar">
      <Link to="/issues">العودة إلى بلاغاتي</Link>
      <section className="auth-card" aria-labelledby="create-issue-title">
        <h1 id="create-issue-title">إنشاء بلاغ جديد</h1>
        <p>صف مشكلة الصيانة وحدد موقعها وتصنيفها. جميع الحقول مطلوبة.</p>
        {loading && <p role="status">جاري تحميل التصنيفات…</p>}
        {!loading && loadError && <>
          <p className="auth-error" role="alert">{loadError}</p>
          {!expired && <button type="button" onClick={() => setAttempt((value) => value + 1)}>إعادة المحاولة</button>}
        </>}
        {!loading && !loadError && categories.length === 0 && <>
          <p role="status">لا توجد تصنيفات متاحة. تواصل مع مسؤول النظام لإضافتها.</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>تحديث التصنيفات</button>
        </>}
        {!loading && !loadError && categories.length > 0 && <form onSubmit={handleSubmit} aria-busy={pending}>
          <fieldset disabled={pending || expired}>
            <label htmlFor="title">عنوان البلاغ</label>
            <input id="title" name="title" required maxLength={200} value={title}
              onChange={(event) => setTitle(event.target.value)} />
            <label htmlFor="description">وصف المشكلة</label>
            <textarea id="description" name="description" required maxLength={5000} rows={5}
              value={description} onChange={(event) => setDescription(event.target.value)} />
            <label htmlFor="location">الموقع</label>
            <input id="location" name="location" required maxLength={200} value={location}
              placeholder="مثال: الطابق الثاني، غرفة 204"
              onChange={(event) => setLocation(event.target.value)} />
            <label htmlFor="category">التصنيف</label>
            <select id="category" name="categoryId" required value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">اختر التصنيف</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <label htmlFor="priority">الأولوية</label>
            <select id="priority" name="priority" value={priority}
              onChange={(event) => setPriority(event.target.value as IssuePriority)}>
              <option value="low">منخفضة</option><option value="medium">متوسطة</option>
              <option value="high">مرتفعة</option><option value="urgent">عاجلة</option>
            </select>
            <button className="primary" type="submit">{pending ? 'جاري إرسال البلاغ…' : 'إرسال البلاغ'}</button>
          </fieldset>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>}
        {expired && <button type="button" onClick={() => dispatch(logout())}>الانتقال لتسجيل الدخول</button>}
      </section>
    </main>
  )
}
