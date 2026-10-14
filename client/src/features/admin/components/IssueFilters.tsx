import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Icon } from '../../../components/Icon'
import { useT } from '../../../i18n'
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
  const { t, category: categoryLabel } = useT()
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
    <form className="board-tray" onSubmit={submitSearch} aria-label={t('filters.label')}>
      <div className="search">
        <Icon name="search" size={16} />
        <input
          className="input input--sm"
          type="search"
          placeholder={t('filters.searchPlaceholder')}
          aria-label={t('filters.searchLabel')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {showStatus && (
        <select className="select select--sm" aria-label={t('filters.status')} value={filters.status} onChange={(event) => onChange({ status: event.target.value as IssueStatus | '' })}>
          <option value="">{t('filters.anyStatus')}</option>
          {statuses.map((status) => <option key={status} value={status}>{t(`status.${status}`)}</option>)}
        </select>
      )}

      <select className="select select--sm" aria-label={t('filters.priority')} value={filters.priority} onChange={(event) => onChange({ priority: event.target.value as IssuePriority | '' })}>
        <option value="">{t('filters.anyPriority')}</option>
        {priorities.map((priority) => <option key={priority} value={priority}>{t(`priority.${priority}`)}</option>)}
      </select>

      <div className="category-picker">
          <Icon name="board" size={18} />
          <select className="select select--sm category-picker__select" aria-label={t('filters.category')} value={filters.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
        <option value="">{t('filters.anyCategory')}</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{categoryLabel(category.name)}</option>)}
      </select>
        </div>

      {showTechnician && (
        <select className="select select--sm" aria-label={t('filters.technician')} value={filters.technicianId} onChange={(event) => onChange({ technicianId: event.target.value })}>
          <option value="">{t('filters.anyone')}</option>
          <option value="unassigned">{t('filters.unassigned')}</option>
          {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
        </select>
      )}

      <button type="submit" className="btn btn--secondary btn--sm">{t('common.search')}</button>
      {dirty && <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}><Icon name="x" size={14} /> {t('common.clear')}</button>}

      {children}
    </form>
  )
}
