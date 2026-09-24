import { Link } from 'react-router-dom'
import type { TechnicianIssue } from '../technician.types'

type Props = { issue: TechnicianIssue }

export function AssignedIssueCard({ issue }: Props) {
    return (
        <article className="technician-issue-card">
            <div className="technician-issue-card__header">
                <h3>{issue.title}</h3>

                <span className={`status status--${issue.status}`}>
                    {issue.status}
                </span>
            </div>

            <p>{issue.description}</p>

            <div className="technician-issue-card__details">
                <span>
                    <strong>Location:</strong> {issue.location}
                </span>

                <span>
                    <strong>Priority:</strong> {issue.priority}
                </span>

                <span>
                    <strong>Category:</strong> {issue.category?.name ?? 'No category'}
                </span>

                <span>
                    <strong>Reporter:</strong> {issue.reporter?.name ?? 'Unknown'}
                </span>
            </div>

            <Link to={`/technician/issues/${issue.id}`} className="technician-issue-card__link">
                View Details
            </Link>
        </article>
    )
}