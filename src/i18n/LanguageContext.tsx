import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { translations, type TranslationKey } from './translations'
import type { Lang, LocalizedText } from '../data/types'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  tx: (text: LocalizedText) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const STORAGE_KEY = 'urigod-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'ka'
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'en' || stored === 'ka' ? stored : 'ka'
  })

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const toggleLang = useCallback(() => setLangState((prev) => (prev === 'ka' ? 'en' : 'ka')), [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let str: string = translations[lang][key] ?? translations.ka[key]
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, String(v))
        })
      }
      return str
    },
    [lang]
  )

  const tx = useCallback((text: LocalizedText) => text[lang] ?? text.ka, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, tx }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
