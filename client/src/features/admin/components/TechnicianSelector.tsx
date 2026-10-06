import { useEffect, useState } from 'react'
import type { AdminIssue, PersonRef } from '../admin.types'

type Props = {
  issue: AdminIssue
  technicians: PersonRef[]
  disabled: boolean
  onAssign: (technicianId: string) => void
}

export function TechnicianSelector({ issue, technicians, disabled, onAssign }: Props) {
  const current = issue.technician?.id ?? ''
  const [selected, setSelected] = useState(current)

  useEffect(() => {
    setSelected(current)
  }, [current])

  const closed = issue.status === 'completed' || issue.status === 'cancelled'

  if (closed) {
    return <span>{issue.technician?.name ?? 'Unassigned'}</span>
  }

  return (
    <div className="assign-cell">
      <select value={selected} disabled={disabled} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Unassigned</option>
        {technicians.map((technician) => (
          <option key={technician.id} value={technician.id}>{technician.name}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={disabled || !selected || selected === current}
        onClick={() => onAssign(selected)}
      >
        {current ? 'Reassign' : 'Assign'}
      </button>
    </div>
  )
}
