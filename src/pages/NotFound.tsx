import { Link } from 'react-router-dom'
import { ArrowRight, Compass } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useSeo } from '../hooks/useSeo'

export default function NotFound() {
  const { t } = useLanguage()
  useSeo(t('notfound_title'), t('notfound_text'), { noindex: true })

  return (
    <div className="max-w-xl mx-auto px-5 py-24 md:py-32 text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-light text-green flex items-center justify-center mx-auto">
        <Compass size={30} />
      </div>
      <p className="mt-6 text-[64px] md:text-[80px] leading-none font-extrabold text-ink tracking-tight">404</p>
      <h1 className="mt-4 text-[22px] md:text-[26px] font-extrabold text-ink">{t('notfound_title')}</h1>
      <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">{t('notfound_text')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark transition-colors">
          {t('nav_home')}
        </Link>
        <Link to="/restaurants" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-border bg-white text-ink font-bold text-[15px] hover:bg-cream-2 transition-colors">
          {t('nav_restaurants')}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
