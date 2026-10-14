import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { Icon } from '../components/Icon'
import { IssueStrip } from '../components/IssueStrip'
import { fetchTechnicianIssues } from '../features/technician/technicianSlice'

export function TechnicianDashboard() {
    const dispatch = useDispatch<AppDispatch>()
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
                    <h1><span className="marker marker--blue">{user?.name.split(' ')[0]}'s column</span></h1>
                    <p>Strips the admin moved under your name. Start one, finish it, next.</p>
                </div>
                <div className="chip-row" role="group" aria-label="Show">
                    <button type="button" className="chip" aria-pressed={!showDone} onClick={() => setShowDone(false)}>
                        To do <span className="tabular">{active.length}</span>
                    </button>
                    <button type="button" className="chip" aria-pressed={showDone} onClick={() => setShowDone(true)}>
                        Done <span className="tabular">{done.length}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="notice notice--error" role="alert" style={{ marginBottom: 16 }}>
                    <Icon name="alert" size={16} />{error}
                </div>
            )}

            {loading && issues.length === 0 ? (
                <div className="skeleton" aria-busy="true" aria-label="Loading"><i /><i /><i /></div>
            ) : visible.length === 0 ? (
                <div className="sheet">
                    <div className="empty">
                        <Icon name="wrench" size={36} />
                        <h3>{showDone ? 'Nothing finished yet' : 'Your column is empty'}</h3>
                        <p>{showDone ? 'Completed jobs land here.' : 'When an admin assigns you something it appears here right away.'}</p>
                    </div>
                </div>
            ) : (
                <div className="board" style={{ gridAutoFlow: 'row', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', overflow: 'visible' }}>
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
