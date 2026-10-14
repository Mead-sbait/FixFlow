import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { IssueStrip } from '../components/IssueStrip'
import { IssueFilters } from '../features/admin/components/IssueFilters'
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

const priorities: IssuePriority[] = ['low', 'medium', 'high', 'urgent']
const UNASSIGNED = 'unassigned'

// the whole board at once: one column per technician, strips move by drag or by the menu on each strip
export function AdminBoard() {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useT()
  const token = useSelector((state: RootState) => state.auth.token)
  const admin = useSelector((state: RootState) => state.admin)
  const [showDone, setShowDone] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [settled, setSettled] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminLookups(token))
      dispatch(fetchAdminStats(token))
      // the board wants everything that is open, the list page pages through 20 at a time
      dispatch(setFilters({ page: 1, limit: 100, technicianId: '', status: '' }))
    }
  }, [dispatch, token])

  useEffect(() => {
    if (token) dispatch(fetchAdminIssues(token))
  }, [dispatch, token, admin.filters])

  const columns = useMemo(() => {
    const byTechnician: Record<string, AdminIssue[]> = { [UNASSIGNED]: [] }
    for (const technician of admin.technicians) byTechnician[technician.id] = []
    for (const issue of admin.issues) {
      // cancelled strips stay on the board, struck through; only finished ones go behind "show done"
      if (issue.status === 'completed' && !showDone) continue
      const key = issue.technician?.id ?? UNASSIGNED
      if (!byTechnician[key]) byTechnician[key] = []
      byTechnician[key].push(issue)
    }
    return byTechnician
  }, [admin.issues, admin.technicians, showDone])

  if (!token) return null

  const move = async (issueId: string, technicianId: string) => {
    const result = await dispatch(assignIssueTechnician({ token, issueId, technicianId }))
    if (assignIssueTechnician.fulfilled.match(result)) {
      setSettled(issueId)
      window.setTimeout(() => setSettled(null), 300)
      dispatch(fetchAdminStats(token))
    }
  }

  const onDrop = (event: DragEvent, technicianId: string) => {
    event.preventDefault()
    setOver(null)
    const issueId = event.dataTransfer.getData('text/plain') || dragging
    setDragging(null)
    if (!issueId || technicianId === UNASSIGNED) return
    const issue = admin.issues.find((item) => item.id === issueId)
    if (!issue || issue.technician?.id === technicianId) return
    void move(issueId, technicianId)
  }

  const changePriority = async (issueId: string, priority: IssuePriority) => {
    const result = await dispatch(changeIssuePriority({ token, issueId, priority }))
    if (changeIssuePriority.fulfilled.match(result)) dispatch(fetchAdminStats(token))
  }

  const changeStatus = async (issue: AdminIssue, status: 'open' | 'cancelled') => {
    const question = status === 'cancelled'
      ? t('board.confirmCancel', { title: issue.title })
      : t('board.confirmReopen', { title: issue.title })
    if (!window.confirm(question)) return
    const result = await dispatch(changeIssueStatus({ token, issueId: issue.id, status }))
    if (changeIssueStatus.fulfilled.match(result)) dispatch(fetchAdminStats(token))
  }

  const stats = admin.stats
  const columnOrder = [UNASSIGNED, ...admin.technicians.map((technician) => technician.id)]
  const nameOf = (id: string) => (id === UNASSIGNED ? t('board.unassigned') : admin.technicians.find((item) => item.id === id)?.name ?? t('common.unknown'))

  return (
    <main className="page page--full">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">{t('board.title')}</span></h1>
          <p>{t('board.lead')}</p>
        </div>
        <div className="chip-row">
          <button type="button" className="chip" aria-pressed={showDone} onClick={() => setShowDone((value) => !value)}>
            <Icon name="check" size={14} /> {t('board.showDone')}
          </button>
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
        showStatus={false}
        showTechnician={false}
        onChange={(changes) => dispatch(setFilters({ ...changes, limit: 100 }))}
        onReset={() => { dispatch(resetFilters()); dispatch(setFilters({ limit: 100 })) }}
      >
        {stats && (
          <span className="board-tray__count">
            <strong className={stats.unassigned ? 'priority-word--urgent' : undefined}>{t('board.counts', { unassigned: stats.unassigned })}</strong>
            {' · '}{t('board.countsRest', { urgent: stats.urgent, inProgress: stats.inProgress })}
          </span>
        )}
      </IssueFilters>

      {admin.loadingIssues && admin.issues.length === 0 ? (
        <div className="skeleton" aria-busy="true" aria-label={t('common.loading')}><i /><i /><i /></div>
      ) : (
        <div className="board">
          {columnOrder.map((columnId) => {
            const strips = columns[columnId] ?? []
            const isUnassigned = columnId === UNASSIGNED
            return (
              <section
                key={columnId}
                className="column"
                data-column={columnId}
                aria-label={t('board.columnLabel', { name: nameOf(columnId), count: strips.length })}
              >
                <div className="column__head">
                  <h2 className={isUnassigned ? 'marker marker--red column__title' : 'marker marker--blue column__title'}>{nameOf(columnId)}</h2>
                  <span className="count tabular">{strips.length}</span>
                </div>
                <div
                  className={over === columnId && !isUnassigned ? 'column__body column__body--over' : 'column__body'}
                  onDragOver={(event) => {
                    if (isUnassigned) return
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                    if (over !== columnId) setOver(columnId)
                  }}
                  onDragLeave={() => setOver((current) => (current === columnId ? null : current))}
                  onDrop={(event) => onDrop(event, columnId)}
                >
                  {strips.length === 0 && (
                    <div className="column__empty">
                      {isUnassigned ? t('board.nothingWaiting') : t('board.dropHere', { name: nameOf(columnId).split(' ')[0] })}
                    </div>
                  )}
                  {strips.map((issue) => {
                    const closed = issue.status === 'completed' || issue.status === 'cancelled'
                    return (
                      <IssueStrip
                        key={issue.id}
                        issue={{ ...issue, categoryName: issue.category?.name, reporterName: issue.reporter?.name }}
                        draggable={!closed}
                        saving={admin.savingId === issue.id}
                        settle={settled === issue.id}
                        onDragStart={() => setDragging(issue.id)}
                        onDragEnd={() => { setDragging(null); setOver(null) }}
                      >
                        <div className="strip__menu">
                          <select
                            className="select select--sm"
                            aria-label={t('priority.for', { title: issue.title })}
                            value={issue.priority}
                            disabled={closed || admin.savingId === issue.id}
                            onChange={(event) => changePriority(issue.id, event.target.value as IssuePriority)}
                          >
                            {priorities.map((priority) => <option key={priority} value={priority}>{t(`priority.${priority}`)}</option>)}
                          </select>
                          {!closed && (
                            <select
                              className="select select--sm"
                              aria-label={t('board.moveLabel', { title: issue.title })}
                              value=""
                              disabled={admin.savingId === issue.id}
                              onChange={(event) => { if (event.target.value) void move(issue.id, event.target.value) }}
                            >
                              <option value="">{t('board.moveTo')}</option>
                              {admin.technicians.filter((item) => item.id !== issue.technician?.id).map((technician) => (
                                <option key={technician.id} value={technician.id}>{technician.name}</option>
                              ))}
                            </select>
                          )}
                          {closed ? (
                            <button type="button" className="btn btn--secondary btn--sm" onClick={() => changeStatus(issue, 'open')} aria-label={t('board.reopenLabel', { title: issue.title })}>
                              <Icon name="undo" size={14} /> {t('board.reopen')}
                            </button>
                          ) : (
                            <button type="button" className="icon-button icon-button--danger" onClick={() => changeStatus(issue, 'cancelled')} aria-label={t('board.cancelLabel', { title: issue.title })} title={t('board.cancelIssue')}>
                              <Icon name="ban" size={16} />
                            </button>
                          )}
                        </div>
                      </IssueStrip>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
