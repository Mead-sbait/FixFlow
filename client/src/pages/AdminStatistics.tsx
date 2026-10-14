import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { fetchAdminStats } from '../features/admin/adminSlice'
import type { AdminStats, CountByName } from '../features/admin/admin.types'

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

function statusRows(stats: AdminStats): (CountByName & { tone: Tone })[] {
  return [
    { id: 'open', name: 'Open', count: stats.open, tone: 'grey' },
    { id: 'assigned', name: 'Assigned', count: stats.assigned, tone: 'blue' },
    { id: 'in_progress', name: 'In progress', count: stats.inProgress, tone: 'blue' },
    { id: 'completed', name: 'Completed', count: stats.completed, tone: 'green' },
    { id: 'cancelled', name: 'Cancelled', count: stats.cancelled, tone: 'red' }
  ]
}

// the tally sheet: how much is on the board, and who is carrying it
export function AdminStatistics() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.auth.token)
  const { stats, loadingStats, error } = useSelector((state: RootState) => state.admin)

  useEffect(() => {
    if (token) dispatch(fetchAdminStats(token))
  }, [dispatch, token])

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">Tally</span></h1>
          <p>{stats ? `${stats.total} issues ever reported.` : 'Counting the board.'}</p>
        </div>
      </div>

      {error && <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}><Icon name="alert" size={16} />{error}</div>}

      {loadingStats && !stats ? (
        <div className="skeleton" aria-busy="true" aria-label="Loading"><i /><i /></div>
      ) : stats && (
        <div className="tally-sheet">
          <section className="tally-sheet__section tally-sheet__attention" aria-label="Needs attention">
            <p>
              <strong className={stats.unassigned ? 'priority-word--urgent' : undefined}>{stats.unassigned}</strong> waiting for a technician
            </p>
            <p>
              <strong className={stats.urgent ? 'priority-word--urgent' : undefined}>{stats.urgent}</strong> urgent and still open
            </p>
          </section>
          <Bars title="By status" rows={statusRows(stats)} empty="No issues yet." />
          <Bars title="By category" rows={stats.byCategory} empty="No issues yet." />
          <Bars title="Active work per technician" rows={stats.byTechnician} empty="No technician has active work right now." tone="green" />
        </div>
      )}
    </main>
  )
}
