import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { AssignedIssueCard } from '../features/technician/components/AssignedIssueCard'
import { fetchTechnicianIssues } from '../features/technician/technicianSlice'
import '../features/technician/technician.css'

export function TechnicianDashboard() {
    const dispatch = useDispatch<AppDispatch>()

    const token = useSelector((state: RootState) => state.auth.token)
    const { issues, loading, error } = useSelector((state: RootState) => state.technician)

    useEffect(() => {
        if (token)
        {
            dispatch(fetchTechnicianIssues(token))
        }
    }, [dispatch, token])

    if (!token)
    {
        return <p>Authentication required.</p>
    }

    if (loading) 
    {
        return <p>Loading assigned issues...</p>
    }

    if (error)
    {
        return <p>{error}</p>
    }

    return (
        <main className="technician-dashboard">
            <div className="technician-dashboard__header">
                <div>
                    <h1>Technician Dashboard</h1>
                    <p>View and manage your assigned maintenance issues.</p>
                </div>

                <span>
                    Assigned Issues: <strong>{issues.length}</strong>
                </span>
            </div>

            {issues.length === 0 ? (
                <div className="technician-dashboard__empty">
                    <h2>No assigned issues</h2>
                    <p>You currently have no maintenance issues assigned to you.</p>
                </div>
            ) : (
            <div className="technician-dashboard__issues">
                {issues.map((issue) => (
                    <AssignedIssueCard key={issue.id} issue={issue}/>
                ))}
            </div>
            )}
        </main>
    )
}