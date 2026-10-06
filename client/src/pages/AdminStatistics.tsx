import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { AdminNav } from '../features/admin/components/AdminNav'
import { StatsCards } from '../features/admin/components/StatsCards'
import { fetchAdminStats } from '../features/admin/adminSlice'
import type { CountByName } from '../features/admin/admin.types'
import '../features/admin/admin.css'

function Breakdown({ title, rows, empty }: { title: string; rows: CountByName[]; empty: string }) {
  const max = Math.max(...rows.map((row) => row.count), 1)

  return (
    <section>
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p>{empty}</p>
      ) : (
        rows.map((row) => (
          <div className="stats-bar" key={row.id}>
            <div>
              <span>{row.name}</span>
              <span>{row.count}</span>
            </div>
            <i style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        ))
      )}
    </section>
  )
}

export function AdminStatistics() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.auth.token)
  const role = useSelector((state: RootState) => state.auth.user?.role)
  const { stats, loadingStats, error } = useSelector((state: RootState) => state.admin)

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminStats(token))
    }
  }, [dispatch, token])

  if (!token) {
    return <main className="admin-page"><p>Authentication required.</p></main>
  }

  if (role && role !== 'admin') {
    return <main className="admin-page"><p>Admin access required.</p></main>
  }

  return (
    <main className="admin-page">
      <h1>Statistics</h1>
      <p>Overview of all maintenance issues{stats ? ` (${stats.total} total, ${stats.cancelled} cancelled)` : ''}.</p>

      <AdminNav />

      {error && <div className="admin-error" role="alert"><span>{error}</span></div>}

      <StatsCards stats={stats} loading={loadingStats} />

      {stats && (
        <div className="stats-breakdown">
          <Breakdown title="Issues by category" rows={stats.byCategory} empty="No issues yet." />
          <Breakdown
            title="Active issues per technician"
            rows={stats.byTechnician}
            empty="No technician has active work right now."
          />
        </div>
      )}
    </main>
  )
}
