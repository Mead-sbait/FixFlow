import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { IssueStrip } from '../components/IssueStrip'
import { fetchCategories, fetchMyIssues } from '../features/issues/issuesSlice'
import { useT } from '../i18n'
import type { TranslationKey } from '../i18n/en'
import type { IssueStatus } from '../types'

type Filter = 'active' | 'done' | 'all'

const filters: { key: Filter; label: TranslationKey }[] = [
  { key: 'active', label: 'mine.active' },
  { key: 'done', label: 'mine.done' },
  { key: 'all', label: 'mine.all' }
]

const closed: IssueStatus[] = ['completed', 'cancelled']

export function UserDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useT()
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
          <h1><span className="marker marker--blue">{t('mine.title', { name: user?.name.split(' ')[0] ?? '' })}</span></h1>
          <p>{t('mine.lead')}</p>
        </div>
        <div className="page__actions">
          <Link className="btn btn--primary" to="/issues/new"><Icon name="plus" size={16} /> {t('mine.report')}</Link>
        </div>
      </div>

      {error && <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}><Icon name="alert" size={16} />{error}</div>}

      <div className="chip-row" style={{ marginBottom: 18 }} role="group" aria-label={t('mine.filter')}>
        {filters.map((item) => (
          <button key={item.key} type="button" className="chip" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>
            {t(item.label)} <span className="tabular">{counts[item.key]}</span>
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <div className="skeleton" aria-busy="true" aria-label={t('common.loading')}><i /><i /><i /></div>
      ) : visible.length === 0 ? (
        <div className="sheet">
          <div className="empty">
            <Icon name="pin" size={36} />
            <h3>{items.length === 0 ? t('mine.emptyTitle') : t('mine.nothingHere')}</h3>
            <p>{items.length === 0 ? t('mine.emptyText') : t('mine.tryFilter')}</p>
            {items.length === 0 && <Link className="btn btn--primary" to="/issues/new">{t('mine.report')}</Link>}
          </div>
        </div>
      ) : (
        <div className="strip-grid">
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
