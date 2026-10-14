import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { clearIssuesError, fetchCategories, reportIssue } from '../features/issues/issuesSlice'
import { useT } from '../i18n'
import type { IssuePriority } from '../types'

const priorities: IssuePriority[] = ['low', 'medium', 'high', 'urgent']

export function CreateIssuePage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { t, errorMessage, category: categoryLabel } = useT()
  const token = useSelector((state: RootState) => state.auth.token)
  const { categories, saving, error } = useSelector((state: RootState) => state.issues)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [description, setDescription] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (token) dispatch(fetchCategories(token))
    return () => { dispatch(clearIssuesError()) }
  }, [dispatch, token])

  useEffect(() => {
    if (!categoryId && categories.length) setCategoryId(categories[0].id)
  }, [categories, categoryId])

  const valid = title.trim() && location.trim() && categoryId && description.trim()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!token || !valid) return
    const result = await dispatch(reportIssue({
      token,
      data: { title: title.trim(), location: location.trim(), categoryId, priority, description: description.trim() }
    }))
    if (reportIssue.fulfilled.match(result)) {
      navigate(`/issues/${result.payload.id}`, { state: { notice: 'report.pinned' } })
    }
  }

  return (
    <main className="page page--narrow">
      <Link className="back" to="/dashboard"><Icon name="arrowLeft" size={16} className="flip-rtl" /> {t('nav.myIssues')}</Link>

      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">{t('report.title')}</span></h1>
          <p>{t('report.lead')}</p>
        </div>
      </div>

      <form className="panel" onSubmit={submit} noValidate>
        {error && <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}><Icon name="alert" size={16} />{errorMessage(error)}</div>}

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="field">
            <label htmlFor="issue-title">{t('report.what')}</label>
            <input id="issue-title" className="input" maxLength={200} placeholder={t('report.whatPlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={touched && !title.trim()} />
            {touched && !title.trim() && <span className="field__error">{t('report.whatError')}</span>}
          </div>

          <div className="field">
            <label htmlFor="issue-location">{t('report.where')}</label>
            <input id="issue-location" className="input" maxLength={200} placeholder={t('report.wherePlaceholder')} value={location} onChange={(e) => setLocation(e.target.value)} aria-invalid={touched && !location.trim()} />
            {touched && !location.trim() && <span className="field__error">{t('report.whereError')}</span>}
          </div>

          <div className="field">
            <label htmlFor="issue-category">{t('report.category')}</label>
            <div className="category-picker">
          <Icon name="board" size={18} />
          <select id="issue-category" className="select category-picker__select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((category) => <option key={category.id} value={category.id}>{categoryLabel(category.name)}</option>)}
            </select>
        </div>
          </div>

          <div className="field">
            <span className="field__label" id="priority-label">{t('report.urgency')}</span>
            <div className="chip-row" role="group" aria-labelledby="priority-label">
              {priorities.map((value) => (
                <button key={value} type="button" className="chip" aria-pressed={priority === value} onClick={() => setPriority(value)}>
                  <span className={`magnet magnet--${value}`} />
                  <span>{t(`priority.${value}`)}</span>
                  <span className="muted" style={{ fontWeight: 400 }}>· {t(`priority.hint.${value}`)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="issue-description">{t('report.details')}</label>
            <textarea id="issue-description" className="textarea" maxLength={5000} placeholder={t('report.detailsPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} aria-invalid={touched && !description.trim()} />
            {touched && !description.trim() && <span className="field__error">{t('report.detailsError')}</span>}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Link className="btn btn--secondary" to="/dashboard">{t('common.cancel')}</Link>
            <button className="btn btn--primary" type="submit" disabled={saving}>
              <Icon name="pin" size={16} /> {saving ? t('report.submitting') : t('report.submit')}
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}
