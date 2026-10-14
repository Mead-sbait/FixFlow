import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { clearIssuesError, fetchCategories, reportIssue } from '../features/issues/issuesSlice'
import type { IssuePriority } from '../types'

const priorities: { value: IssuePriority; hint: string }[] = [
  { value: 'low', hint: 'Can wait' },
  { value: 'medium', hint: 'This week' },
  { value: 'high', hint: 'Soon' },
  { value: 'urgent', hint: 'Safety or damage' }
]

export function CreateIssuePage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
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
      navigate(`/issues/${result.payload.id}`, { state: { notice: 'Pinned on the board. An admin will assign it.' } })
    }
  }

  return (
    <main className="page page--narrow">
      <Link className="back" to="/dashboard"><Icon name="arrowLeft" size={16} /> My issues</Link>

      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">Report an issue</span></h1>
          <p>Say what is wrong and where. Keep it short, the technician can ask for more.</p>
        </div>
      </div>

      <form className="panel" onSubmit={submit} noValidate>
        {error && <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}><Icon name="alert" size={16} />{error}</div>}

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="field">
            <label htmlFor="issue-title">What is the problem?</label>
            <input id="issue-title" className="input" maxLength={200} placeholder="e.g. Projector in room 204 does not turn on" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={touched && !title.trim()} />
            {touched && !title.trim() && <span className="field__error">A short title is required.</span>}
          </div>

          <div className="field">
            <label htmlFor="issue-location">Where is it?</label>
            <input id="issue-location" className="input" maxLength={200} placeholder="Building, floor, room" value={location} onChange={(e) => setLocation(e.target.value)} aria-invalid={touched && !location.trim()} />
            {touched && !location.trim() && <span className="field__error">The technician needs to find it.</span>}
          </div>

          <div className="field">
            <label htmlFor="issue-category">Category</label>
            <select id="issue-category" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>

          <div className="field">
            <span className="field__label" id="priority-label">How urgent?</span>
            <div className="chip-row" role="group" aria-labelledby="priority-label">
              {priorities.map((item) => (
                <button key={item.value} type="button" className="chip" aria-pressed={priority === item.value} onClick={() => setPriority(item.value)}>
                  <span className={`magnet magnet--${item.value}`} />
                  <span style={{ textTransform: 'capitalize' }}>{item.value}</span>
                  <span className="muted" style={{ fontWeight: 400 }}>· {item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="issue-description">Details</label>
            <textarea id="issue-description" className="textarea" maxLength={5000} placeholder="What happens, since when, anything the technician should know." value={description} onChange={(e) => setDescription(e.target.value)} aria-invalid={touched && !description.trim()} />
            {touched && !description.trim() && <span className="field__error">A few words of detail are required.</span>}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Link className="btn btn--secondary" to="/dashboard">Cancel</Link>
            <button className="btn btn--primary" type="submit" disabled={saving}>
              <Icon name="pin" size={16} /> {saving ? 'Pinning…' : 'Pin it on the board'}
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}
