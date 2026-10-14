import type { IssueStatus } from '../types'
import { Icon } from './Icon'

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
      {order.map((step, index) => {
        // finished issues end on the green tick, not on a "you are here" dot
        const finished = step === 'completed' && status === 'completed'
        const className = finished ? 'done ticked' : index < current ? 'done' : index === current ? 'now' : ''
        return (
          <li key={step} className={className} aria-current={!finished && index === current ? 'step' : undefined}>
            {finished ? <span className="tick"><Icon name="check" size={12} /></span> : <span className="dot" />}
            {labels[step]}
          </li>
        )
      })}
    </ol>
  )
}
