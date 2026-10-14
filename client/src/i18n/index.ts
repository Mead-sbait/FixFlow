import { createContext, useContext } from 'react'
import { ar, type TranslationKey } from './ar'
import { he } from './he'

export type Lang = 'he' | 'ar'

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { he, ar }
export const LANG_STORAGE_KEY = 'fixflow.lang'

export const languages: { code: Lang; label: string; locale: string }[] = [
  { code: 'he', label: 'עברית', locale: 'he-IL' },
  { code: 'ar', label: 'العربية', locale: 'ar' }
]

export function isLang(value: unknown): value is Lang {
  return value === 'he' || value === 'ar'
}

export function dirFor(lang: Lang): 'rtl' {
  const directions = { ar: 'rtl', he: 'rtl' } as const
  return directions[lang]
}

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    // no storage, fall through
  }
  const browser = navigator.language?.toLowerCase() ?? ''
  if (browser.startsWith('he')) return 'he'
  if (browser.startsWith('ar')) return 'ar'
  return 'ar'
}

// plain string replacement: t('common.by', { name: 'Nora' }) -> 'by Nora'
export function translate(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>) {
  let text: string = dictionaries[lang][key] ?? ar[key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value))
    }
  }
  return text
}

export type I18nValue = {
  lang: Lang
  dir: 'rtl' | 'ltr'
  locale: string
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useT() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useT must be used inside I18nProvider')
  return { ...value,
    category: (name: string | null | undefined) => categoryText(value.lang, name),
    errorMessage: (message: string) => localizedError(value.lang, message),
    notification: (item: { type: string; message: string }) => notificationText(value.lang, item)
  }
}

const errorKeys: Record<string, TranslationKey> = {
  "Could not sign in. Check your email and password.": "login.failed",
  "Could not create the account.": "register.failed",
  "Unable to load your issues": "mine.loadFailed",
  "Unable to report the issue": "report.failed",
  "Unable to load this issue": "issue.loadFailed",
  "Unable to load comments.": "comments.loadFailed",
  "Unable to add comment.": "comments.addFailed",
  "Unable to load issues": "err.loadIssues",
  "Unable to load technicians and categories": "err.loadLookups",
  "Unable to load statistics": "err.loadStats",
  "Unable to assign technician": "err.assign",
  "Unable to update priority": "err.priority",
  "Unable to update status": "err.status",
  "Unable to load users": "err.loadUsers",
  "Unable to update role": "err.role",
  "Unable to load categories": "err.categories",
  "Invalid email or password": "login.failed",
  "Email is already registered": "err.emailUsed",
  "Unable to create account": "register.failed",
  "Unable to login": "login.failed",
  "Unable to load issue": "issue.loadFailed",
  "Unable to load assigned issues": "err.loadIssues",
  "Unable to update issue status": "err.status",
  "Unable to load notifications": "err.notifications",
  "Unable to update notification": "err.notificationUpdate",
  "Issue not found": "issue.notFound",
  "Authentication required": "err.session",
  "You cannot change your own role": "err.ownRole",
  "Category does not exist": "err.categories",
  "Selected user is not a technician": "err.assign",
  "Unable to create issue": "report.failed"
}

export function localizedError(lang: Lang, message: string) {
  if (message in ar) return translate(lang, message as TranslationKey)
  const key = errorKeys[message]
  if (key) return translate(lang, key)
  if (message.startsWith('Invalid ') || message.startsWith('A valid ')) return translate(lang, 'err.validation')
  if (message.startsWith('Cannot ')) return translate(lang, 'err.conflict')
  // Re-render an already displayed system message in the newly selected language.
  for (const dictionary of [ar, he]) {
    const entry = Object.entries(dictionary).find(([, text]) => text === message)
    if (entry) return translate(lang, entry[0] as TranslationKey)
  }
  return translate(lang, 'err.generic')
}

export function categoryText(lang: Lang, name: string | null | undefined) {
  if (!name) return translate(lang, 'common.noCategory')
  const aliases: Record<string, TranslationKey> = {
    electrical: 'category.electrical', plumbing: 'category.plumbing', hvac: 'category.hvac',
    furniture: 'category.furniture', 'general maintenance': 'category.general',
    'كهرباء': 'category.electrical', 'سباكة': 'category.plumbing', 'تكييف': 'category.hvac'
  }
  const key = aliases[name.trim().toLowerCase()] ?? (Object.keys(ar) as TranslationKey[]).find(key => key.startsWith('category.') && (ar[key] === name || he[key] === name))
  // Custom category names are user data; only built-in names are translated.
  return key ? translate(lang, key) : name
}

export function notificationText(lang: Lang, item: { type: string; message: string }) {
  const keys: Record<string, TranslationKey> = {
    issue_assigned: 'notif.assigned', issue_unassigned: 'notif.unassigned',
    issue_completed: 'notif.completed', issue_cancelled: 'notif.cancelled', issue_reopened: 'notif.reopened',
    issue_updated: 'notif.updated', comment_added: 'notif.comment'
  }
  let key = keys[item.type] ?? 'notif.updated'
  if (item.type === 'issue_updated' && item.message === 'Issue status changed to in progress.') key = 'notif.started'
  if (item.type === 'issue_updated' && item.message === 'Issue status changed to completed.') key = 'notif.completed'
  const title = item.message.match(/"([\s\S]+)"/u)?.[1]
  return translate(lang, key) + (title ? ` «${title}»` : '')
}
