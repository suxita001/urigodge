import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map as MapIcon, User, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import { loginPathFor } from '../utils/redirect'
import type { TranslationKey } from '../i18n/translations'

/**
 * Phones get the main sections as a thumb-reachable bar at the bottom of the screen, like an app.
 * Its height lives in the --tabbar-h CSS variable so fixed elements (chat button, map sheet) sit above it.
 */
export default function MobileTabBar() {
  const { t } = useLanguage()
  const { pathname, search } = useLocation()
  const { currentUser } = useAuth()

  const tabs: { to: string; icon: LucideIcon; label: TranslationKey; end?: boolean; match?: (p: string) => boolean }[] = [
    { to: '/', icon: Home, label: 'nav_home', end: true },
    { to: '/restaurants', icon: UtensilsCrossed, label: 'nav_restaurants', match: (p) => p.startsWith('/restaurants') || p.startsWith('/dishes') || p.startsWith('/cuisines') || p.startsWith('/areas') },
    { to: '/map', icon: MapIcon, label: 'nav_map' },
    currentUser
      ? { to: '/profile', icon: User, label: 'tab_profile' }
      : { to: ['/login', '/register'].includes(pathname) ? '/login' : loginPathFor(pathname + search), icon: User, label: 'nav_login', match: (p) => p === '/login' || p === '/register' || p === '/forgot-password' },
  ]

  return (
    <nav
      data-tabbar
      aria-label={t('tab_nav')}
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-cream/85 backdrop-blur-xl backdrop-saturate-150 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(28,26,22,0.18)]"
    >
      <ul className="grid grid-cols-4 h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const forced = tab.match ? tab.match(pathname) : undefined
          return (
            <li key={tab.label}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) => {
                  const on = forced ?? isActive
                  return `h-full flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${on ? 'text-green' : 'text-ink-faint active:text-ink'}`
                }}
              >
                {({ isActive }) => {
                  const on = forced ?? isActive
                  return (
                    <>
                      <span className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ${on ? 'bg-green-light' : ''}`}>
                        <tab.icon size={20} strokeWidth={on ? 2.4 : 2} />
                      </span>
                      <span className="leading-none truncate max-w-full px-1">{t(tab.label)}</span>
                    </>
                  )
                }}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
