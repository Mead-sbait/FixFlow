import type { IssueStatus } from '../types'

const order: IssueStatus[] = ['open', 'assigned', 'in_progress', 'completed']
const labels: Record<IssueStatus, string> = {
  open: 'Reported',
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Done',
  cancelled: 'Cancelled'
}

// the lifecycle drawn as a line of dots, so anyone can see how far along an issue is
export function StatusSteps({ status }: { status: IssueStatus }) {
  if (status === 'cancelled') {
    return (
      <ol className="steps" aria-label="Status">
        <li className="done"><span className="dot" />Reported</li>
        <li className="off"><span className="dot" />Cancelled</li>
      </ol>
    )
  }

  const current = order.indexOf(status)

  return (
    <ol className="steps" aria-label="Status">
      {order.map((step, index) => (
        <li key={step} className={index < current ? 'done' : index === current ? 'now' : ''} aria-current={index === current ? 'step' : undefined}>
          <span className="dot" />{labels[step]}
        </li>
      ))}
    </ol>
  )
}
