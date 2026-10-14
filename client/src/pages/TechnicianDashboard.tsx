import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { IssueStrip } from '../components/IssueStrip'
import { fetchTechnicianIssues } from '../features/technician/technicianSlice'
import { useT } from '../i18n'

export function TechnicianDashboard() {
    const dispatch = useDispatch<AppDispatch>()
    const { t } = useT()
    const [showDone, setShowDone] = useState(false)

    const token = useSelector((state: RootState) => state.auth.token)
    const user = useSelector((state: RootState) => state.auth.user)
    const { issues, loading, error } = useSelector((state: RootState) => state.technician)

    useEffect(() => {
        if (token)
        {
            dispatch(fetchTechnicianIssues(token))
        }
    }, [dispatch, token])

    const active = issues.filter((issue) => issue.status === 'assigned' || issue.status === 'in_progress')
    const done = issues.filter((issue) => issue.status === 'completed' || issue.status === 'cancelled')
    const visible = showDone ? done : active

    return (
        <main className="page">
            <div className="page__head">
                <div>
                    <h1><span className="marker marker--blue">{t('tech.title', { name: user?.name.split(' ')[0] ?? '' })}</span></h1>
                    <p>{t('tech.lead')}</p>
                </div>
                <div className="chip-row" role="group" aria-label={t('tech.show')}>
                    <button type="button" className="chip" aria-pressed={!showDone} onClick={() => setShowDone(false)}>
                        {t('tech.toDo')} <span className="tabular">{active.length}</span>
                    </button>
                    <button type="button" className="chip" aria-pressed={showDone} onClick={() => setShowDone(true)}>
                        {t('tech.done')} <span className="tabular">{done.length}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}>
                    <Icon name="alert" size={16} />{error}
                </div>
            )}

            {loading && issues.length === 0 ? (
                <div className="skeleton" aria-busy="true" aria-label={t('common.loading')}><i /><i /><i /></div>
            ) : visible.length === 0 ? (
                <div className="sheet">
                    <div className="empty">
                        <Icon name="wrench" size={36} />
                        <h3>{showDone ? t('tech.emptyDoneTitle') : t('tech.emptyTitle')}</h3>
                        <p>{showDone ? t('tech.emptyDoneText') : t('tech.emptyText')}</p>
                    </div>
                </div>
            ) : (
                <div className="strip-grid">
                    {visible.map((issue) => (
                        <IssueStrip
                            key={issue.id}
                            to={`/technician/issues/${issue.id}`}
                            issue={{ ...issue, categoryName: issue.category?.name, reporterName: issue.reporter?.name }}
                        />
                    ))}
                </div>
            )}
        </main>
    )
}
