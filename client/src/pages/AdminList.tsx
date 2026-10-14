import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { IssueFilters } from '../features/admin/components/IssueFilters'
import { IssueTable } from '../features/admin/components/IssueTable'
import {
  assignIssueTechnician,
  changeIssuePriority,
  changeIssueStatus,
  clearAdminError,
  fetchAdminIssues,
  fetchAdminLookups,
  fetchAdminStats,
  resetFilters,
  setFilters
} from '../features/admin/adminSlice'
import type { AdminIssue } from '../features/admin/admin.types'
import { useT } from '../i18n'
import type { IssuePriority } from '../types'

// every issue as a row, with paging. Same actions as the board, for when you want to search and sort through history
export function AdminList() {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useT()
  const token = useSelector((state: RootState) => state.auth.token)
  const admin = useSelector((state: RootState) => state.admin)

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminLookups(token))
      dispatch(setFilters({ page: 1, limit: 20 }))
    }
  }, [dispatch, token])

  useEffect(() => {
    if (token) dispatch(fetchAdminIssues(token))
  }, [dispatch, token, admin.filters])

  if (!token) return null

  const handleAssign = async (issueId: string, technicianId: string) => {
    const result = await dispatch(assignIssueTechnician({ token, issueId, technicianId }))
    if (assignIssueTechnician.fulfilled.match(result)) dispatch(fetchAdminStats(token))
  }

  const handlePriority = async (issueId: string, priority: IssuePriority) => {
    const result = await dispatch(changeIssuePriority({ token, issueId, priority }))
    if (changeIssuePriority.fulfilled.match(result)) dispatch(fetchAdminStats(token))
  }

  const handleStatus = async (issue: AdminIssue, status: 'open' | 'cancelled') => {
    const question = status === 'cancelled'
      ? t('list.confirmCancel', { title: issue.title })
      : t('list.confirmReopen', { title: issue.title })
    if (!window.confirm(question)) return
    const result = await dispatch(changeIssueStatus({ token, issueId: issue.id, status }))
    if (changeIssueStatus.fulfilled.match(result)) dispatch(fetchAdminStats(token))
  }

  const { pagination } = admin

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">{t('list.title')}</span></h1>
          <p>{t('list.lead')}</p>
        </div>
      </div>

      {admin.error && (
        <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}>
          <Icon name="alert" size={16} />
          <span>{admin.error}</span>
          <button type="button" className="close" onClick={() => dispatch(clearAdminError())} aria-label={t('common.dismiss')}><Icon name="x" size={14} /></button>
        </div>
      )}

      <IssueFilters
        filters={admin.filters}
        technicians={admin.technicians}
        categories={admin.categories}
        onChange={(changes) => dispatch(setFilters(changes))}
        onReset={() => dispatch(resetFilters())}
      >
        <span className="board-tray__count tabular">
          {pagination.total === 1 ? t('common.issueCount', { count: 1 }) : t('common.issuesCount', { count: pagination.total })}
        </span>
      </IssueFilters>

      <div className="sheet">
        {admin.loadingIssues && admin.issues.length === 0 ? (
          <div className="empty"><p className="loading">{t('common.loading')}</p></div>
        ) : admin.issues.length === 0 ? (
          <div className="empty">
            <Icon name="search" size={36} />
            <h3>{t('list.noMatch')}</h3>
            <p>{t('list.noMatchText')}</p>
          </div>
        ) : (
          <IssueTable
            issues={admin.issues}
            technicians={admin.technicians}
            savingId={admin.savingId}
            onAssign={handleAssign}
            onPriorityChange={handlePriority}
            onStatusChange={handleStatus}
          />
        )}

        {pagination.pages > 1 && (
          <div className="sheet__foot">
            <span>{t('common.pageOf', { page: pagination.page, pages: pagination.pages })}</span>
            <div className="pager">
              <button type="button" className="btn btn--secondary btn--sm" disabled={pagination.page <= 1} onClick={() => dispatch(setFilters({ page: pagination.page - 1 }))}>
                <Icon name="arrowLeft" size={14} className="flip-rtl" /> {t('common.previous')}
              </button>
              <button type="button" className="btn btn--secondary btn--sm" disabled={pagination.page >= pagination.pages} onClick={() => dispatch(setFilters({ page: pagination.page + 1 }))}>
                {t('common.next')} <Icon name="arrowRight" size={14} className="flip-rtl" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
