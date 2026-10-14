import type { AdminStats } from '../admin.types'

type Props = {
  stats: AdminStats | null
  loading: boolean
}

export function StatsCards({ stats, loading }: Props) {
  const value = (n?: number) => (loading && !stats ? '...' : n ?? 0)

  return (
    <div className="stats-cards">
      <div className="stats-card">
        <span>Open</span>
        <strong>{value(stats?.open)}</strong>
      </div>
      <div className="stats-card">
        <span>Assigned</span>
        <strong>{value(stats?.assigned)}</strong>
      </div>
      <div className="stats-card">
        <span>In progress</span>
        <strong>{value(stats?.inProgress)}</strong>
      </div>
      <div className="stats-card">
        <span>Completed</span>
        <strong>{value(stats?.completed)}</strong>
      </div>
      <div className="stats-card stats-card--urgent">
        <span>Urgent</span>
        <strong>{value(stats?.urgent)}</strong>
      </div>
      <div className="stats-card">
        <span>Unassigned</span>
        <strong>{value(stats?.unassigned)}</strong>
      </div>
    </div>
  )
}
