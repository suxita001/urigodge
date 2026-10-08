import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeValue {
  theme: Theme
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeValue | null>(null)

const KEY = 'urigod-theme'
const META_COLOR: Record<Theme, string> = { light: '#faf7f1', dark: '#131210' }

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

const systemTheme = (): Theme => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

/** Night mode: follows the device until the visitor picks one with the toggle, then remembers it. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStored() ?? systemTheme())
  const [chosen, setChosen] = useState(() => readStored() !== null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', META_COLOR[theme])
  }, [theme])

  useEffect(() => {
    if (chosen) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [chosen])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setChosen(true)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* private mode: the choice just lasts for this visit */
    }
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
