import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { fetchAdminStats } from '../features/admin/adminSlice'
import type { AdminStats, CountByName } from '../features/admin/admin.types'
import { useT } from '../i18n'

type Tone = 'blue' | 'green' | 'red' | 'grey'

function Bars({ title, rows, empty, tone = 'blue' }: { title: string; rows: (CountByName & { tone?: Tone })[]; empty: string; tone?: Tone }) {
  const max = Math.max(...rows.map((row) => row.count), 1)

  return (
    <section className="tally-sheet__section">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <div className="bars">
          {rows.map((row) => (
            <div className="bar" key={row.id}>
              <span>{row.name}</span>
              <div className="bar__track"><div className={`bar__fill bar__fill--${row.tone ?? tone}`} style={{ transform: `scaleX(${row.count / max})` }} /></div>
              <strong>{row.count}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// the tally sheet: how much is on the board, and who is carrying it
export function AdminStatistics() {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useT()
  const token = useSelector((state: RootState) => state.auth.token)
  const { stats, loadingStats, error } = useSelector((state: RootState) => state.admin)

  useEffect(() => {
    if (token) dispatch(fetchAdminStats(token))
  }, [dispatch, token])

  const statusRows = (data: AdminStats): (CountByName & { tone: Tone })[] => [
    { id: 'open', name: t('status.open'), count: data.open, tone: 'grey' },
    { id: 'assigned', name: t('status.assigned'), count: data.assigned, tone: 'blue' },
    { id: 'in_progress', name: t('status.in_progress'), count: data.inProgress, tone: 'blue' },
    { id: 'completed', name: t('status.completed'), count: data.completed, tone: 'green' },
    { id: 'cancelled', name: t('status.cancelled'), count: data.cancelled, tone: 'red' }
  ]

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">{t('tally.title')}</span></h1>
          <p>{stats ? t('tally.lead', { total: stats.total }) : t('tally.counting')}</p>
        </div>
      </div>

      {error && <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}><Icon name="alert" size={16} />{error}</div>}

      {loadingStats && !stats ? (
        <div className="skeleton" aria-busy="true" aria-label={t('common.loading')}><i /><i /></div>
      ) : stats && (
        <div className="tally-sheet">
          <section className="tally-sheet__section tally-sheet__attention" aria-label={t('tally.attention')}>
            <p>
              <strong className={stats.unassigned ? 'priority-word--urgent' : undefined}>{stats.unassigned}</strong> {t('tally.waiting')}
            </p>
            <p>
              <strong className={stats.urgent ? 'priority-word--urgent' : undefined}>{stats.urgent}</strong> {t('tally.urgentOpen')}
            </p>
          </section>
          <Bars title={t('tally.byStatus')} rows={statusRows(stats)} empty={t('tally.noIssues')} />
          <Bars title={t('tally.byCategory')} rows={stats.byCategory} empty={t('tally.noIssues')} />
          <Bars title={t('tally.perTechnician')} rows={stats.byTechnician} empty={t('tally.noActive')} tone="green" />
        </div>
      )}
    </main>
  )
}
