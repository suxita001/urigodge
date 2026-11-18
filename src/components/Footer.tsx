import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { InstagramIcon, FacebookIcon } from './SocialIcons'
import Logo from './Logo'
import InstallButton from './InstallButton'
import { useLanguage } from '../i18n/LanguageContext'
import { SOCIAL_LINKS } from '../lib/site'

export default function Footer() {
  const { t, lang } = useLanguage()
  const socials = [
    { href: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: SOCIAL_LINKS.facebook, label: 'Facebook', Icon: FacebookIcon },
  ].filter((s) => s.href)

  const explore = [
    { to: '/', label: t('nav_home') },
    { to: '/restaurants', label: t('nav_restaurants') },
    { to: '/map', label: t('nav_map') },
    { to: '/about', label: t('nav_about') },
  ]
  const owners = [
    { to: '/about#partners', label: t('footer_become_partner') },
    { to: '/about#partners', label: t('footer_add_restaurant') },
    { to: '/terms', label: t('terms_title') },
  ]
  const linkClass = 'group inline-flex items-center gap-1 text-[14.5px] text-ink-soft hover:text-green transition-colors'

  return (
    <footer className="relative mt-20 md:mt-28 border-t border-border bg-cream-2/50">
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr] gap-x-6 gap-y-10">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-[20px] md:text-[22px] font-extrabold tracking-tight text-ink leading-snug">{t('footer_tagline')}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft max-w-sm">{t('footer_desc')}</p>
            {socials.length > 0 && (
              <div className="flex items-center gap-2 mt-5">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center text-ink-soft hover:text-green hover:border-green transition-colors"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            )}
            <InstallButton />
          </div>

          {[
            { title: t('footer_explore'), items: explore },
            { title: t('footer_for_restaurants'), items: owners },
          ].map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-ink-faint mb-4">{col.title}</h3>
              <ul className="flex flex-col gap-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className={linkClass}>
                      {item.label}
                      <ArrowUpRight size={13} className="opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12.5px] text-ink-faint">
            © {new Date().getFullYear()} urigod.ge — {t('footer_rights')}
          </p>
          <p className="text-[12.5px] text-ink-faint">{lang === 'ka' ? 'თბილისი · საქართველო' : 'Tbilisi · Georgia'}</p>
        </div>
      </div>
    </footer>
  )
}
