import { createContext, useContext } from 'react'
import { ar } from './ar'
import { en, type TranslationKey } from './en'
import { he } from './he'

export type Lang = 'en' | 'he' | 'ar'

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, he, ar }
export const LANG_STORAGE_KEY = 'fixflow.lang'

export const languages: { code: Lang; label: string; locale: string }[] = [
  { code: 'en', label: 'English', locale: 'en-GB' },
  { code: 'he', label: 'עברית', locale: 'he-IL' },
  { code: 'ar', label: 'العربية', locale: 'ar' }
]

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'he' || value === 'ar'
}

export function dirFor(lang: Lang) {
  return lang === 'en' ? 'ltr' : 'rtl'
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
  return 'en'
}

// plain string replacement: t('common.by', { name: 'Nora' }) -> 'by Nora'
export function translate(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>) {
  let text: string = dictionaries[lang][key] ?? en[key] ?? key
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
  return value
}
