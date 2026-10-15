import { Link, useParams } from 'react-router-dom'
import { getAdminIssue, updateIssueStatus } from '../features/admin/adminApi'
import { StatusTag } from '../components/IssueStrip'
import { TechnicianComments } from '../features/technician/components/TechnicianComments'
import { formatDate } from '../lib/roles'
import { useEffect, useRef, useState } from 'react'
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
  const { t, errorMessage } = useT()
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
          <span>{errorMessage(admin.error)}</span>
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

export function AdminIssueDetails() {
  const { id } = useParams<{ id: string }>()
  return <AdminIssueDetailsContent key={id} />
}

function AdminIssueDetailsContent() {
  const { id } = useParams<{ id: string }>()
  const token = useSelector((state: RootState) => state.auth.token)
  const revision = useSelector((state: RootState) => state.admin.issues)
  const { t, locale, category, errorMessage } = useT()
  const [issue, setIssue] = useState<AdminIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'open' | 'completed'>('completed')
  const [confirmError, setConfirmError] = useState(false)
  const confirmDialog = useRef<HTMLDialogElement>(null)
  const closed = issue?.status === 'completed' || issue?.status === 'cancelled'
  useEffect(() => {
    if (confirmOpen) confirmDialog.current?.showModal()
    else confirmDialog.current?.close()
  }, [confirmOpen])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    if (!token || !id) return
    getAdminIssue(token, id).then(value => { if (active) { setIssue(value); setError('') } }).catch(() => { if (active) setError('Unable to load issue') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, id, revision])
  const changeStatus = async () => {
    if (!token || !issue || saving) return
    setSaving(true)
    setConfirmError(false)
    try { setIssue(await updateIssueStatus(token, issue.id, confirmAction)); setError(''); setConfirmOpen(false) }
    catch { setConfirmError(true) }
    finally { setSaving(false) }
  }
  return <main className="page">
    <Link className="back" to="/admin/issues"><Icon name="arrowLeft" size={16} className="flip-rtl" />{t('list.title')}</Link>
    {error && <div className="notice notice--error" role="alert">{errorMessage(error)}</div>}
    {loading ? <p className="loading">{t('common.loading')}</p> : !issue ? <div className="empty"><h2>{t('issue.notFound')}</h2></div> : <>
      <div className="page__head"><div className="detail__title"><h1>{issue.title}</h1><StatusTag status={issue.status} /></div>
        <button className="btn btn--secondary" disabled={saving} onClick={() => { setConfirmAction(closed ? 'open' : 'completed'); setConfirmError(false); setConfirmOpen(true) }}>{t(issue.status === 'completed' || issue.status === 'cancelled' ? 'board.reopen' : 'issue.close')}</button>
      </div>
      <div className="detail"><div className="stack">
        <section className="panel"><h2>{t('issue.details')}</h2><p className="description">{issue.description}</p></section>
        {token && <div className="panel"><p className="muted">{t('comments.adminReadOnly')}</p><TechnicianComments key={issue.id} token={token} issueId={issue.id} readOnly /></div>}
      </div><aside className="panel"><h2>{t('issue.onStrip')}</h2><dl className="facts">
        <div><dt>{t('list.reporter')}</dt><dd>{issue.reporter?.name ?? t('common.unknown')}</dd></div>
        <div><dt>{t('issue.location')}</dt><dd>{issue.location}</dd></div>
        <div><dt>{t('issue.category')}</dt><dd>{category(issue.category?.name)}</dd></div>
        <div><dt>{t('issue.priority')}</dt><dd>{t(`priority.${issue.priority}`)}</dd></div>
        <div><dt>{t('issue.technician')}</dt><dd>{issue.technician?.name ?? t('issue.notYet')}</dd></div>
        <div><dt>{t('issue.reported')}</dt><dd>{formatDate(issue.createdAt, locale, true)}</dd></div>
      </dl></aside></div>
    </>}
    <dialog ref={confirmDialog} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-description" onCancel={event => { event.preventDefault(); if (!saving) setConfirmOpen(false) }}>
      <div className="confirm-dialog__icon"><Icon name={confirmAction === 'open' ? 'undo' : 'check'} size={28} /></div>
      <h2 id="confirm-title">{t(confirmAction === 'open' ? 'board.reopen' : 'issue.close')}</h2>
      <p id="confirm-description">{t(confirmAction === 'open' ? 'list.confirmReopen' : 'issue.confirmClose', { title: issue?.title ?? '' })}</p>
      {confirmError && <div className="notice notice--error" role="alert">{t('issue.closeFailed')}</div>}
      <div className="confirm-dialog__actions">
        <button type="button" className="btn btn--secondary" autoFocus disabled={saving} onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</button>
        <button type="button" className="btn btn--primary" disabled={saving} onClick={() => void changeStatus()}>{saving ? t('common.loading') : t(confirmAction === 'open' ? 'board.reopen' : 'issue.close')}</button>
      </div>
    </dialog>
  </main>
}
