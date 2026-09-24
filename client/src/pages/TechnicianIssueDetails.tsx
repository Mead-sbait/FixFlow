import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { changeTechnicianIssueStatus, fetchTechnicianIssue } from '../features/technician/technicianSlice'
import '../features/technician/technician.css'

export function TechnicianIssueDetails() {
    const dispatch = useDispatch<AppDispatch>()
    const { id } = useParams<{ id: string }>()

    const token = useSelector((state: RootState) => state.auth.token)
    const { selectedIssue, issueLoading, statusUpdating, error } = useSelector((state: RootState) => state.technician)

    useEffect(() => {
        if (token && id)
        {
            dispatch(
                fetchTechnicianIssue({
                    token,
                    issueId: id,
                })
            )
        }
    }, [dispatch, token, id])

    const changeStatus = (
        status: 'in_progress' | 'completed'
    ) => {
        if (!token || !id)
        {
            return
        }

        dispatch(
            changeTechnicianIssueStatus({
                token,
                issueId: id,
                status,
            })
        )
    }

    if (!token)
    {
        return <p>Authentication required.</p>
    }

    if (issueLoading)
    {
        return <p>Loading issue...</p>
    }

    if (error)
    {
        return <p>{error}</p>
    }

    if (!selectedIssue)
    {
        return <p>Issue not found.</p>
    }

    return (
        <main className="technician-issue-details">
            <Link to="/technician">
                Back to Dashboard
            </Link>

            <div className="technician-issue-details__header">
                <div>
                    <h1>{selectedIssue.title}</h1>
                    <span className={`status status--${selectedIssue.status}`}>
                        {selectedIssue.status}
                    </span>
                </div>
            </div>

            <div className="technician-issue-details__content">
                <section>
                    <h2>Description</h2>
                    <p>{selectedIssue.description}</p>
                </section>

                <section>
                    <h2>Issue Information</h2>

                    <p>
                        <strong>Location:</strong>{' '}
                        {selectedIssue.location}
                    </p>

                    <p>
                        <strong>Priority:</strong>{' '}
                        {selectedIssue.priority}
                    </p>

                    <p>
                        <strong>Category:</strong>{' '}
                        {selectedIssue.category?.name ?? 'No category'}
                    </p>

                    <p>
                        <strong>Reporter:</strong>{' '}
                        {selectedIssue.reporter?.name ?? 'Unknown'}
                    </p>

                    <p>
                        <strong>Reporter Email:</strong>{' '}
                        {selectedIssue.reporter?.email ?? 'Unknown'}
                    </p>
                </section>

                <section className="technician-issue-details__actions">
                    <h2>Workflow</h2>

                    {selectedIssue.status === 'assigned' && (
                        <button type="button" disabled={statusUpdating} onClick={() => changeStatus('in_progress')}>
                            {statusUpdating ? 'Updating...' : 'Start Work'}
                        </button>
                    )}

                    {selectedIssue.status === 'in_progress' && (
                        <button type="button" disabled={statusUpdating} onClick={() => changeStatus('completed')}>
                            {statusUpdating ? 'Updating...' : 'Complete Issue'}
                        </button>
                    )}

                    {selectedIssue.status === 'completed' && (
                        <p>This issue has been completed.</p>
                    )}
                </section>
            </div>
        </main>
    )
}