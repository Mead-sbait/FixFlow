import type { IssuePriority } from '../../../types'
import type { AdminIssue, PersonRef } from '../admin.types'
import { TechnicianSelector } from './TechnicianSelector'

type Props = {
  issues: AdminIssue[]
  technicians: PersonRef[]
  savingId: string | null
  onAssign: (issueId: string, technicianId: string) => void
  onPriorityChange: (issueId: string, priority: IssuePriority) => void
}

const priorities: IssuePriority[] = ['low', 'medium', 'high', 'urgent']

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function IssueTable({ issues, technicians, savingId, onAssign, onPriorityChange }: Props) {
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
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const saving = savingId === issue.id

            return (
              <tr key={issue.id} className={saving ? 'is-saving' : undefined}>
                <td>
                  <span className="issue-title">{issue.title}</span>
                  <span className="issue-meta">
                    {issue.category?.name ?? 'No category'} · {issue.location}
                  </span>
                </td>
                <td>
                  <span className={`badge badge--${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                </td>
                <td>
                  <select
                    className={`badge badge--${issue.priority}`}
                    value={issue.priority}
                    disabled={saving}
                    onChange={(event) => onPriorityChange(issue.id, event.target.value as IssuePriority)}
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </td>
                <td>{issue.reporter?.name ?? 'Unknown'}</td>
                <td>
                  <TechnicianSelector
                    issue={issue}
                    technicians={technicians}
                    disabled={saving}
                    onAssign={(technicianId) => onAssign(issue.id, technicianId)}
                  />
                </td>
                <td>{formatDate(issue.createdAt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
