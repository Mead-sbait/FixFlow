import { Icon } from '../../../components/Icon'
import { StatusTag } from '../../../components/IssueStrip'
import { useT } from '../../../i18n'
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
  const { t, locale } = useT()

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>{t('list.issue')}</th>
            <th>{t('list.status')}</th>
            <th>{t('list.priority')}</th>
            <th>{t('list.reporter')}</th>
            <th>{t('list.technician')}</th>
            <th>{t('list.reported')}</th>
            <th><span className="sr-only">{t('list.actions')}</span></th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const saving = savingId === issue.id
            const closed = issue.status === 'completed' || issue.status === 'cancelled'

            return (
              <tr key={issue.id} className={saving ? 'is-saving' : undefined}>
                <td className="cell-title" data-label={t('list.issue')}>
                  <strong>{issue.status === 'cancelled' ? <span className="struck">{issue.title}</span> : issue.title}</strong>
                  <span>{issue.category?.name ?? t('common.noCategory')} · {issue.location}</span>
                </td>
                <td data-label={t('list.status')}><StatusTag status={issue.status} /></td>
                <td data-label={t('list.priority')}>
                  <span className="inline">
                    <span className={`magnet magnet--${issue.priority}`} />
                    <select
                      className="select select--sm"
                      style={{ width: 'auto' }}
                      aria-label={t('priority.for', { title: issue.title })}
                      value={issue.priority}
                      disabled={saving || closed}
                      onChange={(event) => onPriorityChange(issue.id, event.target.value as IssuePriority)}
                    >
                      {priorities.map((priority) => <option key={priority} value={priority}>{t(`priority.${priority}`)}</option>)}
                    </select>
                  </span>
                </td>
                <td data-label={t('list.reporter')}>{issue.reporter?.name ?? t('common.unknown')}</td>
                <td data-label={t('list.technician')}>
                  <TechnicianSelector issue={issue} technicians={technicians} disabled={saving} compact onAssign={(technicianId) => onAssign(issue.id, technicianId)} />
                </td>
                <td data-label={t('list.reported')} className="tabular">{formatDate(issue.createdAt, locale)}</td>
                <td className="cell-actions" data-label={t('list.actions')}>
                  {closed ? (
                    <button type="button" className="btn btn--secondary btn--sm" disabled={saving} onClick={() => onStatusChange(issue, 'open')}>
                      <Icon name="undo" size={14} /> {t('board.reopen')}
                    </button>
                  ) : (
                    <button type="button" className="btn btn--danger btn--sm" disabled={saving} onClick={() => onStatusChange(issue, 'cancelled')}>
                      <Icon name="ban" size={14} /> {t('common.cancel')}
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
