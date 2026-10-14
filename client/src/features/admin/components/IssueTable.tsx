import type { IssuePriority } from '../../../types'
import type { AdminIssue, PersonRef } from '../admin.types'
import { TechnicianSelector } from './TechnicianSelector'

type Props = {
  issues: AdminIssue[]
  technicians: PersonRef[]
  savingId: string | null
  onAssign: (issueId: string, technicianId: string) => void
  onPriorityChange: (issueId: string, priority: IssuePriority) => void
  onStatusChange: (issue: AdminIssue, status: 'open' | 'cancelled') => void
}

const priorities: IssuePriority[] = ['low', 'medium', 'high', 'urgent']

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function IssueTable({ issues, technicians, savingId, onAssign, onPriorityChange, onStatusChange }: Props) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Reporter</th>
            <th>Technician</th>
            <th>Reported</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const saving = savingId === issue.id
            const closed = issue.status === 'completed' || issue.status === 'cancelled'

            return (
              <tr key={issue.id} className={saving ? 'is-saving' : undefined}>
                <td data-label="Issue">
                  <span className="issue-title">{issue.title}</span>
                  <span className="issue-meta">
                    {issue.category?.name ?? 'No category'} · {issue.location}
                  </span>
                </td>
                <td data-label="Status">
                  <span className={`badge badge--${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                </td>
                <td data-label="Priority">
                  <select
                    className={`badge badge--${issue.priority}`}
                    value={issue.priority}
                    disabled={saving || closed}
                    onChange={(event) => onPriorityChange(issue.id, event.target.value as IssuePriority)}
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </td>
                <td data-label="Reporter">{issue.reporter?.name ?? 'Unknown'}</td>
                <td data-label="Technician">
                  <TechnicianSelector
                    issue={issue}
                    technicians={technicians}
                    disabled={saving}
                    onAssign={(technicianId) => onAssign(issue.id, technicianId)}
                  />
                </td>
                <td data-label="Reported">{formatDate(issue.createdAt)}</td>
                <td data-label="Actions">
                  {closed ? (
                    <button type="button" disabled={saving} onClick={() => onStatusChange(issue, 'open')}>
                      Reopen
                    </button>
                  ) : (
                    <button type="button" className="danger" disabled={saving} onClick={() => onStatusChange(issue, 'cancelled')}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
