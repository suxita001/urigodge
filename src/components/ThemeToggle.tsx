import { Moon, Sun } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle({ className = '', onPhoto = false }: { className?: string; onPhoto?: boolean }) {
  const { t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? t('theme_light') : t('theme_dark')
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${
        onPhoto ? 'border-snow/30 text-snow/85 hover:bg-snow/15 hover:text-snow' : 'border-border text-ink-soft hover:bg-cream-2 hover:text-ink'
      } ${className}`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
