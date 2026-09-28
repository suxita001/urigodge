import { Link } from 'react-router-dom'
import { InstagramIcon, FacebookIcon } from './SocialIcons'
import Logo from './Logo'
import { useLanguage } from '../i18n/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-border bg-cream-2/60 mt-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10">
          <div>
            <Logo />
            <p className="mt-4 text-[14.5px] leading-relaxed text-ink-soft max-w-xs">{t('footer_desc')}</p>
            <div className="flex items-center gap-2 mt-5">
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft hover:text-green hover:border-green transition-colors"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft hover:text-green hover:border-green transition-colors"
              >
                <FacebookIcon size={16} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-ink-faint mb-4">{t('footer_explore')}</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/" className="text-[14.5px] text-ink-soft hover:text-green transition-colors">{t('nav_home')}</Link></li>
              <li><Link to="/map" className="text-[14.5px] text-ink-soft hover:text-green transition-colors">{t('nav_map')}</Link></li>
              <li><Link to="/restaurants" className="text-[14.5px] text-ink-soft hover:text-green transition-colors">{t('nav_restaurants')}</Link></li>
              <li><Link to="/about" className="text-[14.5px] text-ink-soft hover:text-green transition-colors">{t('nav_about')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-ink-faint mb-4">{t('footer_for_restaurants')}</h3>
            <ul className="flex flex-col gap-3">
              <li><Link to="/about#partners" className="text-[14.5px] text-ink-soft hover:text-green transition-colors">{t('footer_become_partner')}</Link></li>
              <li><Link to="/about#partners" className="text-[14.5px] text-ink-soft hover:text-green transition-colors">{t('footer_add_restaurant')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[13px] text-ink-faint">© {new Date().getFullYear()} urigod.ge — {t('footer_rights')}</p>
        </div>
      </div>
    </footer>
  )
}
