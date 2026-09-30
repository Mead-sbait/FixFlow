import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import type { AppDispatch, RootState } from '../app/store'
import {
  assignTechnician,
  clearAdminError,
  loadAdminDashboard,
  updateFilters,
  updateIssuePriority
} from '../features/admin/adminSlice'
import type { AdminIssue, IssuePriority, IssueStatus } from '../types'

const statusLabels: Record<IssueStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

const priorityLabels: Record<IssuePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
}

function ageLabel(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Unknown'
  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function IssueSkeleton() {
  return (
    <div className="queue-skeleton" aria-label="Loading issue queue" aria-busy="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <div className="skeleton-row" key={row}>
          <span className="skeleton-block skeleton-title" />
          <span className="skeleton-block" />
          <span className="skeleton-block" />
          <span className="skeleton-block" />
        </div>
      ))}
    </div>
  )
}

function QueueRow({
  issue,
  selected,
  changing,
  onSelect,
  onPriority
}: {
  issue: AdminIssue
  selected: boolean
  changing: boolean
  onSelect: () => void
  onPriority: (priority: IssuePriority) => void
}) {
  return (
    <tr className={selected ? 'is-selected' : undefined}>
      <td data-label="Issue">
        <button className="issue-title-button" type="button" onClick={onSelect} aria-pressed={selected}>
          <span>{issue.title}</span>
          <small>{issue.id} · {issue.location}</small>
        </button>
      </td>
      <td data-label="Status"><span className={`status-pill status-${issue.status}`}>{statusLabels[issue.status]}</span></td>
      <td data-label="Priority">
        <label className="sr-only" htmlFor={`priority-${issue.id}`}>Priority for {issue.title}</label>
        <select
          id={`priority-${issue.id}`}
          className={`priority-select priority-${issue.priority}`}
          value={issue.priority}
          disabled={changing}
          onChange={(event) => onPriority(event.target.value as IssuePriority)}
        >
          {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </td>
      <td data-label="Assignee">
        <span className={issue.technician ? 'assignee' : 'assignee is-empty'}>
          <span className="avatar" aria-hidden="true">{issue.technician?.name.charAt(0) ?? '—'}</span>
          {issue.technician?.name ?? 'Unassigned'}
        </span>
      </td>
      <td data-label="Reported"><span className="age-label">{ageLabel(issue.createdAt)}</span></td>
      <td className="manage-cell">
        <button className="manage-button" type="button" onClick={onSelect} aria-label={`Manage ${issue.title}`}>
          Manage <span aria-hidden="true">→</span>
        </button>
      </td>
    </tr>
  )
}

export function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const [searchParams] = useSearchParams()
  const admin = useSelector((state: RootState) => state.admin)
  const authToken = useSelector((state: RootState) => state.auth.token)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftTechnicianId, setDraftTechnicianId] = useState('')
  const preview = import.meta.env.DEV && searchParams.get('preview') === '1'
  const needsSignIn = !preview && !authToken

  useEffect(() => {
    if (needsSignIn) return
    const delay = admin.filters.search ? 250 : 0
    let request: { abort: () => void } | undefined
    const timer = window.setTimeout(() => {
      request = dispatch(loadAdminDashboard({ preview }))
    }, delay)
    return () => {
      window.clearTimeout(timer)
      request?.abort()
    }
  }, [dispatch, preview, needsSignIn, admin.filters.search, admin.filters.status, admin.filters.priority, admin.filters.categoryId, admin.filters.technicianId, admin.filters.page, admin.filters.limit])

  useEffect(() => {
    if (!admin.issues.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !admin.issues.some((issue) => issue.id === selectedId)) setSelectedId(admin.issues[0].id)
  }, [admin.issues, selectedId])

  const selectedIssue = useMemo(
    () => admin.issues.find((issue) => issue.id === selectedId) ?? null,
    [admin.issues, selectedId]
  )

  useEffect(() => {
    setDraftTechnicianId(selectedIssue?.technician?.id ?? '')
  }, [selectedIssue])

  const changeFilter = (filter: Parameters<typeof updateFilters>[0]) => {
    dispatch(updateFilters({ ...filter, page: 1 }))
  }

  const stats = [
    { label: 'Open', value: admin.stats.open, note: 'Awaiting triage', tone: 'blue' },
    { label: 'Assigned', value: admin.stats.assigned, note: 'Ownership set', tone: 'violet' },
    { label: 'In progress', value: admin.stats.inProgress, note: 'Work underway', tone: 'teal' },
    { label: 'Needs attention', value: admin.stats.urgent, note: `${admin.stats.unassigned} unassigned`, tone: 'orange' },
    { label: 'Completed', value: admin.stats.completed, note: `${admin.stats.total} total`, tone: 'green' }
  ]

  const assignSelectedIssue = async () => {
    if (!selectedIssue || !draftTechnicianId || draftTechnicianId === selectedIssue.technician?.id) return
    const result = await dispatch(assignTechnician({ issueId: selectedIssue.id, technicianId: draftTechnicianId }))
    if (assignTechnician.fulfilled.match(result) && !preview) dispatch(loadAdminDashboard({}))
  }

  const changePriority = async (issueId: string, priority: IssuePriority) => {
    const result = await dispatch(updateIssuePriority({ issueId, priority }))
    if (updateIssuePriority.fulfilled.match(result) && !preview) dispatch(loadAdminDashboard({}))
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="FixFlow home">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>FixFlow</span>
        </Link>
        <nav className="primary-nav" aria-label="Admin navigation">
          <span className="nav-label">Workspace</span>
          <a href="#overview"><span aria-hidden="true">⌂</span> Overview</a>
          <a className="is-active" href="#queue" aria-current="page"><span aria-hidden="true">≡</span> Issue queue <b>{admin.stats.open}</b></a>
          <a href="#team"><span aria-hidden="true">◎</span> Team</a>
        </nav>
        <div className="sidebar-foot">
          <span className="avatar avatar-admin" aria-hidden="true">AD</span>
          <span><strong>Admin workspace</strong><small>Operations desk</small></span>
        </div>
      </aside>

      <main className="admin-main">
        <header className="topbar" id="overview">
          <div>
            <p className="eyebrow">Operations / Issue control</p>
            <h1>Maintenance command center</h1>
            <p>Review demand, set priority, and send every issue to the right technician.</p>
          </div>
          <div className="topbar-actions">
            <span className={`queue-health health-${admin.loadStatus}`}>
              <i aria-hidden="true" />
              {needsSignIn ? 'Admin sign-in required' : admin.loadStatus === 'failed' ? 'Queue unavailable' : admin.loadStatus === 'loading' ? 'Checking queue' : 'Queue available'}
            </span>
            <button className="secondary-button" type="button" onClick={() => dispatch(loadAdminDashboard({ preview, refresh: true }))} disabled={needsSignIn || admin.loadStatus === 'loading'}>
              <span aria-hidden="true">↻</span> Refresh
            </button>
          </div>
        </header>

        {preview && (
          <div className="preview-banner" role="status">
            <strong>Development preview</strong>
            <span>This screen uses sample issues so the team can review the workflow before connecting an admin account.</span>
          </div>
        )}

        {admin.error && (
          <div className="error-banner" role="alert">
            <span><strong>We could not complete that request.</strong> {admin.error}</span>
            <button type="button" onClick={() => dispatch(clearAdminError())} aria-label="Dismiss error">×</button>
          </div>
        )}

        <section className="status-strip" aria-label="Issue workload">
          {stats.map((stat) => (
            <div className={`stat-segment stat-${stat.tone}`} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{admin.loadStatus === 'loading' && !admin.stats.total ? '—' : stat.value}</strong>
              <small>{stat.note}</small>
            </div>
          ))}
        </section>

        <section className="queue-workbench" id="queue">
          <div className="queue-panel">
            <div className="queue-heading">
              <div>
                <p className="section-kicker">Live workload</p>
                <h2>Issue queue</h2>
              </div>
              <span>{admin.pagination.total} result{admin.pagination.total === 1 ? '' : 's'}</span>
            </div>

            <div className="filter-bar" aria-label="Issue filters">
              <label className="search-field">
                <span className="sr-only">Search issues</span>
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={admin.filters.search}
                  onChange={(event) => changeFilter({ search: event.target.value })}
                  placeholder="Search issue or location"
                />
              </label>
              <label>
                <span>Status</span>
                <select value={admin.filters.status} onChange={(event) => changeFilter({ status: event.target.value as IssueStatus | '' })}>
                  <option value="">All statuses</option>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                <span>Priority</span>
                <select value={admin.filters.priority} onChange={(event) => changeFilter({ priority: event.target.value as IssuePriority | '' })}>
                  <option value="">All priorities</option>
                  {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                <span>Category</span>
                <select value={admin.filters.categoryId} onChange={(event) => changeFilter({ categoryId: event.target.value })}>
                  <option value="">All categories</option>
                  {admin.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>
                <span>Technician</span>
                <select value={admin.filters.technicianId} onChange={(event) => changeFilter({ technicianId: event.target.value })}>
                  <option value="">All technicians</option>
                  <option value="unassigned">Unassigned</option>
                  {admin.technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
                </select>
              </label>
            </div>

            {needsSignIn ? (
              <div className="empty-state"><span aria-hidden="true">↗</span><h3>Administrator sign-in required</h3><p>Sign in with an administrator account to load the live issue queue and assignment tools.</p></div>
            ) : admin.loadStatus === 'loading' && admin.issues.length === 0 ? <IssueSkeleton /> : admin.issues.length ? (
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Issue</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Reported</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {admin.issues.map((issue) => (
                      <QueueRow
                        key={issue.id}
                        issue={issue}
                        selected={issue.id === selectedId}
                        changing={admin.changingIssueId === issue.id}
                        onSelect={() => setSelectedId(issue.id)}
                        onPriority={(priority) => changePriority(issue.id, priority)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : admin.loadStatus === 'failed' ? (
              <div className="empty-state"><span aria-hidden="true">!</span><h3>The issue queue is unavailable</h3><p>Check your admin session or API connection, then try again.</p><button className="primary-button" type="button" onClick={() => dispatch(loadAdminDashboard({ preview, refresh: true }))}>Try again</button></div>
            ) : (
              <div className="empty-state"><span aria-hidden="true">✓</span><h3>No issues match these filters</h3><p>Clear one or more filters to bring the queue back into view.</p><button className="secondary-button" type="button" onClick={() => dispatch(updateFilters(defaultFilterReset))}>Clear filters</button></div>
            )}

            {admin.pagination.pages > 1 && (
              <div className="pagination" aria-label="Issue queue pages">
                <button type="button" disabled={admin.pagination.page <= 1} onClick={() => dispatch(updateFilters({ page: admin.pagination.page - 1 }))}>Previous</button>
                <span>Page {admin.pagination.page} of {admin.pagination.pages}</span>
                <button type="button" disabled={admin.pagination.page >= admin.pagination.pages} onClick={() => dispatch(updateFilters({ page: admin.pagination.page + 1 }))}>Next</button>
              </div>
            )}
          </div>

          <aside className="assignment-panel" id="team" aria-label="Selected issue assignment">
            {!needsSignIn && selectedIssue ? (
              <>
                <div className="assignment-head">
                  <span className="section-kicker">Selected issue</span>
                  <span className={`status-pill status-${selectedIssue.status}`}>{statusLabels[selectedIssue.status]}</span>
                </div>
                <h2>{selectedIssue.title}</h2>
                <p className="issue-reference">{selectedIssue.id} · Reported {ageLabel(selectedIssue.createdAt)}</p>
                <p className="issue-description">{selectedIssue.description}</p>

                <dl className="issue-facts">
                  <div><dt>Location</dt><dd>{selectedIssue.location}</dd></div>
                  <div><dt>Category</dt><dd>{selectedIssue.category?.name ?? 'Not set'}</dd></div>
                  <div><dt>Reporter</dt><dd>{selectedIssue.reporter?.name ?? 'Unknown'}</dd></div>
                </dl>

                <div className="assignment-control">
                  <label htmlFor="assignment-technician">Assign technician</label>
                  <select id="assignment-technician" value={draftTechnicianId} onChange={(event) => setDraftTechnicianId(event.target.value)}>
                    <option value="">Choose a technician</option>
                    {admin.technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
                  </select>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={!draftTechnicianId || draftTechnicianId === selectedIssue.technician?.id || admin.changingIssueId === selectedIssue.id}
                    onClick={assignSelectedIssue}
                  >
                    {admin.changingIssueId === selectedIssue.id ? 'Saving assignment…' : selectedIssue.technician ? 'Update assignment' : 'Assign issue'}
                  </button>
                </div>

                <div className="assignment-note">
                  <span aria-hidden="true">i</span>
                  <p><strong>What happens next</strong>The technician will own this issue. Open issues move to Assigned automatically.</p>
                </div>
              </>
            ) : (
              <div className="panel-placeholder"><span aria-hidden="true">↖</span><h2>Select an issue</h2><p>Choose a queue item to review its details and manage the assignment.</p></div>
            )}
          </aside>
        </section>
      </main>
    </div>
  )
}

const defaultFilterReset = { search: '', status: '' as const, priority: '' as const, categoryId: '', technicianId: '', page: 1 }
