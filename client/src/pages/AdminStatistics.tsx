import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { fetchAdminStats } from '../features/admin/adminSlice'
import type { CountByName } from '../features/admin/admin.types'

function Bars({ title, rows, empty, green }: { title: string; rows: CountByName[]; empty: string; green?: boolean }) {
  const max = Math.max(...rows.map((row) => row.count), 1)

  return (
    <section className="panel">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <div className="bars">
          {rows.map((row) => (
            <div className="bar" key={row.id}>
              <span>{row.name}</span>
              <div className="bar__track"><div className={green ? 'bar__fill bar__fill--green' : 'bar__fill'} style={{ transform: `scaleX(${row.count / max})` }} /></div>
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
  const token = useSelector((state: RootState) => state.auth.token)
  const { stats, loadingStats, error } = useSelector((state: RootState) => state.admin)

  useEffect(() => {
    if (token) dispatch(fetchAdminStats(token))
  }, [dispatch, token])

  const value = (n?: number) => (loadingStats && !stats ? '…' : n ?? 0)

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">Tally</span></h1>
          <p>{stats ? `${stats.total} issues ever reported, ${stats.cancelled} cancelled.` : 'Counting the board.'}</p>
        </div>
      </div>

      {error && <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}><Icon name="alert" size={16} />{error}</div>}

      <div className="tallies" aria-label="Counts by status">
        <div className="tally"><span>Open</span><strong>{value(stats?.open)}</strong></div>
        <div className="tally tally--blue"><span>Assigned</span><strong>{value(stats?.assigned)}</strong></div>
        <div className="tally"><span>In progress</span><strong>{value(stats?.inProgress)}</strong></div>
        <div className="tally tally--green"><span>Completed</span><strong>{value(stats?.completed)}</strong></div>
        <div className="tally tally--red"><span>Urgent, still open</span><strong>{value(stats?.urgent)}</strong></div>
        <div className="tally tally--red"><span>Waiting for a technician</span><strong>{value(stats?.unassigned)}</strong></div>
      </div>

      {stats && (
        <div className="detail" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Bars title="By category" rows={stats.byCategory} empty="No issues yet." />
          <Bars title="Active work per technician" rows={stats.byTechnician} empty="No technician has active work right now." green />
        </div>
      )}
    </main>
  )
}
