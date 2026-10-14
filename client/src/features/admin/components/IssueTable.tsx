import { Icon } from '../../../components/Icon'
import { StatusTag } from '../../../components/IssueStrip'
import { formatDate } from '../../../lib/roles'
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

export function IssueTable({ issues, technicians, savingId, onAssign, onPriorityChange, onStatusChange }: Props) {
  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Reporter</th>
            <th>Technician</th>
            <th>Reported</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const saving = savingId === issue.id
            const closed = issue.status === 'completed' || issue.status === 'cancelled'

            return (
              <tr key={issue.id} className={saving ? 'is-saving' : undefined}>
                <td className="cell-title" data-label="Issue">
                  <strong className={issue.status === 'cancelled' ? 'struck' : undefined}>{issue.title}</strong>
                  <span>{issue.category?.name ?? 'No category'} · {issue.location}</span>
                </td>
                <td data-label="Status"><StatusTag status={issue.status} /></td>
                <td data-label="Priority">
                  <span className="inline">
                    <span className={`magnet magnet--${issue.priority}`} />
                    <select
                      className="select select--sm"
                      style={{ width: 'auto' }}
                      aria-label={`Priority for ${issue.title}`}
                      value={issue.priority}
                      disabled={saving || closed}
                      onChange={(event) => onPriorityChange(issue.id, event.target.value as IssuePriority)}
                    >
                      {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  </span>
                </td>
                <td data-label="Reporter">{issue.reporter?.name ?? 'Unknown'}</td>
                <td data-label="Technician">
                  <TechnicianSelector issue={issue} technicians={technicians} disabled={saving} compact onAssign={(technicianId) => onAssign(issue.id, technicianId)} />
                </td>
                <td data-label="Reported" className="tabular">{formatDate(issue.createdAt)}</td>
                <td className="cell-actions" data-label="Actions">
                  {closed ? (
                    <button type="button" className="btn btn--secondary btn--sm" disabled={saving} onClick={() => onStatusChange(issue, 'open')}>
                      <Icon name="undo" size={14} /> Reopen
                    </button>
                  ) : (
                    <button type="button" className="btn btn--danger btn--sm" disabled={saving} onClick={() => onStatusChange(issue, 'cancelled')}>
                      <Icon name="ban" size={14} /> Cancel
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
