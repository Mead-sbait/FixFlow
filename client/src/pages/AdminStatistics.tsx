import { useEffect, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { fetchAdminStats } from '../features/admin/adminSlice'
import type { CountByName } from '../features/admin/admin.types'
import { useT } from '../i18n'

type Tone = 'blue' | 'green' | 'red' | 'grey' | 'orange'

function Bars({ rows, empty, tone = 'blue' }: { rows: (CountByName & { tone?: Tone })[]; empty: string; tone?: Tone }) {
  const { locale } = useT()
  const max = Math.max(...rows.map(row => row.count), 1)
  return rows.length === 0 ? <p className="stats-empty">{empty}</p> : (
    <div className="bars stats-bars">
      {rows.map(row => (
        <div className="bar" key={row.id}>
          <span>{row.name}</span>
          <div className="bar__track" aria-hidden="true"><div className={`bar__fill bar__fill--${row.tone ?? tone}`} style={{ transform: `scaleX(${row.count / max})` }} /></div>
          <strong>{row.count.toLocaleString(locale)}</strong>
        </div>
      ))}
    </div>
  )
}

export function AdminStatistics() {
  const dispatch = useDispatch<AppDispatch>()
  const { t, errorMessage, category, locale } = useT()
  const token = useSelector((state: RootState) => state.auth.token)
  const { stats, loadingStats, error } = useSelector((state: RootState) => state.admin)

  useEffect(() => { if (token) dispatch(fetchAdminStats(token)) }, [dispatch, token])

  const rate = stats && stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0
  const rateLabel = (rate / 100).toLocaleString(locale, { style: 'percent', maximumFractionDigits: 0 })
  const statusRows = stats ? [
    { id: 'open', name: t('status.open'), count: stats.open, tone: 'grey' as const },
    { id: 'assigned', name: t('status.assigned'), count: stats.assigned, tone: 'blue' as const },
    { id: 'in_progress', name: t('status.in_progress'), count: stats.inProgress, tone: 'orange' as const },
    { id: 'completed', name: t('status.completed'), count: stats.completed, tone: 'green' as const },
    { id: 'cancelled', name: t('status.cancelled'), count: stats.cancelled, tone: 'red' as const }
  ] : []
  const summaries = stats ? [
    { label: t('tally.total'), count: stats.total, icon: 'inbox', tone: 'blue' },
    { label: t('tally.active'), count: stats.open + stats.assigned + stats.inProgress, icon: 'clock', tone: 'orange' },
    { label: t('tally.completed'), count: stats.completed, icon: 'check', tone: 'green' },
    { label: t('tally.urgent'), count: stats.urgent, icon: 'alert', tone: 'red' }
  ] : []

  return (
    <main className="page stats-page">
      <div className="page__head">
        <div><h1>{t('tally.title')}</h1><p>{t('tally.distribution')}</p></div>
        <Link className="btn btn--secondary" to="/admin/issues"><Icon name="list" size={18} />{t('tally.manage')}</Link>
      </div>
      {error && <div className="notice notice--error" role="alert"><Icon name="alert" size={16} />{errorMessage(error)}</div>}
      {loadingStats && !stats ? <div className="skeleton" aria-busy="true" aria-label={t('common.loading')}><i /><i /><i /></div> : stats && (
        <>
          <section className="stats-summary" aria-label={t('tally.overview')}>
            {summaries.map(item => <article className={`stats-metric stats-metric--${item.tone}`} key={item.label}>
              <span className="stats-metric__icon"><Icon name={item.icon} size={22} /></span>
              <span>{item.label}</span><strong>{item.count.toLocaleString(locale)}</strong>
            </article>)}
          </section>
          {stats.total === 0 ? <div className="sheet"><div className="empty"><Icon name="chart" size={36} /><h2>{t('tally.empty')}</h2><p>{t('tally.emptyHint')}</p></div></div> : (
            <div className="stats-grid">
              <section className="panel stats-completion">
                <h2>{t('tally.completion')}</h2>
                <div className="stats-ring" style={{ '--completion': `${rate}%` } as CSSProperties} role="img" aria-label={`${t('tally.completion')}: ${rateLabel}`}><span aria-hidden="true">{rateLabel}</span></div>
                <p className="muted">{t('tally.completionHint')}</p>
                <div className="stats-attention"><Icon name="users" size={18} /><span>{t('tally.waiting')}</span><strong>{stats.unassigned.toLocaleString(locale)}</strong></div>
              </section>
              <section className="panel"><h2>{t('tally.byStatus')}</h2><Bars rows={statusRows} empty={t('tally.noIssues')} /></section>
              <section className="panel"><h2>{t('tally.byCategory')}</h2><Bars rows={stats.byCategory.map(row => ({ ...row, name: category(row.name) }))} empty={t('tally.noIssues')} /></section>
              <section className="panel"><h2>{t('tally.perTechnician')}</h2><Bars rows={stats.byTechnician} empty={t('tally.noActive')} tone="green" /></section>
            </div>
          )}
        </>
      )}
    </main>
  )
}
