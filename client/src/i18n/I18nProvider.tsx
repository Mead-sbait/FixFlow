import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dirFor, I18nContext, initialLang, LANG_STORAGE_KEY, languages, translate, useT, type I18nValue, type Lang } from './index'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  // the whole document flips direction, not just the react tree
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dirFor(lang)
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      // fine, it just will not stick
    }
  }, [])

  const value = useMemo<I18nValue>(() => ({
    lang,
    dir: dirFor(lang),
    locale: languages.find((item) => item.code === lang)?.locale ?? 'en-GB',
    setLang,
    t: (key, vars) => translate(lang, key, vars)
  }), [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// small switch used in the frame and on the auth pages
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useT()
  return (
    <div className={className ? `lang-switch ${className}` : 'lang-switch'} role="group" aria-label={t('common.language')}>
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          lang={item.code}
          aria-pressed={lang === item.code}
          onClick={() => setLang(item.code)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
