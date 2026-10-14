import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { IssuePriority, IssueStatus } from '../types'
import { useT } from '../i18n'
import { formatDate } from '../lib/roles'
import { Icon } from './Icon'

export type StripIssue = {
  id: string
  title: string
  location: string
  status: IssueStatus
  priority: IssuePriority
  createdAt: string
  categoryName?: string | null
  reporterName?: string | null
  technicianName?: string | null
}

type Props = {
  issue: StripIssue
  to?: string
  draggable?: boolean
  saving?: boolean
  settle?: boolean
  children?: ReactNode
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function StatusTag({ status }: { status: IssueStatus }) {
  const { t } = useT()
  return <span className={`tag tag--${status}`}>{t(`status.${status}`)}</span>
}

// one magnetic strip on the board, the same anatomy everywhere it shows up
export function IssueStrip({ issue, to, draggable, saving, settle, children, onDragStart, onDragEnd }: Props) {
  const { t, locale } = useT()
  const done = issue.status === 'completed' || issue.status === 'cancelled'
  const classes = [
    'strip',
    to ? 'strip--link' : '',
    done ? 'strip--done' : '',
    saving ? 'strip--saving' : '',
    settle ? 'strip--settle' : ''
  ].filter(Boolean).join(' ')

  const body = (
    <>
      <div className="strip__top">
        <span className={`magnet magnet--${issue.priority}`} title={t(`priority.${issue.priority}`)} />
        <span className="strip__title">
          {issue.status === 'cancelled' ? <span className="struck">{issue.title}</span> : issue.title}
        </span>
        {draggable && <span className="strip__handle" aria-hidden="true"><Icon name="grip" size={16} /></span>}
      </div>
      <span className="strip__location">
        <Icon name="location" size={14} />
        <span>{issue.location}</span>
      </span>
      <div className="strip__meta">
        <StatusTag status={issue.status} />
        {issue.categoryName && <span>{issue.categoryName}</span>}
        {issue.technicianName && <span>{issue.technicianName}</span>}
        {issue.reporterName && <span>{t('common.by', { name: issue.reporterName })}</span>}
        <span className="tabular">{formatDate(issue.createdAt, locale)}</span>
      </div>
      {children}
    </>
  )

  if (to) {
    return <Link className={classes} to={to}>{body}</Link>
  }

  return (
    <article
      className={classes}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {body}
    </article>
  )
}
