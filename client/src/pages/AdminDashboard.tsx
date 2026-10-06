import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { AdminNav } from '../features/admin/components/AdminNav'
import { IssueFilters } from '../features/admin/components/IssueFilters'
import { IssueTable } from '../features/admin/components/IssueTable'
import { StatsCards } from '../features/admin/components/StatsCards'
import {
  assignIssueTechnician,
  changeIssuePriority,
  clearAdminError,
  fetchAdminIssues,
  fetchAdminLookups,
  fetchAdminStats,
  resetFilters,
  setFilters
} from '../features/admin/adminSlice'
import type { IssuePriority } from '../types'
import '../features/admin/admin.css'

export function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.auth.token)
  const role = useSelector((state: RootState) => state.auth.user?.role)
  const admin = useSelector((state: RootState) => state.admin)

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminLookups(token))
      dispatch(fetchAdminStats(token))
    }
  }, [dispatch, token])

  // reload the list whenever a filter or the page changes
  useEffect(() => {
    if (token) {
      dispatch(fetchAdminIssues(token))
    }
  }, [dispatch, token, admin.filters])

  if (!token) {
    return <main className="admin-page"><p>Authentication required.</p></main>
  }

  if (role && role !== 'admin') {
    return <main className="admin-page"><p>Admin access required.</p></main>
  }

  const handleAssign = async (issueId: string, technicianId: string) => {
    const result = await dispatch(assignIssueTechnician({ token, issueId, technicianId }))
    if (assignIssueTechnician.fulfilled.match(result)) {
      dispatch(fetchAdminStats(token))
    }
  }

  const handlePriority = async (issueId: string, priority: IssuePriority) => {
    const result = await dispatch(changeIssuePriority({ token, issueId, priority }))
    if (changeIssuePriority.fulfilled.match(result)) {
      dispatch(fetchAdminStats(token))
    }
  }

  const { pagination } = admin

  return (
    <main className="admin-page">
      <h1>Admin Dashboard</h1>
      <p>Review reported issues, set priorities and assign technicians.</p>

      <AdminNav />

      {admin.error && (
        <div className="admin-error" role="alert">
          <span>{admin.error}</span>
          <button type="button" onClick={() => dispatch(clearAdminError())} aria-label="Dismiss">×</button>
        </div>
      )}

      <StatsCards stats={admin.stats} loading={admin.loadingStats} />

      <IssueFilters
        filters={admin.filters}
        technicians={admin.technicians}
        categories={admin.categories}
        onChange={(changes) => dispatch(setFilters(changes))}
        onReset={() => dispatch(resetFilters())}
      />

      {admin.loadingIssues && admin.issues.length === 0 ? (
        <p>Loading issues...</p>
      ) : admin.issues.length === 0 ? (
        <div className="admin-table-wrap">
          <div className="admin-empty">No issues match these filters.</div>
        </div>
      ) : (
        <IssueTable
          issues={admin.issues}
          technicians={admin.technicians}
          savingId={admin.savingId}
          onAssign={handleAssign}
          onPriorityChange={handlePriority}
        />
      )}

      {pagination.pages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => dispatch(setFilters({ page: pagination.page - 1 }))}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages} ({pagination.total} issues)</span>
          <button
            type="button"
            disabled={pagination.page >= pagination.pages}
            onClick={() => dispatch(setFilters({ page: pagination.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </main>
  )
}
