import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { StatusTag } from '../components/IssueStrip'
import { StatusSteps } from '../components/StatusSteps'
import { fetchCategories, fetchMyIssue } from '../features/issues/issuesSlice'
import { formatDate } from '../lib/roles'

export function IssueDetailsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
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
    () => categories.find((category) => category.id === selected?.categoryId)?.name ?? 'No category',
    [categories, selected]
  )

  const issue = selected && selected.id === id ? selected : null

  return (
    <main className="page">
      <Link className="back" to="/dashboard"><Icon name="arrowLeft" size={16} /> My issues</Link>

      {notice && <div className="notice notice--success" style={{ marginBottom: 16 }}><Icon name="check" size={16} />{notice}</div>}

      {loadingOne && !issue ? (
        <div className="skeleton" aria-busy="true" aria-label="Loading"><i /><i /></div>
      ) : !issue ? (
        <div className="sheet"><div className="empty"><Icon name="alert" size={36} /><h3>Issue not found</h3><p>{error ?? 'It may belong to someone else.'}</p></div></div>
      ) : (
        <>
          <div className="page__head">
            <div className="detail__title">
              <span className={`magnet magnet--lg magnet--${issue.priority}`} />
              <h1 className={issue.status === 'cancelled' ? 'struck' : undefined}>{issue.title}</h1>
              <StatusTag status={issue.status} />
            </div>
          </div>

          <StatusSteps status={issue.status} />

          <div className="detail">
            <div>
              <section className="panel">
                <h2>Details</h2>
                <p className="description">{issue.description}</p>
              </section>
              <section className="panel">
                <h2>What happens next</h2>
                <p className="muted">
                  {issue.status === 'open' && 'An admin will look at it and assign a technician. You get a notification when that happens.'}
                  {issue.status === 'assigned' && 'A technician has it and will start soon.'}
                  {issue.status === 'in_progress' && 'The technician is working on it right now.'}
                  {issue.status === 'completed' && 'Done. If the problem comes back, report it again.'}
                  {issue.status === 'cancelled' && 'An admin cancelled this request. Ask them if that was unexpected.'}
                </p>
              </section>
            </div>
            <aside className="panel">
              <h2>On the strip</h2>
              <dl className="facts">
                <div><dt>Location</dt><dd>{issue.location}</dd></div>
                <div><dt>Category</dt><dd>{categoryName}</dd></div>
                <div><dt>Priority</dt><dd className={`priority-word priority-word--${issue.priority}`}>{issue.priority}</dd></div>
                <div><dt>Technician</dt><dd>{issue.technicianId ? 'Assigned' : 'Not yet'}</dd></div>
                <div><dt>Reported</dt><dd>{formatDate(issue.createdAt, true)}</dd></div>
                <div><dt>Last change</dt><dd>{formatDate(issue.updatedAt, true)}</dd></div>
              </dl>
            </aside>
          </div>
        </>
      )}
    </main>
  )
}
