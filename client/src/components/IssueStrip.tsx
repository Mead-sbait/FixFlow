import { useState, type ReactNode } from 'react'
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
  const { t, locale, category } = useT()
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
        {issue.categoryName && <span>{category(issue.categoryName)}</span>}
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
      onDragStart={(event) => {
        // browsers need something in the data transfer to start a drag (firefox refuses otherwise),
        // and the drop handler reads the id back from here
        event.dataTransfer.setData('text/plain', issue.id)
        event.dataTransfer.effectAllowed = 'move'
        onDragStart?.()
      }}
      onDragEnd={onDragEnd}
    >
      {body}
    </article>
  )
}

// Shared decorative preview for both authentication screens.
export function AuthDemo() {
  const { t } = useT()
  const [paused, setPaused] = useState(false)
  const now = new Date().toISOString()
  const sample = [
    { id: 'a', title: t('sample.1.title'), location: t('sample.1.location'), status: 'assigned' as const, priority: 'high' as const, createdAt: now, technicianName: t('sample.tech1') },
    { id: 'b', title: t('sample.2.title'), location: t('sample.2.location'), status: 'in_progress' as const, priority: 'urgent' as const, createdAt: now, technicianName: t('sample.tech2') },
    { id: 'c', title: t('sample.3.title'), location: t('sample.3.location'), status: 'completed' as const, priority: 'low' as const, createdAt: now, technicianName: t('sample.tech1') }
  ]

  return (
    <div className="auth__demo" data-paused={paused}>
      <div className="auth__demo-stage" aria-hidden="true">
        {sample.map(issue => <IssueStrip key={issue.id} issue={issue} />)}
      </div>
      <button type="button" className="auth__motion" aria-pressed={paused} onClick={() => setPaused(!paused)}>
        <Icon name={paused ? 'play' : 'pause'} size={14} />
        {t(paused ? 'auth.resumeMotion' : 'auth.pauseMotion')}
      </button>
    </div>
  )
}
