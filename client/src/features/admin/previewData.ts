import type { AdminIssue, AdminStats, CategorySummary, PersonSummary } from '../../types'

export const previewTechnicians: PersonSummary[] = [
  { id: 'tech-nora', name: 'Nora Haddad', email: 'nora@fixflow.test' },
  { id: 'tech-omar', name: 'Omar Khalil', email: 'omar@fixflow.test' },
  { id: 'tech-rana', name: 'Rana Saleh', email: 'rana@fixflow.test' }
]

export const previewCategories: CategorySummary[] = [
  { id: 'cat-electrical', name: 'Electrical' },
  { id: 'cat-plumbing', name: 'Plumbing' },
  { id: 'cat-hvac', name: 'HVAC' },
  { id: 'cat-safety', name: 'Safety' }
]

const reporters: PersonSummary[] = [
  { id: 'user-1', name: 'Leen Mansour', email: 'leen@fixflow.test' },
  { id: 'user-2', name: 'Yousef Darwish', email: 'yousef@fixflow.test' },
  { id: 'user-3', name: 'Maya Odeh', email: 'maya@fixflow.test' }
]

export const previewIssues: AdminIssue[] = [
  {
    id: 'FF-1048',
    title: 'Water leaking below kitchen sink',
    description: 'A steady leak is collecting inside the cabinet and has started reaching the floor.',
    location: 'Building A · Kitchen 2',
    status: 'open',
    priority: 'urgent',
    reporter: reporters[0],
    technician: null,
    category: previewCategories[1],
    createdAt: '2026-09-21T06:35:00.000Z',
    updatedAt: '2026-09-21T06:35:00.000Z'
  },
  {
    id: 'FF-1047',
    title: 'Hallway lights flicker after 18:00',
    description: 'The north hallway lights flicker together for several minutes each evening.',
    location: 'Building C · Floor 3',
    status: 'assigned',
    priority: 'high',
    reporter: reporters[1],
    technician: previewTechnicians[0],
    category: previewCategories[0],
    createdAt: '2026-09-21T05:10:00.000Z',
    updatedAt: '2026-09-21T07:05:00.000Z'
  },
  {
    id: 'FF-1046',
    title: 'Air conditioner not cooling',
    description: 'The unit runs, but the room temperature has not dropped since yesterday.',
    location: 'Main office · Meeting room',
    status: 'in_progress',
    priority: 'high',
    reporter: reporters[2],
    technician: previewTechnicians[1],
    category: previewCategories[2],
    createdAt: '2026-09-20T12:40:00.000Z',
    updatedAt: '2026-09-21T06:50:00.000Z'
  },
  {
    id: 'FF-1045',
    title: 'Loose handrail near west stairs',
    description: 'The upper mounting point moves when pressure is applied to the rail.',
    location: 'Building B · West stairs',
    status: 'open',
    priority: 'urgent',
    reporter: reporters[0],
    technician: null,
    category: previewCategories[3],
    createdAt: '2026-09-20T09:20:00.000Z',
    updatedAt: '2026-09-20T09:20:00.000Z'
  },
  {
    id: 'FF-1044',
    title: 'Restroom tap keeps running',
    description: 'The tap does not close fully and continues running at a low flow.',
    location: 'Building A · Floor 1',
    status: 'assigned',
    priority: 'medium',
    reporter: reporters[1],
    technician: previewTechnicians[2],
    category: previewCategories[1],
    createdAt: '2026-09-19T14:05:00.000Z',
    updatedAt: '2026-09-20T10:15:00.000Z'
  },
  {
    id: 'FF-1043',
    title: 'Replace damaged wall outlet cover',
    description: 'The plastic cover is cracked but the outlet is still working.',
    location: 'Training room 4',
    status: 'completed',
    priority: 'low',
    reporter: reporters[2],
    technician: previewTechnicians[0],
    category: previewCategories[0],
    createdAt: '2026-09-18T08:30:00.000Z',
    updatedAt: '2026-09-20T13:40:00.000Z'
  },
  {
    id: 'FF-1042',
    title: 'Ventilation noise in storage room',
    description: 'A rattling sound starts whenever the ventilation system switches to high speed.',
    location: 'Warehouse · Storage 7',
    status: 'cancelled',
    priority: 'medium',
    reporter: reporters[0],
    technician: null,
    category: previewCategories[2],
    createdAt: '2026-09-17T11:25:00.000Z',
    updatedAt: '2026-09-18T09:10:00.000Z'
  }
]

export const previewStats: AdminStats = {
  total: previewIssues.length,
  open: previewIssues.filter((issue) => issue.status === 'open').length,
  assigned: previewIssues.filter((issue) => issue.status === 'assigned').length,
  inProgress: previewIssues.filter((issue) => issue.status === 'in_progress').length,
  completed: previewIssues.filter((issue) => issue.status === 'completed').length,
  urgent: previewIssues.filter((issue) => issue.priority === 'urgent' && !['completed', 'cancelled'].includes(issue.status)).length,
  unassigned: previewIssues.filter((issue) => !issue.technician && !['completed', 'cancelled'].includes(issue.status)).length
}
