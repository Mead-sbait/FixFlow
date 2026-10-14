import type { IssueStatus } from '../types'
import { useT } from '../i18n'
import type { TranslationKey } from '../i18n/en'
import { Icon } from './Icon'

const order: IssueStatus[] = ['open', 'assigned', 'in_progress', 'completed']
const labels: Record<IssueStatus, TranslationKey> = {
  open: 'steps.reported',
  assigned: 'steps.assigned',
  in_progress: 'steps.inProgress',
  completed: 'steps.done',
  cancelled: 'steps.cancelled'
}

// the lifecycle drawn as a line of dots, so anyone can see how far along an issue is
export function StatusSteps({ status }: { status: IssueStatus }) {
  const { t } = useT()

  if (status === 'cancelled') {
    return (
      <ol className="steps" aria-label={t('steps.label')}>
        <li className="done"><span className="dot" />{t('steps.reported')}</li>
        <li className="off"><span className="dot" />{t('steps.cancelled')}</li>
      </ol>
    )
  }

  const current = order.indexOf(status)

  return (
    <ol className="steps" aria-label={t('steps.label')}>
      {order.map((step, index) => {
        // finished issues end on the green tick, not on a "you are here" dot
        const finished = step === 'completed' && status === 'completed'
        const className = finished ? 'done ticked' : index < current ? 'done' : index === current ? 'now' : ''
        return (
          <li key={step} className={className} aria-current={!finished && index === current ? 'step' : undefined}>
            {finished ? <span className="tick"><Icon name="check" size={12} /></span> : <span className="dot" />}
            {t(labels[step])}
          </li>
        )
      })}
    </ol>
  )
}
