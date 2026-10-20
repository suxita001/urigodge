import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const MARK = `${import.meta.env.BASE_URL}icon-512.png`

/** Shown to visitors while an admin has the site switched off. */
export default function Maintenance({ message }: { message: string }) {
  const { t } = useLanguage()

  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]')
    const before = robots?.getAttribute('content')
    robots?.setAttribute('content', 'noindex, nofollow')
    document.title = `${t('maintenance_title')} | urigod.ge`
    return () => {
      if (before) robots?.setAttribute('content', before)
    }
  }, [t])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center bg-cream relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-green-light blur-3xl opacity-70" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-40 w-[460px] h-[460px] rounded-full bg-terracotta-light blur-3xl opacity-50" aria-hidden="true" />
      <div className="relative">
        <img src={MARK} alt="urigod.ge" width={112} height={112} className="keep-bright w-28 h-28 rounded-full mx-auto shadow-card" />
        <span className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-light text-green text-[13px] font-bold">
          <Wrench size={15} />
          {t('maintenance_badge')}
        </span>
        <h1 className="mt-5 text-[30px] md:text-[42px] font-extrabold text-ink tracking-tight leading-tight max-w-xl mx-auto text-balance">{t('maintenance_title')}</h1>
        <p className="mt-4 text-[16px] md:text-[17px] text-ink-soft leading-relaxed max-w-md mx-auto whitespace-pre-line">{message || t('maintenance_text')}</p>
        <Link to="/login" className="mt-12 inline-block text-[12.5px] font-semibold text-ink-faint hover:text-green">
          {t('maintenance_staff')}
        </Link>
      </div>
    </div>
  )
}
