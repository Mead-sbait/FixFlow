import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { StatusTag } from '../components/IssueStrip'
import { StatusSteps } from '../components/StatusSteps'
import { changeTechnicianIssueStatus, fetchTechnicianIssue } from '../features/technician/technicianSlice'
import { TechnicianComments } from '../features/technician/components/TechnicianComments'
import { useT } from '../i18n'
import { formatDate } from '../lib/roles'

export function TechnicianIssueDetails() {
    const dispatch = useDispatch<AppDispatch>()
    const { id } = useParams<{ id: string }>()
    const { t, locale, errorMessage, category } = useT()

    const token = useSelector((state: RootState) => state.auth.token)
    const { selectedIssue, issueLoading, statusUpdating, error } = useSelector((state: RootState) => state.technician)

    useEffect(() => {
        if (token && id)
        {
            dispatch(fetchTechnicianIssue({ token, issueId: id }))
        }
    }, [dispatch, token, id])

    const changeStatus = (status: 'in_progress' | 'completed') => {
        if (!token || !id) return
        dispatch(changeTechnicianIssueStatus({ token, issueId: id, status }))
    }

    const issue = selectedIssue && selectedIssue.id === id ? selectedIssue : null

    return (
        <main className="page">
            <Link className="back" to="/technician"><Icon name="arrowLeft" size={16} className="flip-rtl" /> {t('nav.myWork')}</Link>

            {error && (
                <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}>
                    <Icon name="alert" size={16} />{errorMessage(error)}
                </div>
            )}

            {issueLoading && !issue ? (
                <div className="skeleton" aria-busy="true" aria-label={t('common.loading')}><i /><i /></div>
            ) : !issue ? (
                <div className="sheet"><div className="empty"><Icon name="alert" size={36} /><h3>{t('issue.notFound')}</h3><p>{t('tech.notFoundText')}</p></div></div>
            ) : (
                <>
                    <div className="page__head">
                        <div className="detail__title">
                            <span className={`magnet magnet--lg magnet--${issue.priority}`} />
                            <h1>{issue.status === 'cancelled' ? <span className="struck">{issue.title}</span> : issue.title}</h1>
                            <StatusTag status={issue.status} />
                        </div>

                        <div className="page__actions">
                            {issue.status === 'assigned' && (
                                <button type="button" className="btn btn--primary" disabled={statusUpdating} onClick={() => changeStatus('in_progress')}>
                                    <Icon name="wrench" size={16} /> {statusUpdating ? t('tech.updating') : t('tech.start')}
                                </button>
                            )}
                            {issue.status === 'in_progress' && (
                                <button type="button" className="btn btn--green" disabled={statusUpdating} onClick={() => changeStatus('completed')}>
                                    <Icon name="check" size={16} /> {statusUpdating ? t('tech.updating') : t('tech.complete')}
                                </button>
                            )}
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
                                <TechnicianComments key={id} token={token!} issueId={id!} />
                            </section>
                        </div>

                        <aside className="panel">
                            <h2>{t('issue.onStrip')}</h2>
                            <dl className="facts">
                                <div><dt>{t('issue.location')}</dt><dd>{issue.location}</dd></div>
                                <div><dt>{t('issue.category')}</dt><dd>{category(issue.category?.name)}</dd></div>
                                <div><dt>{t('issue.priority')}</dt><dd className={`priority-word priority-word--${issue.priority}`}>{t(`priority.${issue.priority}`)}</dd></div>
                                <div><dt>{t('issue.reporter')}</dt><dd>{issue.reporter?.name ?? t('common.unknown')}<br /><span className="muted" dir="ltr">{issue.reporter?.email}</span></dd></div>
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
