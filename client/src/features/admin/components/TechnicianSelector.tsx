import { useEffect, useState } from 'react'
import type { AdminIssue, PersonRef } from '../admin.types'

type Props = {
  issue: AdminIssue
  technicians: PersonRef[]
  disabled: boolean
  compact?: boolean
  onAssign: (technicianId: string) => void
}

export function TechnicianSelector({ issue, technicians, disabled, compact, onAssign }: Props) {
  const current = issue.technician?.id ?? ''
  const [selected, setSelected] = useState(current)

  useEffect(() => {
    setSelected(current)
  }, [current])

  const closed = issue.status === 'completed' || issue.status === 'cancelled'

  if (closed) {
    return <span className="muted">{issue.technician?.name ?? 'Unassigned'}</span>
  }

  return (
    <span className="inline">
      <select
        className={compact ? 'select select--sm' : 'select'}
        aria-label={`Technician for ${issue.title}`}
        value={selected}
        disabled={disabled}
        onChange={(event) => setSelected(event.target.value)}
      >
        <option value="">Unassigned</option>
        {technicians.map((technician) => (
          <option key={technician.id} value={technician.id}>{technician.name}</option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn--primary btn--sm"
        disabled={disabled || !selected || selected === current}
        onClick={() => onAssign(selected)}
      >
        {current ? 'Move' : 'Assign'}
      </button>
    </span>
  )
}
