import type { IssuePriority, IssueStatus } from '../types'

export const statusLabels: Record<IssueStatus, string> = {
  open: 'مفتوح', assigned: 'تم تعيين فني', in_progress: 'قيد العمل',
  completed: 'مكتمل', cancelled: 'ملغى',
}

export const priorityLabels: Record<IssuePriority, string> = {
  low: 'منخفضة', medium: 'متوسطة', high: 'مرتفعة', urgent: 'عاجلة',
}
