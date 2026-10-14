import { useEffect, useState, type FormEvent } from 'react'
import type { IssuePriority, IssueStatus } from '../../../types'
import type { Category, IssueFilters as Filters, PersonRef } from '../admin.types'

type Props = {
  filters: Filters
  technicians: PersonRef[]
  categories: Category[]
  onChange: (changes: Partial<Filters>) => void
  onReset: () => void
}

const statuses: IssueStatus[] = ['open', 'assigned', 'in_progress', 'completed', 'cancelled']
const priorities: IssuePriority[] = ['low', 'medium', 'high', 'urgent']

export function IssueFilters({ filters, technicians, categories, onChange, onReset }: Props) {
  // keep the text local until the user submits, so we don't hit the API on every key press
  const [search, setSearch] = useState(filters.search)

  useEffect(() => {
    setSearch(filters.search)
  }, [filters.search])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    onChange({ search: search.trim() })
  }

  return (
    <form className="issue-filters" onSubmit={submitSearch}>
      <input
        type="search"
        placeholder="Search title, description or location"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <select value={filters.status} onChange={(event) => onChange({ status: event.target.value as IssueStatus | '' })}>
        <option value="">All statuses</option>
        {statuses.map((status) => (
          <option key={status} value={status}>{status.replace('_', ' ')}</option>
        ))}
      </select>

      <select value={filters.priority} onChange={(event) => onChange({ priority: event.target.value as IssuePriority | '' })}>
        <option value="">All priorities</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>{priority}</option>
        ))}
      </select>

      <select value={filters.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>

      <select value={filters.technicianId} onChange={(event) => onChange({ technicianId: event.target.value })}>
        <option value="">All technicians</option>
        <option value="unassigned">Unassigned</option>
        {technicians.map((technician) => (
          <option key={technician.id} value={technician.id}>{technician.name}</option>
        ))}
      </select>

      <button type="submit">Search</button>
      <button type="button" onClick={onReset}>Clear</button>
    </form>
  )
}
