import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { User, Heart, Settings, LogOut, ShieldCheck, ChevronDown, Crown, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../i18n/LanguageContext'
import Avatar from './ui/Avatar'

export default function UserMenu() {
  const { currentUser, profile, isAdmin, isSuperAdmin, isRestaurantManager, isStaff, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!currentUser) return null

  const name = profile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || ''
  const email = currentUser.email ?? ''

  async function handleLogout() {
    setOpen(false)
    // Leave protected pages first, otherwise their guard redirects to /login on sign-out.
    navigate('/', { replace: true })
    await logout()
  }

  type Entry = { to: string; icon: typeof User; label: string; emoji?: string } | { divider: true } | { badge: true }
  const items: Entry[] = [
    { to: '/profile', icon: User, label: t('menu_profile') },
    ...(isRestaurantManager ? [] : [{ to: '/profile#favorites', icon: Heart, label: t('menu_saved') }]),
    ...(isStaff ? ([{ divider: true }] as Entry[]) : []),
    ...(isSuperAdmin ? ([{ badge: true }] as Entry[]) : []),
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: t('menu_admin'), emoji: '⚙️' }] : []),
    ...(isRestaurantManager ? [{ to: '/admin', icon: UtensilsCrossed, label: t('menu_restaurant_manage'), emoji: '🍽️' }] : []),
    ...(isStaff ? ([{ divider: true }] as Entry[]) : []),
    { to: '/profile#settings', icon: Settings, label: t('menu_settings') },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('menu_profile')}
        className="flex items-center gap-1 h-10 pl-0.5 pr-1.5 md:pr-2 rounded-full border border-border bg-white hover:bg-cream-2 transition-colors"
      >
        <Avatar name={name} size={34} />
        <ChevronDown size={15} className={`hidden md:block text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-32px)] origin-top-right bg-white rounded-2xl border border-border shadow-card-hover overflow-hidden z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-cream/60">
              <Avatar name={name} size={40} />
              <div className="min-w-0">
                <p className="font-bold text-[14.5px] text-ink truncate">{name}</p>
                <p className="text-[12.5px] text-ink-faint truncate">{email}</p>
              </div>
            </div>
            <ul className="py-1.5">
              {items.map((entry, i) => {
                if ('divider' in entry) return <li key={`d${i}`} className="my-1.5 border-t border-border" aria-hidden="true" />
                if ('badge' in entry)
                  return (
                    <li key="badge" className="px-4 pt-1 pb-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink text-cream text-[12px] font-bold">
                        <Crown size={13} className="text-[#e3b95f]" /> Super Admin
                      </span>
                    </li>
                  )
                const { to, icon: Icon, label, emoji } = entry
                return (
                  <li key={to + label}>
                    <Link
                      to={to}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold transition-colors ${
                        emoji ? 'text-ink hover:bg-green-light' : 'text-ink-soft hover:bg-cream-2 hover:text-ink'
                      }`}
                    >
                      {emoji ? <span className="w-[17px] text-center text-[15px] leading-none">{emoji}</span> : <Icon size={17} className="text-ink-faint" />}
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="border-t border-border py-1.5">
              <button
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-terracotta hover:bg-terracotta-light transition-colors"
              >
                <LogOut size={17} />
                {t('menu_logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
