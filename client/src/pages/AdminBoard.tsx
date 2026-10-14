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
import type { IssuePriority } from '../types'

const priorities: IssuePriority[] = ['low', 'medium', 'high', 'urgent']
const UNASSIGNED = 'unassigned'

// the whole board at once: one column per technician, strips move by drag or by the menu on each strip
export function AdminBoard() {
  const dispatch = useDispatch<AppDispatch>()
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
      const done = issue.status === 'completed' || issue.status === 'cancelled'
      if (done && !showDone) continue
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
      ? `Cancel "${issue.title}"? It stays on the board, struck through.`
      : `Put "${issue.title}" back on the board?`
    if (!window.confirm(question)) return
    const result = await dispatch(changeIssueStatus({ token, issueId: issue.id, status }))
    if (changeIssueStatus.fulfilled.match(result)) dispatch(fetchAdminStats(token))
  }

  const stats = admin.stats
  const columnOrder = [UNASSIGNED, ...admin.technicians.map((technician) => technician.id)]
  const nameOf = (id: string) => (id === UNASSIGNED ? 'Unassigned' : admin.technicians.find((t) => t.id === id)?.name ?? 'Unknown')

  return (
    <main className="page page--full">
      <div className="page__head">
        <div>
          <h1><span className="marker marker--blue">The board</span></h1>
          <p>Drag a strip under a technician to assign it. Red column is waiting on you.</p>
        </div>
        <div className="chip-row">
          <button type="button" className="chip" aria-pressed={showDone} onClick={() => setShowDone((value) => !value)}>
            <Icon name="check" size={14} /> Show done
          </button>
        </div>
      </div>

      {admin.error && (
        <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}>
          <Icon name="alert" size={16} />
          <span>{admin.error}</span>
          <button type="button" className="close" onClick={() => dispatch(clearAdminError())} aria-label="Dismiss"><Icon name="x" size={14} /></button>
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
            <strong className={stats.unassigned ? 'priority-word--urgent' : undefined}>{stats.unassigned} unassigned</strong>
            {' · '}{stats.urgent} urgent · {stats.inProgress} in progress
          </span>
        )}
      </IssueFilters>

      {admin.loadingIssues && admin.issues.length === 0 ? (
        <div className="skeleton" aria-busy="true" aria-label="Loading"><i /><i /><i /></div>
      ) : (
        <div className="board">
          {columnOrder.map((columnId) => {
            const strips = columns[columnId] ?? []
            const isUnassigned = columnId === UNASSIGNED
            return (
              <section
                key={columnId}
                className="column"
                aria-label={`${nameOf(columnId)}, ${strips.length} issues`}
              >
                <div className="column__head">
                  <h2 className={isUnassigned ? 'marker marker--red' : 'marker marker--blue'} style={{ fontSize: 'var(--fs-18)' }}>{nameOf(columnId)}</h2>
                  <span className="count tabular">{strips.length}</span>
                </div>
                <div
                  className={over === columnId && !isUnassigned ? 'column__body column__body--over' : 'column__body'}
                  onDragOver={(event) => { if (!isUnassigned) { event.preventDefault(); setOver(columnId) } }}
                  onDragLeave={() => setOver((current) => (current === columnId ? null : current))}
                  onDrop={(event) => onDrop(event, columnId)}
                >
                  {strips.length === 0 && (
                    <div className="column__empty">
                      {isUnassigned ? 'Nothing waiting. Nice.' : `Drop a strip here to give it to ${nameOf(columnId).split(' ')[0]}.`}
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
                            aria-label={`Priority for ${issue.title}`}
                            value={issue.priority}
                            disabled={closed || admin.savingId === issue.id}
                            onChange={(event) => changePriority(issue.id, event.target.value as IssuePriority)}
                          >
                            {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                          </select>
                          {!closed && (
                            <select
                              className="select select--sm"
                              aria-label={`Move ${issue.title} to`}
                              value={issue.technician?.id ?? ''}
                              disabled={admin.savingId === issue.id}
                              onChange={(event) => { if (event.target.value) void move(issue.id, event.target.value) }}
                            >
                              <option value="">Move to…</option>
                              {admin.technicians.filter((t) => t.id !== issue.technician?.id).map((technician) => (
                                <option key={technician.id} value={technician.id}>{technician.name}</option>
                              ))}
                            </select>
                          )}
                          {closed ? (
                            <button type="button" className="btn btn--secondary btn--sm" onClick={() => changeStatus(issue, 'open')} aria-label={`Reopen ${issue.title}`}>
                              <Icon name="undo" size={14} /> Reopen
                            </button>
                          ) : (
                            <button type="button" className="icon-button" style={{ marginLeft: 'auto', color: 'var(--red-ink)' }} onClick={() => changeStatus(issue, 'cancelled')} aria-label={`Cancel ${issue.title}`} title="Cancel issue">
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
