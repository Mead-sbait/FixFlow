import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { StatusTag } from '../components/IssueStrip'
import { StatusSteps } from '../components/StatusSteps'
import { fetchCategories, fetchMyIssue } from '../features/issues/issuesSlice'
import { useT } from '../i18n'
import { formatDate } from '../lib/roles'

export function IssueDetailsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { t, locale } = useT()
  const token = useSelector((state: RootState) => state.auth.token)
  const { selected, categories, loadingOne, error } = useSelector((state: RootState) => state.issues)
  const notice = (location.state as { notice?: string } | null)?.notice

  useEffect(() => {
    if (token && id) {
      dispatch(fetchMyIssue({ token, issueId: id }))
      dispatch(fetchCategories(token))
    }
  }, [dispatch, token, id])

  const categoryName = useMemo(
    () => categories.find((category) => category.id === selected?.categoryId)?.name ?? t('common.noCategory'),
    [categories, selected, t]
  )

  const issue = selected && selected.id === id ? selected : null

  return (
    <main className="page">
      <Link className="back" to="/dashboard"><Icon name="arrowLeft" size={16} className="flip-rtl" /> {t('nav.myIssues')}</Link>

      {notice && <div className="notice notice--success" style={{ marginBottom: 16 }}><Icon name="check" size={16} />{notice}</div>}

      {loadingOne && !issue ? (
        <div className="skeleton" aria-busy="true" aria-label={t('common.loading')}><i /><i /></div>
      ) : !issue ? (
        <div className="sheet"><div className="empty"><Icon name="alert" size={36} /><h3>{t('issue.notFound')}</h3><p>{error ?? t('issue.notFoundText')}</p></div></div>
      ) : (
        <>
          <div className="page__head">
            <div className="detail__title">
              <span className={`magnet magnet--lg magnet--${issue.priority}`} />
              <h1>{issue.status === 'cancelled' ? <span className="struck">{issue.title}</span> : issue.title}</h1>
              <StatusTag status={issue.status} />
            </div>
          </div>

          <StatusSteps status={issue.status} />

          <div className="detail">
            <div className="stack">
              <section className="panel">
                <h2>{t('issue.details')}</h2>
                <p className="description">{issue.description}</p>
              </section>
              <section className="panel">
                <h2>{t('issue.next')}</h2>
                <p className="muted">{t(`issue.next.${issue.status}`)}</p>
              </section>
            </div>
            <aside className="panel">
              <h2>{t('issue.onStrip')}</h2>
              <dl className="facts">
                <div><dt>{t('issue.location')}</dt><dd>{issue.location}</dd></div>
                <div><dt>{t('issue.category')}</dt><dd>{categoryName}</dd></div>
                <div><dt>{t('issue.priority')}</dt><dd className={`priority-word priority-word--${issue.priority}`}>{t(`priority.${issue.priority}`)}</dd></div>
                <div><dt>{t('issue.technician')}</dt><dd>{issue.technicianId ? t('issue.assignedYes') : t('issue.notYet')}</dd></div>
                <div><dt>{t('issue.reported')}</dt><dd>{formatDate(issue.createdAt, locale, true)}</dd></div>
                <div><dt>{t('issue.lastChange')}</dt><dd>{formatDate(issue.updatedAt, locale, true)}</dd></div>
              </dl>
            </aside>
          </div>
        </>
      )}
    </main>
  )
}
