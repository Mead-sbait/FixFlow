import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Icon } from '../../../components/Icon'
import type { IssuePriority, IssueStatus } from '../../../types'
import type { Category, IssueFilters as Filters, PersonRef } from '../admin.types'

type Props = {
  filters: Filters
  technicians: PersonRef[]
  categories: Category[]
  showStatus?: boolean
  showTechnician?: boolean
  onChange: (changes: Partial<Filters>) => void
  onReset: () => void
  children?: ReactNode
}

const statuses: IssueStatus[] = ['open', 'assigned', 'in_progress', 'completed', 'cancelled']
const priorities: IssuePriority[] = ['low', 'medium', 'high', 'urgent']

// the tray along the top of the board
export function IssueFilters({ filters, technicians, categories, showStatus = true, showTechnician = true, onChange, onReset, children }: Props) {
  // keep the text local until the user submits, so we don't hit the API on every key press
  const [search, setSearch] = useState(filters.search)

  useEffect(() => {
    setSearch(filters.search)
  }, [filters.search])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    onChange({ search: search.trim() })
  }

  const dirty = filters.search || filters.status || filters.priority || filters.categoryId || filters.technicianId

  return (
    <form className="board-tray" onSubmit={submitSearch} aria-label="Filter issues">
      <div className="search">
        <Icon name="search" size={16} />
        <input
          className="input input--sm"
          type="search"
          placeholder="Search title, details or location"
          aria-label="Search issues"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {showStatus && (
        <select className="select select--sm" aria-label="Status" value={filters.status} onChange={(event) => onChange({ status: event.target.value as IssueStatus | '' })}>
          <option value="">Any status</option>
          {statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
        </select>
      )}

      <select className="select select--sm" aria-label="Priority" value={filters.priority} onChange={(event) => onChange({ priority: event.target.value as IssuePriority | '' })}>
        <option value="">Any priority</option>
        {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </select>

      <select className="select select--sm" aria-label="Category" value={filters.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
        <option value="">Any category</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>

      {showTechnician && (
        <select className="select select--sm" aria-label="Technician" value={filters.technicianId} onChange={(event) => onChange({ technicianId: event.target.value })}>
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
        </select>
      )}

      <button type="submit" className="btn btn--secondary btn--sm">Search</button>
      {dirty && <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}><Icon name="x" size={14} /> Clear</button>}

      {children}
    </form>
  )
}
