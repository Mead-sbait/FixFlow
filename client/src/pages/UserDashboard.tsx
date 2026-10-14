import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { IssueStrip } from '../components/IssueStrip'
import { fetchCategories, fetchMyIssues } from '../features/issues/issuesSlice'
import type { IssueStatus } from '../types'

type Filter = 'active' | 'done' | 'all'

const filters: { key: Filter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
  { key: 'all', label: 'All' }
]

const closed: IssueStatus[] = ['completed', 'cancelled']

export function UserDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.auth.token)
  const user = useSelector((state: RootState) => state.auth.user)
  const { items, categories, loading, error } = useSelector((state: RootState) => state.issues)
  const [filter, setFilter] = useState<Filter>('active')

  useEffect(() => {
    if (token) {
      dispatch(fetchMyIssues(token))
      dispatch(fetchCategories(token))
    }
  }, [dispatch, token])

  const categoryName = useMemo(() => {
    const map: Record<string, string> = {}
    for (const category of categories) map[category.id] = category.name
    return map
  }, [categories])

  const visible = items.filter((issue) => {
    if (filter === 'all') return true
    const isClosed = closed.includes(issue.status)
    return filter === 'done' ? isClosed : !isClosed
  })

  const counts = {
    active: items.filter((issue) => !closed.includes(issue.status)).length,
    done: items.filter((issue) => closed.includes(issue.status)).length,
    all: items.length
  }

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">{user?.name.split(' ')[0]}'s issues</span></h1>
          <p>Everything you reported, and where it is on the board.</p>
        </div>
        <div className="page__actions">
          <Link className="btn btn--primary" to="/issues/new"><Icon name="plus" size={16} /> Report an issue</Link>
        </div>
      </div>

      {error && <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}><Icon name="alert" size={16} />{error}</div>}

      <div className="chip-row" style={{ marginBottom: 18 }} role="group" aria-label="Filter issues">
        {filters.map((item) => (
          <button key={item.key} type="button" className="chip" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>
            {item.label} <span className="tabular">{counts[item.key]}</span>
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <div className="skeleton" aria-busy="true" aria-label="Loading"><i /><i /><i /></div>
      ) : visible.length === 0 ? (
        <div className="sheet">
          <div className="empty">
            <Icon name="pin" size={36} />
            <h3>{items.length === 0 ? 'Nothing on the board yet' : 'Nothing here'}</h3>
            <p>{items.length === 0 ? 'Report a problem and it shows up here with its status.' : 'Try another filter.'}</p>
            {items.length === 0 && <Link className="btn btn--primary" to="/issues/new">Report an issue</Link>}
          </div>
        </div>
      ) : (
        <div className="board" style={{ gridAutoFlow: 'row', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', overflow: 'visible' }}>
          {visible.map((issue) => (
            <IssueStrip
              key={issue.id}
              to={`/issues/${issue.id}`}
              issue={{ ...issue, categoryName: categoryName[issue.categoryId] }}
            />
          ))}
        </div>
      )}
    </main>
  )
}
